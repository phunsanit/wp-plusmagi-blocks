const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Venn', () => {
	test('renders a basic venn diagram', async ({ page }) => {
		await renderMermaidSourcePreview(page, `venn-beta
  title "Team overlap"
  set Frontend
  set Backend
  union Frontend,Backend["APIs"]`);
	});
});