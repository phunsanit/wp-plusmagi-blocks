const { expect, test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid config - Theming', () => {
	test('renders a diagram with base theme variables', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    primaryColor: '#BB2528'
    primaryTextColor: '#fff'
    primaryBorderColor: '#7C0000'
    lineColor: '#F8B229'
    secondaryColor: '#006100'
    tertiaryColor: '#fff'
---
graph TD
  A[Christmas] -->|Get money| B(Go shopping)
  B --> C{Let me think}
  B --> G[/Another/]
  C ==>|One| D[Laptop]
  C -->|Two| E[iPhone]
  C -->|Three| F[fa:fa-car Car]
  subgraph section
    C
    D
    E
    F
    G
  end`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview.getByText('Christmas', { exact: true })).toBeVisible();
			await expect(preview.getByText('Go shopping', { exact: true })).toBeVisible();
			await expect(preview.getByText('Let me think', { exact: true })).toBeVisible();
	});
});