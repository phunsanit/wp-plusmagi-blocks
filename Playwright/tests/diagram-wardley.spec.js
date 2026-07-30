const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Wardley', () => {
  test('renders a basic wardley map', async ({ page }) => {
    await renderMermaidSourcePreview(page, `wardley-beta
title Tea Shop Value Chain

anchor Business [0.95, 0.63]
component Cup of Tea [0.79, 0.61]
component Tea [0.63, 0.81]
Business -> Cup of Tea
Cup of Tea -> Tea`);
  });
});