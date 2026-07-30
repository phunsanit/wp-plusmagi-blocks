const { expect, test, renderMermaidDiagram, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');
const options = require('./options.json');

const {
  rootOptionCases,
  flowchartOptionCases,
  sequenceOptionCases,
} = options.configConfiguration;

test.describe('Mermaid config - Configuration', () => {
  const buildFlowchartWithConfig = (configLines) => `---
config:
${configLines.join('\n')}
---
flowchart LR
  A[Setup Option Coverage] --> B[Schema-backed Options]
  B --> C[Render OK]`;

  const buildSequenceWithConfig = (sequenceConfigLines) => `---
config:
  securityLevel: loose
  sequence:
${sequenceConfigLines.join('\n')}
---
sequenceDiagram
  participant Alice
  participant Bob
  participant Unused
  Alice->>Bob: Request
  Bob-->>Alice: Response
  Note right of Bob: Configured sequence options`;

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

  for (const optionCase of rootOptionCases) {
    test(`accepts root option: ${optionCase.name}`, async ({ page }) => {
      const mermaid = buildFlowchartWithConfig([
        optionCase.line,
        '  flowchart:',
        '    nodeSpacing: 60',
        '    rankSpacing: 70',
      ]);

      await renderMermaidSourcePreview(page, mermaid, 'Setup Option Coverage');
    });
  }

  for (const optionCase of flowchartOptionCases) {
    test(`accepts flowchart option: ${optionCase.name}`, async ({ page }) => {
      const mermaid = buildFlowchartWithConfig([
        '  theme: base',
        '  flowchart:',
        optionCase.line,
      ]);

      await renderMermaidSourcePreview(page, mermaid, 'Setup Option Coverage');
    });
  }

  for (const optionCase of sequenceOptionCases) {
    test(`accepts sequence option: ${optionCase.name}`, async ({ page }) => {
      const mermaid = buildSequenceWithConfig([
        optionCase.line,
      ]);

      await renderMermaidSourcePreview(page, mermaid, 'Request');
    });
  }
});