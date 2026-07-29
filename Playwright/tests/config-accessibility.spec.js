const { expect, test, renderMermaidAccessibleDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid config - Accessibility', () => {
	test('injects accessible title and description into the svg', async ({ page }) => {
		const svg = await renderMermaidAccessibleDiagram(
			page,
			`graph LR
      accTitle: Big Decisions
      accDescr: Bob's Burgers process for making big decisions
      A[Identify Big Decision] --> B{Make Big Decision}
      B --> D[Be done]`,
			{
				title: 'Big Decisions',
				description: "Bob's Burgers process for making big decisions",
			}
		);

		await expect(svg).toHaveAttribute('aria-roledescription', 'flowchart-v2');
		await expect(svg).toHaveAttribute('aria-labelledby');
		await expect(svg).toHaveAttribute('aria-describedby');
	});
});