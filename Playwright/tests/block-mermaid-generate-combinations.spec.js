const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration Paths
const testsDir = __dirname;
const optionsPath = path.join(testsDir, 'options.json');
const outputDir = path.join(testsDir, '../tests-results');
const skipZenumlDiagrams = process.env.SKIP_ZENUML_DIAGRAMS !== '0';

if (!fs.existsSync(optionsPath)) {
	throw new Error(`❌ ไม่พบไฟล์ options.json ที่ path: ${optionsPath}`);
}

const rawOptions = fs.readFileSync(optionsPath, 'utf-8');
const optionsData = JSON.parse(rawOptions);

const METADATA_KEYS_TO_SKIP = new Set([
	'Required',
	'Nullable',
	'Type',
	'definedIn',
	'details',
	'description',
	'tsType',
	'abstract',
	'accessRestrictions',
	'additionalProperties',
	'customProperties',
	'identifiable',
	'status',
	'constraints',
	'enum',
]);

// 1. อ่านและสกัด (Extract) เฉพาะ Mermaid Code จากไฟล์ block-mermaid-config- และ block-mermaid-diagram-
function loadDiagramsFromSpecFiles(dirPath) {
	if (!fs.existsSync(dirPath)) return [];

	const files = fs.readdirSync(dirPath);
	const targetFiles = files.filter(f => {
		const isTargetName = f.startsWith('block-mermaid-config-') || f.startsWith('block-mermaid-diagram-');
		const isSpecFile = f.endsWith('.spec.js') || f.endsWith('.js');
		if (skipZenumlDiagrams && f.startsWith('block-mermaid-diagram-zenuml.')) {
			return false;
		}
		return isTargetName && isSpecFile;
	});

	const extractedDiagrams = [];

	const startsWithMermaid = (text) => {
		const normalized = text.trim();
		const mermaidStart = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|mindmap|timeline|zenuml|quadrantChart|sankey|kanban|block-beta|architecture|packet|requirementDiagram|xychart|radar|treemap|treeview|swimlane)\b/i;

		if (mermaidStart.test(normalized)) {
			return true;
		}

		if (normalized.startsWith('---')) {
			const lines = normalized.split('\n');
			const closingIdx = lines.findIndex((line, idx) => idx > 0 && line.trim() === '---');
			if (closingIdx > 0) {
				const afterFrontmatter = lines.slice(closingIdx + 1).join('\n').trim();
				return mermaidStart.test(afterFrontmatter);
			}
		}

		return false;
	};

	for (const file of targetFiles) {
		const filePath = path.join(dirPath, file);
		const content = fs.readFileSync(filePath, 'utf-8');
		const specName = path.parse(file).name;

		// ดึง template literals ทีละก้อนแล้วคัดเฉพาะ Mermaid code จริง
		const templateLiteralRegex = /`([\s\S]*?)`/g;
		const snippets = [];
		let match;
		while ((match = templateLiteralRegex.exec(content)) !== null) {
			snippets.push(match[1]);
		}

		const mermaidSnippets = snippets
			.map((snippet) => snippet.trim())
			// ตัด dynamic JS template strings ที่ไม่ใช่ Mermaid source จริง
			.filter((snippet) => snippet.includes('${') === false)
			.filter((snippet) => startsWithMermaid(snippet));

		if (mermaidSnippets.length > 0) {
			mermaidSnippets.forEach((cleanContent, index) => {
				extractedDiagrams.push({
					name: `${specName}_block_${index + 1}`,
					content: cleanContent
				});
			});
		} else {
			// ถ้าสกัดด้วย Regex ไม่เจอ ให้ใช้ Fallback Graph แบบสั้นสำหรับ spec file นั้น
			extractedDiagrams.push({
				name: `${specName}_fallback`,
				content: `graph TD;\n	A[${specName}] --> B[Test];`
			});
		}
	}

	return extractedDiagrams;
}

// 2. Metadata & Normalization Helpers
function buildPropertyMetaLookup(data) {
	return ((data || {}).Usage || {}).Property || {};
}

function parseScalarFromLine(lineValue) {
	if (typeof lineValue !== 'string') return undefined;
	const idx = lineValue.indexOf(':');
	if (idx < 0) return undefined;

	const raw = lineValue.slice(idx + 1).trim();
	if (raw.length === 0) return undefined;

	if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
		return raw.slice(1, -1);
	}

	const lower = raw.toLowerCase();
	if (lower === 'true') return true;
	if (lower === 'false') return false;

	const parsed = Number(raw);
	if (Number.isFinite(parsed)) return parsed;

	return raw;
}

function normalizeOptionValue(name, value, propertyMetaLookup) {
	const meta = propertyMetaLookup[name];
	if (!meta || !meta.Type) return value;

	const type = String(meta.Type).toLowerCase();

	if (type.includes('integer') || type === 'number') {
		if (typeof value === 'number' && Number.isFinite(value)) {
			return type.includes('integer') ? Math.trunc(value) : value;
		}
		const parsed = Number(String(value).trim());
		if (Number.isFinite(parsed)) {
			return type.includes('integer') ? Math.trunc(parsed) : parsed;
		}
		if (typeof meta.defaultValue === 'number' && Number.isFinite(meta.defaultValue)) {
			return type.includes('integer') ? Math.trunc(meta.defaultValue) : meta.defaultValue;
		}
		return 1;
	}

	if (type === 'boolean') {
		if (typeof value === 'boolean') return value;
		const lower = String(value).trim().toLowerCase();
		if (lower === 'true') return true;
		if (lower === 'false') return false;
		if (typeof meta.defaultValue === 'boolean') return meta.defaultValue;
		return true;
	}

	if (type.includes('string')) {
		if (typeof value === 'string' && value.trim().length > 0) {
			return value;
		}

		if (typeof meta.defaultValue === 'string' && meta.defaultValue.trim().length > 0) {
			return meta.defaultValue;
		}

		if (Array.isArray(meta.enum) && meta.enum.length > 0) {
			const firstEnum = meta.enum.find((entry) => typeof entry.value === 'string');
			if (firstEnum && typeof firstEnum.value === 'string') {
				return firstEnum.value;
			}
		}

		return String(value);
	}

	return value;
}

// 3. Extract Options
function getFlatOptions(data) {
	const flatOptions = [];

	function extract(obj) {
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				if (METADATA_KEYS_TO_SKIP.has(key)) {
					continue;
				}

				const value = obj[key];
				if (Array.isArray(value)) {
					value.forEach((item, idx) => {
						if (typeof item === 'object' && item !== null) {
							const optName = item.variable || item.name || key || `${key}_${idx}`;
							if (typeof optName !== 'string' || METADATA_KEYS_TO_SKIP.has(optName)) {
								return;
							}

							const parsedFromLine = parseScalarFromLine(item.line);
							const optVal = item.defaultValue !== undefined
								? (item.value ?? item.defaultValue)
								: (item.value ?? parsedFromLine ?? true);

							flatOptions.push({ name: optName, value: optVal });
						} else {
							flatOptions.push({ name: key, value: item });
						}
					});
				} else if (typeof value === 'object' && value !== null) {
					extract(value);
				} else {
					flatOptions.push({ name: key, value });
				}
			}
		}
	}

	extract(data);
	return flatOptions;
}

function sanitizeFileToken(value) {
	const cleaned = String(value).replace(/[^a-zA-Z0-9]/g, '');
	return cleaned.length > 0 ? cleaned : 'empty';
}

function buildSafeBaseFileName(specName, name, value, index) {
	const cleanSpec = sanitizeFileToken(specName);
	const cleanName = sanitizeFileToken(name);
	const cleanVal = sanitizeFileToken(value);
	const digest = crypto
		.createHash('sha1')
		.update(`${specName}::${name}::${value}::${index}`)
		.digest('hex')
		.slice(0, 10);

	const maxCoreLength = 100;
	const core = `${cleanSpec}__${cleanName}_${cleanVal}`.slice(0, maxCoreLength);
	return `failed_${core}__${digest}.html`;
}

// ---------------------------------------------------------
// Execution Block
// ---------------------------------------------------------

test.describe('Mermaid Options Dynamic Combination Tests', () => {
	// สั่งให้รันแบบ Serial เพื่อให้ Log นับจำนวนรวมกันถูกต้อง ไม่ตีกันข้าม Worker
	test.describe.configure({ mode: 'serial' });

	const propertyMetaLookup = buildPropertyMetaLookup(optionsData);
	const flatOptions = getFlatOptions(optionsData).filter((opt) => {
		if (typeof opt.name !== 'string') return false;
		return Object.prototype.hasOwnProperty.call(propertyMetaLookup, opt.name);
	});
	const extractedDiagrams = loadDiagramsFromSpecFiles(testsDir);

	test.beforeAll(() => {
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}
	});

	test('Render Mermaid combinations across all block-mermaid-config-* and block-mermaid-diagram-* spec files', async ({ page }) => {
		if (skipZenumlDiagrams) {
			console.log('⚠️ SKIP_ZENUML_DIAGRAMS=1 -> ข้ามไฟล์ block-mermaid-diagram-zenuml.spec.js');
		}

		console.log(`\n🔍 ดึง Mermaid Code จากไฟล์ block-mermaid-config-*/block-mermaid-diagram-*: รวม ${extractedDiagrams.length} บล็อก`);
		console.log(`⚙️ จำนวน Options ทั้งหมด: ${flatOptions.length} รายการ`);
		const totalCases = flatOptions.length * extractedDiagrams.length;
		console.log(`🚀 รวมทั้งสิ้น ${totalCases} Test Cases\n`);

		await page.setContent(`
			<!DOCTYPE html>
			<html>
			<head>
				<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
				<script src="https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk/dist/mermaid-layout-elk.min.js"></script>
				<script src="https://cdn.jsdelivr.net/npm/@mermaid-js/mermaid-zenuml/dist/mermaid-zenuml.min.js"></script>
			</head>
			<body>
				<div id="container"></div>
			</body>
			</html>
		`);

		let successCount = 0;
		let failCount = 0;
		let currentCase = 0;

		for (const diagramObj of extractedDiagrams) {
			for (let i = 0; i < flatOptions.length; i++) {
				currentCase++;
				const opt = flatOptions[i];
				const normalizedValue = normalizeOptionValue(opt.name, opt.value, propertyMetaLookup);
				const configObj = { [opt.name]: normalizedValue };

				let isSuccess = false;
				let errorMessage = '';

				try {
					await page.evaluate(async ({ diagramContent, config }) => {
						document.getElementById('container').innerHTML = '<div id="generated-svg"></div>';
						window.mermaid.initialize({ startOnLoad: false, ...config });
						await window.mermaid.render('generated-svg', diagramContent);
					}, { diagramContent: diagramObj.content, config: configObj });

					isSuccess = true;
				} catch (err) {
					isSuccess = false;
					errorMessage = err.message;
				}

				if (isSuccess) {
					successCount++;
				} else {
					failCount++;
					const fileName = buildSafeBaseFileName(diagramObj.name, opt.name, normalizedValue, currentCase);
					const filePath = path.join(outputDir, fileName);

					const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>FAILED: ${fileName}</title>
	<style>
		body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
		.error { color: #f48771; background: #2d0000; padding: 15px; border-radius: 5px; border-left: 5px solid #f48771; }
		pre { background: #000; padding: 10px; border-radius: 5px; overflow-x: auto; }
	</style>
</head>
<body>
	<h1>❌ Render Status: FAILED</h1>
	<h3>Spec Diagram Source: <code>${diagramObj.name}</code></h3>
	<h3>Applied Config:</h3>
	<pre><code>${JSON.stringify(configObj, null, 2)}</code></pre>
	<h3>Error Message:</h3>
	<div class="error"><pre><code>${errorMessage}</code></pre></div>
	<h3>Mermaid Code:</h3>
	<pre><code>${diagramObj.content}</code></pre>
</body>
</html>`;

					fs.writeFileSync(filePath, htmlContent, 'utf-8');
					console.log(`❌ [${currentCase}/${totalCases}] FAILED: ${diagramObj.name} + [${opt.name}: ${normalizedValue}]`);
				}
			}
		}

		console.log(`\n🎉 สรุปผลการรันทั้งหมด:`);
		console.log(`- ผ่าน (ไม่บันทึกไฟล์): ${successCount} เคส`);
		console.log(`- ล้มเหลว (บันทึกไฟล์ลง ${outputDir}): ${failCount} เคส`);
	});
});