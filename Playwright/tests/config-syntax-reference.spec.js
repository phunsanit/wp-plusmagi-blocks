const { expect, test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid config - Syntax reference', () => {
	test('renders a frontmatter diagram with layout and look settings', async ({ page }) => {
    const preview = await renderMermaidDiagram(page, `---
config:
  layout: elk
  look: handDrawn
  theme: dark
---
flowchart TB
  A[Start] --> B{Decision}
  B -->|Yes| C[Continue]
  B -->|No| D[Stop]`);

      await expect(preview.locator('svg')).toBeVisible();
      await expect(preview.getByText('Start', { exact: true })).toBeVisible();
      await expect(preview.getByText('Decision', { exact: true })).toBeVisible();
      await expect(preview.getByText('Continue', { exact: true })).toBeVisible();
      await expect(preview.getByText('Stop', { exact: true })).toBeVisible();
	});
});