const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Cynefin', () => {
  test('renders a basic cynefin diagram', async ({ page }) => {
    await renderMermaidSourcePreview(page, `cynefin-beta
  title Incident Response

  complex
    "Investigate root cause"
    "Run chaos experiment"

  complicated
    "Analyze performance data"

  clear
    "Restart service"

  chaotic
    "Page on-call immediately"

  confusion
    "Unknown failure mode"`);
  });
});