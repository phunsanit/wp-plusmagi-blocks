const { expect, resolveAdminTestUrl, test } = require('./admin-test');

const NEW_POST_URL = resolveAdminTestUrl('/wp-admin/post-new.php?post_type=post');

async function openMermaidBlockEditor(page) {
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
	await expect(preview).toBeVisible({ timeout: 20_000 });
	await expect(preview.locator('svg')).toBeVisible({ timeout: 20_000 });
	return preview;
}

async function renderMermaidSourcePreview(page, code) {
	const { textarea, editorFrame } = await openMermaidBlockEditor(page);
	await textarea.fill(code);
	await expect(textarea).toHaveValue(code, { timeout: 20_000 });

	const firstMeaningfulLine = code
		.split('\n')
		.map((line) => line.trim())
		.find((line) => line.length > 0);

	if (firstMeaningfulLine) {
		await expect(editorFrame.locator('p').filter({ hasText: firstMeaningfulLine }).first()).toBeVisible({ timeout: 20_000 });
	}
}

async function renderMermaidAccessibleDiagram(page, code, { title, description } = {}) {
	const { textarea, preview } = await openMermaidBlockEditor(page);
	await textarea.fill(code);
	await expect(preview).toBeVisible({ timeout: 20_000 });
	await expect(preview.locator('svg')).toBeVisible({ timeout: 20_000 });

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

module.exports = {
	test,
	expect,
	renderMermaidDiagram,
	renderMermaidSourcePreview,
	renderMermaidAccessibleDiagram,
	openMermaidBlockEditor,
	NEW_POST_URL,
};