const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Kanban', () => {
  test('renders a basic kanban board', async ({ page }) => {
    await renderMermaidDiagram(page, `kanban
  Todo[Todo]
    task1[Create Documentation]
  Done[Done]
    task2[Ship Release]`);
  });
});