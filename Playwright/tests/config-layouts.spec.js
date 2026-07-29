const { expect, test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid config - Layouts', () => {
	test('renders an elk-layout flowchart', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
config:
  layout: elk
---
graph TD;
  A-->B;
  B-->C;`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview.getByText('A', { exact: true })).toBeVisible();
			await expect(preview.getByText('B', { exact: true })).toBeVisible();
			await expect(preview.getByText('C', { exact: true })).toBeVisible();
	});
});