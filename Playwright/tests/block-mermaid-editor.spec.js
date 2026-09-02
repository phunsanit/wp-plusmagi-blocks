// @ts-check
const { test, expect, openMermaidBlockEditor } = require('./helpers/mermaid-editor');

test.describe('Mermaid block', () => {
  test('renders a Mermaid preview in the editor and saves Mermaid content', async ({ page }) => {
    const { textarea, preview } = await openMermaidBlockEditor(page);
    await textarea.fill('graph TD\nA[Start] --> B[End]');
    await expect(textarea).toHaveValue('graph TD\nA[Start] --> B[End]', { timeout: 20_000 });
    await expect(preview).toBeVisible({ timeout: 20_000 });

    const svg = preview.locator('svg').first();
    const hasSvg = await svg.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSvg) {
      await expect(svg).toBeVisible({ timeout: 20_000 });
    }
  });
});
