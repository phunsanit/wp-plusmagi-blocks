const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Gantt', () => {
  test('renders a basic gantt chart', async ({ page }) => {
    await renderMermaidDiagram(page, `gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
        A task					:a1, 2014-01-01, 30d
        Another task		:after a1, 20d`);
  });
});