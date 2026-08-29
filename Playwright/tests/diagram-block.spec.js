const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Block', () => {
  test('renders a basic block diagram', async ({ page }) => {
    await renderMermaidDiagram(page, `block
  columns 1
  a b c`);
  });
});