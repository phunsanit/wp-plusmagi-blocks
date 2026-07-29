const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Kanban', () => {
	test('renders a basic kanban board', async ({ page }) => {
		await renderMermaidSourcePreview(page, `kanban
  Todo[Todo]
    task1[Create Documentation]
  Done[Done]
    task2[Ship Release]`);
	});
});