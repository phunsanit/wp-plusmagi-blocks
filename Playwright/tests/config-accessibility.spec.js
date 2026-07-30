const { expect, test, renderMermaidAccessibleDiagram } = require('./helpers/mermaid-editor');
const options = require('./options.json');

const { diagramCases } = options.configAccessibility;

test.describe('Mermaid config - Accessibility', () => {
	const withAccessibilityMeta = (diagramBody, title, description) => {
		const lines = diagramBody.split('\n');
		return [
			lines[0],
			`accTitle: ${title}`,
			`accDescr: ${description}`,
			...lines.slice(1),
		].join('\n');
	};

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

	for (const diagramCase of diagramCases) {
		test(`supports accessibility metadata for ${diagramCase.name}`, async ({ page }) => {
			const code = withAccessibilityMeta(
				diagramCase.diagramBody,
				diagramCase.title,
				diagramCase.description
			);

			const svg = await renderMermaidAccessibleDiagram(
				page,
				code,
				diagramCase.skipStrictTitleCheck
					? {}
					: {
						title: diagramCase.title,
						description: diagramCase.description,
					}
			);

			await expect(svg).toHaveAttribute('aria-labelledby');
			await expect(svg).toHaveAttribute('aria-describedby');
		});
	}
});