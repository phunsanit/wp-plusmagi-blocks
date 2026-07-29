const { expect, test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid config - Math', () => {
	test('renders math in a flowchart', async ({ page }) => {
    const preview = await renderMermaidDiagram(page, `graph LR
      A["$$x^2$$"] -->|"$$\\sqrt{x+3}$$"| B("$$\\frac{1}{2}$$")
      A -->|"$$\\overbrace{a+b+c}^{\\text{note}}$$"| C("$$\\pi r^2$$")
      B --> D("$$x = \\begin{cases} a &\\text{if } b \\\\ c &\\text{if } d \\end{cases}$$")
      C --> E("$$x(t)=c_1\\begin{bmatrix}-\\cos{t}+\\sin{t}\\\\ 2\\cos{t} \\end{bmatrix}e^{2t}$$")`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview.locator('math').first()).toBeVisible();
	});

	test('renders math in a sequence diagram', async ({ page }) => {
    const preview = await renderMermaidDiagram(page, `sequenceDiagram
    autonumber
    participant 1 as $$\\alpha$$
    participant 2 as $$\\beta$$
    1->>2: Solve: $$\\sqrt{2+2}$$
    2-->>1: Answer: $$2$$
    Note right of 2: $$\\sqrt{2+2}=\\sqrt{4}=2$$`);

			await expect(preview.locator('svg')).toBeVisible();
      await expect(preview).toContainText('Solve:');
      await expect(preview).toContainText('Answer:');
			await expect(preview.locator('math').first()).toBeVisible();
	});
});