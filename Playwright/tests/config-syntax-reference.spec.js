const { expect, test, renderMermaidDiagram, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');
const options = require('./options.json');

const themeOptions = options.theme;
const defaultTheme = (themeOptions.find((option) => option.default === true) ?? themeOptions[0]).value;
const { syntaxConfigCases } = options.configSyntaxReference;

test.describe('Mermaid config - Syntax reference', () => {
	test('renders a frontmatter diagram with layout and look settings', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
config:
  layout: elk
  look: handDrawn
	theme: ${defaultTheme}
---
flowchart TB
	A[Start] --> B{Decision}
	B -->|Yes| C[Continue]
	B -->|No| D[Stop]`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview.getByText('Start', { exact: true })).toBeVisible();
			await expect(preview.getByText('Decision', { exact: true })).toBeVisible();
			await expect(preview.getByText('Continue', { exact: true })).toBeVisible();
			await expect(preview.getByText('Stop', { exact: true })).toBeVisible();
	});

	for (const syntaxCase of syntaxConfigCases) {
		test(`accepts syntax-reference config: ${syntaxCase.name}`, async ({ page }) => {
			const source = syntaxCase.source.replace(/theme:\s*default/g, `theme: ${defaultTheme}`);
			await renderMermaidSourcePreview(page, source, syntaxCase.expectedText);
		});
	}
});