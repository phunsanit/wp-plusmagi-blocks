const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Pie', () => {
	test('renders a basic pie chart', async ({ page }) => {
		await renderMermaidDiagram(page, `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`);
	});
});