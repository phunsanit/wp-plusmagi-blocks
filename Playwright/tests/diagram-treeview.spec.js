const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - TreeView', () => {
	test('renders a basic treeview', async ({ page }) => {
		await renderMermaidSourcePreview(page, `treeView-beta
    my-project/
        src/
            index.js
        package.json
        README.md`);
	});
});