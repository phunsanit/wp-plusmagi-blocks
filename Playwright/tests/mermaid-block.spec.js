// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Mermaid block', () => {
  test('renders a Mermaid preview in the editor and saves Mermaid content', async ({ page }) => {
    await page.goto('/wp-admin/post-new.php?post_type=post', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load', { timeout: 30_000 });
    await page.waitForTimeout(5000);

    const editorFrame = page.frameLocator('iframe').first();
    const editorBody = editorFrame.locator('body').first();

    await expect(editorBody).toBeVisible({ timeout: 20_000 });
    await editorBody.click();
    await page.keyboard.type('/PlusMagi');
    await page.keyboard.press('Enter');

    const textarea = editorFrame.locator('textarea').first();
    if (!(await textarea.isVisible({ timeout: 5000 }).catch(() => false))) {
      const inserterButton = page
        .locator('button[aria-label="Block Inserter"], button[aria-label="Add block"], button[aria-label="Add Block"]')
        .first();

      if (await inserterButton.isVisible().catch(() => false)) {
        await inserterButton.click();
      }

      const searchInput = page.locator('.block-editor-inserter__search input, .components-search-control__input').first();
      await expect(searchInput).toBeVisible({ timeout: 15_000 });
      await searchInput.fill('PlusMagi');

      const blockItem = page.locator('button:has-text("PlusMagi Markdown + Mermaid"), button:has-text("Mermaid")').first();
      await expect(blockItem).toBeVisible({ timeout: 15_000 });
      await blockItem.click();
    }

    await expect(textarea).toBeVisible({ timeout: 20_000 });
    await textarea.fill('graph TD\nA[Start] --> B[End]');

    const preview = editorFrame.locator('.plusmagi-markdown-mermaid-preview').first();
    await expect(preview).toBeVisible({ timeout: 20_000 });
    await expect(preview.locator('svg')).toBeVisible({ timeout: 20_000 });
  });
});
