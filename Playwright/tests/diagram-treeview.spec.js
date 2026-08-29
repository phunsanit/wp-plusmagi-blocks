const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - TreeView', () => {
  test('renders a basic treeview', async ({ page }) => {
    await renderMermaidDiagram(page, `treeView-beta
    my-project/
        src/
            index.js
        package.json
        README.md`);
  });
});