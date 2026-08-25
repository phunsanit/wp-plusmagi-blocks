// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Public AMP Mermaid smoke @smoke', () => {
  test.setTimeout(120_000);
  const TEST_URL = process.env.WP_URL_TEST_FRONT || '/test-plugin-plusmagi-markdown/';

  test('renders exactly 2 AMP Mermaid images and both are replaced', async ({ page }) => {
    const fixtureUrl = new URL(TEST_URL, 'https://pitt.plusmagi.com/');
    fixtureUrl.searchParams.set('fixture_run', String(Date.now()));
    await page.goto(fixtureUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // This page can include many third-party requests; do not fail if network never goes idle.
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const ampMermaidImages = page.locator('amp-img.plusmagi-mermaid-amp-image');
    await expect(ampMermaidImages).toHaveCount(2, { timeout: 60_000 });

    // Ensure both chart placeholders enter viewport so AMP upgrades both elements.
    const totalCharts = await ampMermaidImages.count();
    for (let i = 0; i < totalCharts; i += 1) {
      await ampMermaidImages.nth(i).scrollIntoViewIfNeeded();
    }

    await expect.poll(
      async () => page.locator('amp-img.plusmagi-mermaid-amp-image img.i-amphtml-replaced-content').count(),
      {
        timeout: 60_000,
        intervals: [1000, 2000, 3000],
      }
    ).toBe(2);

    await expect(page.locator('img[alt="Mermaid diagram"]')).toHaveCount(2);
  });
});
