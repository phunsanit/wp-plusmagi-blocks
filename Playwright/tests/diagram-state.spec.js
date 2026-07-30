const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - State', () => {
  test('renders a basic state diagram', async ({ page }) => {
    await renderMermaidDiagram(page, `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`);
  });
});