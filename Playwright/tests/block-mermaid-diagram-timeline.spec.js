const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Timeline', () => {
  test('renders a basic timeline', async ({ page }) => {
    await renderMermaidDiagram(page, `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter`);
  });
});