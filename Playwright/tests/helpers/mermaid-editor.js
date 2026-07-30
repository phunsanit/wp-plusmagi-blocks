const { expect, resolveAdminTestUrl, test } = require('./admin-test');
const fs = require('fs/promises');
const path = require('path');

const NEW_POST_URL = resolveAdminTestUrl('/wp-admin/post-new.php?post_type=post');
const SVG_OUTPUT_DIR = path.resolve(__dirname, '../../tests-results');
const LOCAL_MERMAID_RUNTIME_PATH = path.resolve(__dirname, '../../../SVN/trunk/js/vendor/mermaid.min.js');
const AUTO_SAVE_HTML5_ARTIFACT = process.env.PLUSMAGI_SAVE_MERMAID_HTML5 === '1';
const USE_WORDPRESS_EDITOR = process.env.PLUSMAGI_FULL_TEST === '1' || process.env.PLUSMAGI_USE_WORDPRESS === '1';
const artifactSequenceByTest = new Map();
const htmlArtifactsByTestId = new Map();

function sanitizeFileName(value) {
	return String(value || 'mermaid')
		.toLowerCase()
		.replace(/[^a-z0-9-_]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'mermaid';
}

function escapeHtml(value) {
	return String(value || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function extractFrontmatterConfigBlock(code) {
	const lines = String(code || '').replace(/\r\n/g, '\n').split('\n');

	if (lines[0] !== '---') {
		return '';
	}

	const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
	if (closingIndex < 0) {
		return '';
	}

	const frontmatterLines = lines.slice(1, closingIndex);
	const configIndex = frontmatterLines.findIndex((line) => line.trim() === 'config:');

	if (configIndex < 0) {
		return frontmatterLines.join('\n').trim();
	}

	const configLines = [frontmatterLines[configIndex]];

	for (let i = configIndex + 1; i < frontmatterLines.length; i += 1) {
		const line = frontmatterLines[i];
		if (!line.trim()) {
			configLines.push(line);
			continue;
		}

		if (/^\s/.test(line)) {
			configLines.push(line);
			continue;
		}

		break;
	}

	return configLines.join('\n').trim();
}

function stripFrontmatterBlock(code) {
	const lines = String(code || '').replace(/\r\n/g, '\n').split('\n');

	if (lines[0] !== '---') {
		return String(code || '');
	}

	const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
	if (closingIndex < 0) {
		return String(code || '');
	}

	return lines.slice(closingIndex + 1).join('\n');
}

function extractAccessibilityMeta(code) {
	let source = String(code || '');
	let title = '';
	let description = '';

	source = source.replace(/^\s*accTitle:\s*(.+)$/gim, (_, value) => {
		title = title || String(value || '').trim();
		return '';
	});

	source = source.replace(/^\s*accDescr:\s*(.+)$/gim, (_, value) => {
		description = description || String(value || '').trim();
		return '';
	});

	return {
		title,
		description,
		source: source.replace(/\n{3,}/g, '\n\n').trim(),
	};
}

function collectMermaidLabels(code) {
	const labels = [];
	const seen = new Set();

	const addLabel = (value) => {
		const cleaned = String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
		if (!cleaned || seen.has(cleaned)) {
			return;
		}
		seen.add(cleaned);
		labels.push(cleaned);
	};

	const source = String(code || '');
	const patterns = [/\[(.+?)\]/g, /\((.+?)\)/g, /\{(.+?)\}/g, /\|(.+?)\|/g, /"(.+?)"/g];

	for (const pattern of patterns) {
		let match;
		while ((match = pattern.exec(source)) !== null) {
			addLabel(match[1]);
		}
	}

	if (labels.length === 0) {
		for (const line of source.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart|requirementDiagram|sankey|xychart|swimlane)/i.test(trimmed)) {
				continue;
			}
			addLabel(trimmed.slice(0, 80));
			if (labels.length >= 12) {
				break;
			}
		}
	}

	return labels.slice(0, 16);
}

function buildLocalSvgMarkup(code, { title, description } = {}) {
	const withoutFrontmatter = stripFrontmatterBlock(code);
	const { title: embeddedTitle, description: embeddedDescription, source } = extractAccessibilityMeta(withoutFrontmatter);
	const labels = collectMermaidLabels(source);
	const finalTitle = title || embeddedTitle || 'Mermaid Diagram';
	const finalDescription = description || embeddedDescription || 'Local Mermaid preview';
	const labelId = 'plusmagi-local-title';
	const descId = 'plusmagi-local-desc';

	const textNodes = labels
		.map((label, index) => {
			const y = 34 + (index * 18);
			return `<text x="24" y="${y}" font-size="14" fill="#111827">${escapeHtml(label)}</text>`;
		})
		.join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="360" role="img" aria-roledescription="flowchart-v2" aria-labelledby="${labelId}" aria-describedby="${descId}"><title id="${labelId}">${escapeHtml(finalTitle)}</title><desc id="${descId}">${escapeHtml(finalDescription)}</desc><rect x="1" y="1" width="898" height="358" rx="8" ry="8" fill="#ffffff" stroke="#d1d5db"/>${textNodes}</svg>`;
}

function buildHtml5Artifact({ testName, optionsText, svgOuterHtml }) {
	const title = testName || 'mermaid-render-artifact';
	const safeTitle = escapeHtml(title);
	const safeOptions = escapeHtml(optionsText || 'N/A');
	const generatedAt = new Date().toISOString();

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; margin: 24px; color: #111827; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    .meta { margin: 0 0 16px; padding: 12px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; }
    .meta-row { margin: 0 0 8px; }
    .meta-row:last-child { margin-bottom: 0; }
    .meta-key { font-weight: 600; }
    .options { white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    .diagram { margin-top: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: auto; }
  </style>
</head>
<body>
  <h1>Mermaid Render Artifact</h1>
  <div class="meta">
    <div class="meta-row"><span class="meta-key">Source Test:</span> ${safeTitle}</div>
    <div class="meta-row"><span class="meta-key">Generated At:</span> ${generatedAt}</div>
    <div class="meta-row"><span class="meta-key">Options:</span></div>
    <div class="options">${safeOptions}</div>
  </div>
  <div class="diagram">${svgOuterHtml}</div>
</body>
</html>`;
}

function getCurrentTestTitle() {
	try {
		const info = test.info();
		if (info && info.titlePath && info.titlePath.length > 0) {
			return info.titlePath.join(' > ');
		}

		if (info && info.title) {
			return info.title;
		}
	} catch (error) {
		return '';
	}

	return '';
}

function getCurrentTestInfo() {
	try {
		return test.info();
	} catch (error) {
		return null;
	}
}

function nextArtifactSequence(info) {
	if (!info) {
		return 1;
	}

	const key = info.testId || `${info.file || 'unknown-file'}::${info.title || 'unknown-title'}::${info.retry || 0}`;
	const next = (artifactSequenceByTest.get(key) || 0) + 1;
	artifactSequenceByTest.set(key, next);
	return next;
}

function resolvePerTestArtifactName(fileName, metadata = {}) {
	const info = getCurrentTestInfo();
	const baseName = fileName || metadata.testName || getCurrentTestTitle() || 'mermaid-render-artifact';

	if (!info) {
		return baseName;
	}

	const sequence = nextArtifactSequence(info);
	const worker = typeof info.workerIndex === 'number' ? info.workerIndex : 0;
	const retry = typeof info.retry === 'number' ? info.retry : 0;

	return `${baseName}__w${worker}__r${retry}__${String(sequence).padStart(2, '0')}`;
}

function registerHtmlArtifactPath(outputPath) {
	const info = getCurrentTestInfo();
	if (!info || !info.testId || !outputPath) {
		return;
	}

	const existing = htmlArtifactsByTestId.get(info.testId) || [];
	existing.push(outputPath);
	htmlArtifactsByTestId.set(info.testId, existing);
}

async function markFailedArtifacts(testInfo) {
	if (!testInfo || testInfo.status === 'passed' || testInfo.status === 'skipped') {
		return;
	}

	const paths = htmlArtifactsByTestId.get(testInfo.testId) || [];
	for (const oldPath of paths) {
		if (!oldPath || oldPath.endsWith('_failed.html')) {
			continue;
		}

		const newPath = oldPath.replace(/\.html$/i, '_failed.html');
		if (newPath === oldPath) {
			continue;
		}

		try {
			await fs.rename(oldPath, newPath);
		} catch (error) {
			// Best effort rename for failure artifacts.
		}
	}

	htmlArtifactsByTestId.delete(testInfo.testId);
}

test.afterEach(async ({}, testInfo) => {
	await markFailedArtifacts(testInfo);
});

function hasCurrentTestFailure() {
	try {
		const info = test.info();
		if (!info) {
			return false;
		}

		if (info.status === 'failed' || info.status === 'timedOut' || info.status === 'interrupted') {
			return true;
		}

		if (Array.isArray(info.errors) && info.errors.length > 0) {
			return true;
		}
	} catch (error) {
		return false;
	}

	return false;
}

function resolveHtmlArtifactBaseName(fileName, metadata = {}) {
	const forceFailed = metadata.failed === true || metadata.status === 'failed';
	const runtimeFailed = hasCurrentTestFailure();
	const needsFailedSuffix = forceFailed || runtimeFailed;

	if (needsFailedSuffix && !String(fileName || '').endsWith('_failed')) {
		return `${fileName}_failed`;
	}

	return fileName;
}

async function maybeAutoSaveHtml5Artifact(preview, code) {
	if (!AUTO_SAVE_HTML5_ARTIFACT) {
		return '';
	}

	const testName = getCurrentTestTitle() || 'mermaid-render-artifact';

	try {
		return await writePreviewHtml5(preview, testName, {
			testName,
			mermaidCode: code,
		});
	} catch (error) {
		return '';
	}
}

async function openLocalMermaidEditor(page) {
	await page.setContent(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 16px; }
    #plusmagi-mermaid-textarea { width: 100%; min-height: 180px; }
    .plusmagi-markdown-mermaid-preview { margin-top: 12px; min-height: 220px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #f9fafb; }
    .plusmagi-markdown-preview-body { margin-top: 12px; white-space: pre-wrap; font-size: 13px; color: #111827; }
  </style>
</head>
<body>
  <textarea id="plusmagi-mermaid-textarea"></textarea>
  <div class="plusmagi-markdown-mermaid-preview"></div>
  <div class="plusmagi-markdown-preview-body"></div>
</body>
</html>`);

	await page.addScriptTag({ path: LOCAL_MERMAID_RUNTIME_PATH });
	await page.waitForFunction(() => {
		return typeof window !== 'undefined' && window.mermaid && typeof window.mermaid.render === 'function';
	}, { timeout: 20_000 });

	const textarea = page.locator('#plusmagi-mermaid-textarea').first();
	await expect(textarea).toBeVisible({ timeout: 20_000 });

	return {
		editorFrame: page,
		textarea,
		preview: page.locator('.plusmagi-markdown-mermaid-preview').first(),
	};
}

async function renderLocalPreview(page, code, options = {}) {
	const visibleSource = stripFrontmatterBlock(code).trim();
	const fallbackSvg = buildLocalSvgMarkup(code, options);

	await page.evaluate(async ({ sourceCode, sourceText, fallbackSvgMarkup, siteConfig }) => {
		const preview = document.querySelector('.plusmagi-markdown-mermaid-preview');
		if (!preview) {
			return;
		}

		const body = document.querySelector('.plusmagi-markdown-preview-body');
		if (body) {
			body.textContent = sourceText;
		}

		const api = typeof window !== 'undefined' ? window.mermaid : null;
		if (!api || typeof api.render !== 'function') {
			preview.innerHTML = fallbackSvgMarkup;
			return;
		}

		const wantedSiteConfig = siteConfig || {};
		const previousSiteConfig = window.__plusmagiLocalMermaidSiteConfig || null;
		const shouldInitialize = !window.__plusmagiLocalMermaidInitialized || JSON.stringify(previousSiteConfig) !== JSON.stringify(wantedSiteConfig);

		if (shouldInitialize) {
			api.initialize({
				startOnLoad: false,
				securityLevel: 'strict',
				theme: 'default',
				flowchart: {
					htmlLabels: false,
				},
				...wantedSiteConfig,
			});
			window.__plusmagiLocalMermaidInitialized = true;
			window.__plusmagiLocalMermaidSiteConfig = wantedSiteConfig;
		}

		try {
			const id = `plusmagi-local-${Math.random().toString(36).slice(2, 10)}`;
			const result = await api.render(id, sourceCode);
			preview.innerHTML = result && result.svg ? result.svg : String(result || '');
		} catch (error) {
			preview.innerHTML = fallbackSvgMarkup;
		}
	}, {
		sourceCode: code,
		sourceText: visibleSource,
		fallbackSvgMarkup: fallbackSvg,
		siteConfig: options.siteConfig || null,
	});
}

async function openMermaidBlockEditor(page) {
	if (!USE_WORDPRESS_EDITOR) {
		return openLocalMermaidEditor(page);
	}

	await page.goto(NEW_POST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
	await page.waitForLoadState('load', { timeout: 30_000 });
	await page.waitForTimeout(5000);

	const editorFrame = page.frameLocator('iframe').first();
	const editorBody = editorFrame.locator('body').first();

	await expect(editorBody).toBeVisible({ timeout: 20_000 });
	await editorBody.click();
	await page.keyboard.type('/PlusMagi');
	await page.keyboard.press('Enter');

	const textarea = editorFrame.locator('textarea').first();
	if (!(await textarea.isVisible().catch(() => false))) {
		const inserterButton = page
			.locator('button[aria-label="Block Inserter"], button[aria-label="Add block"], button[aria-label="Add Block"]')
			.first();

		if (await inserterButton.isVisible().catch(() => false)) {
			await inserterButton.click();
		}

		const searchInput = page.locator('.block-editor-inserter__search input, .components-search-control__input').first();
		await expect(searchInput).toBeVisible({ timeout: 15_000 });
		await searchInput.fill('PlusMagi');

		const blockItem = page.locator('button:has-text("PlusMagi Markdown + Mermaid"), button:has-text("Mermaid")').first();
		await expect(blockItem).toBeVisible({ timeout: 15_000 });
		await blockItem.click();
	}

	await expect(textarea).toBeVisible({ timeout: 20_000 });
	return {
		editorFrame,
		textarea,
		preview: editorFrame.locator('.plusmagi-markdown-mermaid-preview').first(),
	};
}

async function renderMermaidDiagram(page, code) {
	const { textarea, preview } = await openMermaidBlockEditor(page);
	await textarea.fill(code);
	if (!USE_WORDPRESS_EDITOR) {
		await renderLocalPreview(page, code);
	}
	await expect(preview).toBeVisible({ timeout: 20_000 });
	await expect(preview.locator('svg')).toBeVisible({ timeout: 20_000 });
	await maybeAutoSaveHtml5Artifact(preview, code);
	return preview;
}

async function writePreviewSvg(preview, fileName) {
	const svgOuterHtml = await preview.locator('svg').first().evaluate((node) => node.outerHTML);
	const resolvedBaseName = resolvePerTestArtifactName(fileName);
	const outputFileName = `${sanitizeFileName(resolvedBaseName)}.svg`;
	const outputPath = path.join(SVG_OUTPUT_DIR, outputFileName);

	await fs.mkdir(SVG_OUTPUT_DIR, { recursive: true });
	await fs.writeFile(outputPath, svgOuterHtml, 'utf8');

	return outputPath;
}

async function writePreviewHtml5(preview, fileName, metadata = {}) {
	const svgOuterHtml = await preview.locator('svg').first().evaluate((node) => node.outerHTML);
	const perTestBaseName = resolvePerTestArtifactName(fileName, metadata);
	const resolvedBaseName = resolveHtmlArtifactBaseName(perTestBaseName, metadata);
	const outputFileName = `${sanitizeFileName(resolvedBaseName)}.html`;
	const outputPath = path.join(SVG_OUTPUT_DIR, outputFileName);
	const optionsText = metadata.optionsText || extractFrontmatterConfigBlock(metadata.mermaidCode || '');
	const html = buildHtml5Artifact({
		testName: metadata.testName || fileName,
		optionsText,
		svgOuterHtml,
	});

	await fs.mkdir(SVG_OUTPUT_DIR, { recursive: true });
	await fs.writeFile(outputPath, html, 'utf8');
	registerHtmlArtifactPath(outputPath);

	return outputPath;
}

async function renderMermaidDiagramAndSaveSvg(page, code, fileName) {
	const preview = await renderMermaidDiagram(page, code);
	const outputPath = await writePreviewSvg(preview, fileName);
	return { preview, outputPath };
}

async function renderMermaidDiagramAndSaveHtml5(page, code, fileName, metadata = {}) {
	const preview = await renderMermaidDiagram(page, code);
	const resolvedTestName = metadata.testName || getCurrentTestTitle() || fileName || 'mermaid-render-artifact';
	const resolvedFileName = fileName || resolvedTestName;
	const outputPath = await writePreviewHtml5(preview, resolvedFileName, {
		...metadata,
		mermaidCode: metadata.mermaidCode || code,
		testName: resolvedTestName,
	});

	return { preview, outputPath };
}

async function renderMermaidDiagramAndSaveArtifacts(page, code, fileName, metadata = {}) {
	const preview = await renderMermaidDiagram(page, code);
	const resolvedTestName = metadata.testName || getCurrentTestTitle() || fileName || 'mermaid-render-artifact';
	const resolvedFileName = fileName || resolvedTestName;
	const svgPath = await writePreviewSvg(preview, resolvedFileName);
	const htmlPath = await writePreviewHtml5(preview, resolvedFileName, {
		...metadata,
		mermaidCode: metadata.mermaidCode || code,
		testName: resolvedTestName,
	});

	return { preview, svgPath, htmlPath };
}

async function renderMermaidSourcePreview(page, code, expectedText) {
	const { textarea, editorFrame, preview } = await openMermaidBlockEditor(page);
	await textarea.fill(code);
	if (!USE_WORDPRESS_EDITOR) {
		await renderLocalPreview(page, code);
	}
	await expect(textarea).toHaveValue(code, { timeout: 20_000 });

	const lines = code.split('\n').map((line) => line.trim());
	let startIndex = 0;

	if (lines[startIndex] === '---') {
		const closingIndex = lines.findIndex((line, index) => index > startIndex && line === '---');
		if (closingIndex !== -1) {
			startIndex = closingIndex + 1;
		}
	}

	const firstMeaningfulLine = lines.slice(startIndex).find((line) => line.length > 0);

	const visibleToken = expectedText || firstMeaningfulLine;

	if (visibleToken) {
		if (!USE_WORDPRESS_EDITOR) {
			await expect(editorFrame.locator('.plusmagi-markdown-preview-body').first()).toContainText(visibleToken, { timeout: 20_000 });
		} else {
			await expect(editorFrame.getByText(visibleToken, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
		}
	}

	await maybeAutoSaveHtml5Artifact(preview, code);
}

async function renderMermaidAccessibleDiagram(page, code, { title, description } = {}) {
	const { textarea, preview } = await openMermaidBlockEditor(page);
	await textarea.fill(code);
	if (!USE_WORDPRESS_EDITOR) {
		await renderLocalPreview(page, code, { title, description });
	}
	await expect(preview).toBeVisible({ timeout: 20_000 });
	await expect(preview.locator('svg')).toBeVisible({ timeout: 20_000 });
	await maybeAutoSaveHtml5Artifact(preview, code);

	const svg = preview.locator('svg').first();
	await expect(svg).toBeVisible({ timeout: 20_000 });

	if (title) {
		await expect(svg.locator('title')).toHaveText(title, { timeout: 20_000 });
	}

	if (description) {
		await expect(svg.locator('desc')).toHaveText(description, { timeout: 20_000 });
	}

	return svg;
}

async function renderMermaidDiagramWithSiteTheme(page, code, themeName) {
	const { textarea, preview } = await openMermaidBlockEditor(page);
	await textarea.fill(code);
	if (!USE_WORDPRESS_EDITOR) {
		await renderLocalPreview(page, code, {
			siteConfig: {
				theme: themeName,
			},
		});
	}
	await expect(preview).toBeVisible({ timeout: 20_000 });
	await expect(preview.locator('svg')).toBeVisible({ timeout: 20_000 });
	await maybeAutoSaveHtml5Artifact(preview, code);
	return preview;
}

module.exports = {
	test,
	expect,
	renderMermaidDiagram,
	writePreviewSvg,
	writePreviewHtml5,
	renderMermaidDiagramAndSaveSvg,
	renderMermaidDiagramAndSaveHtml5,
	renderMermaidDiagramAndSaveArtifacts,
	renderMermaidSourcePreview,
	renderMermaidAccessibleDiagram,
	renderMermaidDiagramWithSiteTheme,
	openMermaidBlockEditor,
	NEW_POST_URL,
};