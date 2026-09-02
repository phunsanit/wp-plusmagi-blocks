const { test, renderMermaidDiagram, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');
const options = require('./options.json');

const {
	syntaxCases,
	sankeyOptionCases,
} = options.diagramSankey;

test.describe('Mermaid diagram - Sankey', () => {
	test('renders a basic sankey diagram as SVG', async ({ page }) => {
		await renderMermaidDiagram(page, syntaxCases[0].source);
	});

	for (const syntaxCase of syntaxCases) {
		test(`supports sankey syntax: ${syntaxCase.name}`, async ({ page }) => {
			await renderMermaidSourcePreview(page, syntaxCase.source, syntaxCase.expectedText);
		});
	}

	for (const optionCase of sankeyOptionCases) {
		test(`accepts sankey config option: ${optionCase.name}`, async ({ page }) => {
			await renderMermaidSourcePreview(page, `---
config:
  sankey:
${optionCase.line}
---
sankey

Electricity grid,Heating and cooling - homes,113.726
Electricity grid,Industry,342.165
Electricity grid,Losses,56.691`, 'Electricity grid');
		});
	}

	test('accepts custom node colors map', async ({ page }) => {
		await renderMermaidSourcePreview(page, `---
config:
  sankey:
    showValues: false
    nodeColors:
      Electricity grid: "#4e79a7"
      Industry: "#e15759"
      Losses: "#bab0ab"
---
sankey

Electricity grid,Heating and cooling - homes,113.726
Electricity grid,Industry,342.165
Electricity grid,Losses,56.691`, 'Electricity grid');
	});
});