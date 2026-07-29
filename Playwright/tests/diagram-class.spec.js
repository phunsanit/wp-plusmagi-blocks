const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Class', () => {
	test('renders a basic class diagram', async ({ page }) => {
		await renderMermaidDiagram(page, `classDiagram
    class Animal
    Animal <|-- Duck`);
	});
});