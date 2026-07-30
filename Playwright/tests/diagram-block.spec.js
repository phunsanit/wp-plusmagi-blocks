const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Block', () => {
  test('renders a basic block diagram', async ({ page }) => {
    await renderMermaidSourcePreview(page, `block
  columns 1
  a b c`);
  });
});