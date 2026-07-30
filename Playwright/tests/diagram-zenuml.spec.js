const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - ZenUML', () => {
  test('renders a basic zenuml diagram', async ({ page }) => {
    await renderMermaidSourcePreview(page, `zenuml
    title Demo
    Alice->John: Hello John, how are you?
    John->Alice: Great!
    Alice->John: See you later!`);
  });
});