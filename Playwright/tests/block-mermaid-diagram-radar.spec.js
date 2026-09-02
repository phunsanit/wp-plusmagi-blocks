const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Radar', () => {
  test('renders a basic radar chart', async ({ page }) => {
    await renderMermaidDiagram(page, `radar-beta
  title Grades
  axis m["Math"], s["Science"], e["English"]
  curve a["Alice"]{85, 90, 80}
  curve b["Bob"]{70, 75, 85}
  max 100
  min 0`);
  });
});