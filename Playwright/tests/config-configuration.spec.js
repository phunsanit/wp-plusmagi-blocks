const { expect, test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid config - Configuration', () => {
	test('renders a frontmatter-configured flowchart', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
title: Hello Title
config:
  theme: base
  themeVariables:
    primaryColor: "#00ff00"
---
flowchart
	Hello --> World`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview.getByText('Hello', { exact: true })).toBeVisible();
			await expect(preview.getByText('World', { exact: true })).toBeVisible();
			await expect(preview.getByText('Hello Title', { exact: true })).toBeVisible();
	});
});