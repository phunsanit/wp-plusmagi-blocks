const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Sankey', () => {
	test('renders a basic sankey diagram', async ({ page }) => {
		await renderMermaidSourcePreview(page, `sankey

Electricity grid,Heating and cooling - homes,113.726
Electricity grid,Industry,342.165
Electricity grid,Losses,56.691`);
	});
});