const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');
const options = require('./options.json');

const {
  rootOptionCases,
  sankeyOptionCases,
} = options.configSchemaDocs;


test.describe('Mermaid config - Schema docs', () => {
  const buildFlowchartWithRootConfig = (rootConfigLine) => `---
config:
${rootConfigLine}
---
flowchart TD
  A[Schema Root Options] --> B[Validated]
  B --> C[In Runtime]`;

  for (const optionCase of rootOptionCases) {
    test(`applies schema root option: ${optionCase.name}`, async ({ page }) => {
      await renderMermaidSourcePreview(page, buildFlowchartWithRootConfig(optionCase.line), 'Schema Root Options');
    });
  }

  test('applies schema-listed pie config object', async ({ page }) => {
    await renderMermaidSourcePreview(page, `---
config:
  pie:
    textPosition: 0.7
    donutHole: 0.25
    legendPosition: right
---
pie title Schema Pie Config
  "One" : 40
  "Two" : 30
  "Three" : 30`, 'Schema Pie Config');
  });

  for (const optionCase of sankeyOptionCases) {
    test(`applies schema sankey option: ${optionCase.name}`, async ({ page }) => {
      await renderMermaidSourcePreview(page, `---
config:
  sankey:
${optionCase.line}
---
sankey

Electricity grid,Industry,342.165
Electricity grid,Losses,56.691`, 'Electricity grid');
    });
  }
});