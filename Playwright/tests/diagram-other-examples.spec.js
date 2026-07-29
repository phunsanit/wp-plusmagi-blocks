const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Other Examples', () => {
	test('renders a mixed flowchart example', async ({ page }) => {
		await renderMermaidDiagram(page, `flowchart RL
    A@{ shape: manual-input, label: "User Input" }
    B@{ shape: hourglass, label: "Collate" }
    C@{ shape: doc, label: "Document" }
    A --> B --> C`);
	});
});