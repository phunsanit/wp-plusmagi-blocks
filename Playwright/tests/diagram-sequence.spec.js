const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Sequence', () => {
	test('renders a basic sequence diagram', async ({ page }) => {
		await renderMermaidDiagram(page, `sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!`);
	});
});