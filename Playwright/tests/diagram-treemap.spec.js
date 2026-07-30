const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Treemap', () => {
  test('renders a basic treemap', async ({ page }) => {
    await renderMermaidSourcePreview(page, `treemap-beta
"Category A"
    "Item A1": 10
    "Item A2": 20
"Category B"
    "Item B1": 15
    "Item B2": 25`);
  });
});