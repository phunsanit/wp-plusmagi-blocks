const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - GitGraph', () => {
	test('renders a basic git graph', async ({ page }) => {
		await renderMermaidDiagram(page, `gitGraph
   commit
   branch develop
   checkout develop
   commit
   checkout main
   merge develop`);
	});
});