const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Packet', () => {
	test('renders a basic packet diagram', async ({ page }) => {
		await renderMermaidSourcePreview(page, `packet
0-15: "Source Port"
16-31: "Destination Port"
32-63: "Sequence Number"
64-95: "Acknowledgment Number"`);
	});
});