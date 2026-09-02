const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Event Modeling', () => {
  test('renders a basic event modeling diagram', async ({ page }) => {
    await renderMermaidDiagram(page, `eventmodeling

tf 01 ui CartUI
tf 02 cmd AddItem
tf 03 evt ItemAdded`);
  });
});