const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - XY Chart', () => {
	test('renders a basic xy chart', async ({ page }) => {
		await renderMermaidDiagram(page, `xychart
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200]
    line [5000, 6000, 7500, 8200]`);
	});
});