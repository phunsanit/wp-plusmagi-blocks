const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');
const { MERMAID_DIAGRAMS } = require('./fixtures/mermaid-diagrams');

test.describe('Mermaid diagram catalog', () => {
	for (const { name, source } of MERMAID_DIAGRAMS) {
		test(`renders ${name}`, async ({ page }) => {
			await renderMermaidDiagram(page, source);
		});
	}
});