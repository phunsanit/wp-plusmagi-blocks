const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Mindmap', () => {
	test('renders a basic mindmap', async ({ page }) => {
		await renderMermaidDiagram(page, `mindmap
  Root
    A
      B
      C`);
	});
});