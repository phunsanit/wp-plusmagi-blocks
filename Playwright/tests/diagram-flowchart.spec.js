const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Flowchart', () => {
	test('renders a basic flowchart', async ({ page }) => {
		await renderMermaidDiagram(page, `flowchart LR
    Start --> Stop`);
	});
});