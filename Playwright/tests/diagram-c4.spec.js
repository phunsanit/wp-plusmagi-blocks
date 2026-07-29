const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - C4', () => {
	test('renders a basic C4 context diagram', async ({ page }) => {
		await renderMermaidSourcePreview(page, `C4Context
  title System Context
  Person(user, "User")
  System(system, "System")
  Rel(user, system, "Uses")`);
	});
});