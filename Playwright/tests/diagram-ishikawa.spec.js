const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Ishikawa', () => {
  test('renders a basic ishikawa diagram', async ({ page }) => {
    await renderMermaidDiagram(page, `ishikawa-beta
    Blurry Photo
    Process
        Out of focus
        Shutter speed too slow
    User
        Shaky hands
    Equipment
        LENS
            Dirty lens
        SENSOR
            Damaged sensor
    Environment
        Too dark`);
  });
});