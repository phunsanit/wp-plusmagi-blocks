const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Architecture', () => {
  test('renders a basic architecture diagram', async ({ page }) => {
    await renderMermaidDiagram(page, `architecture-beta
    group api(cloud)[API]
    service db(database)[Database] in api
    service server(server)[Server] in api
    db:L -- R:server`);
  });
});