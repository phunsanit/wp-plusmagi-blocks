// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PlusMagi Tags Reindex — Block Editor', () => {

	// Increase timeout to handle slow page loads.
	test.setTimeout(600_000);

	test.beforeEach(async ({ page }) => {
		// Navigate to the new post editor page.
		await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded', timeout: 600_000 });

		// Skip fast if this environment user cannot access wp-admin content editing.
		test.skip(
			!(await page.locator('#wpadminbar').count()),
			'Environment user cannot access wp-admin post editor.'
		);

		// Wait until the editor shell is fully visible.
		await page.locator('.edit-post-layout').waitFor({ state: 'visible', timeout: 60_000 });
		await page.waitForTimeout(2000); // Give Gutenberg React time to finish rendering the UI.

		// Close the Gutenberg welcome popup if it appears.
		const welcomeClose = page.locator('.components-modal__header button').first();
		if (await welcomeClose.isVisible({ timeout: 5000 }).catch(() => false)) {
			await welcomeClose.click();
		}

		// Click the "Post" tab in the sidebar so the plugin panel becomes visible.
		const postTab = page.locator('button.edit-post-sidebar__panel-tab').first();
		if (await postTab.isVisible()) {
			await postTab.click();
		}
	});

	test('plugin panel renders and supports enter/comma/multi-input tag additions', async ({ page }) => {
		// Find the plugin panel by its registered title.
		const panelToggle = page.locator('button.components-panel__body-toggle').filter({ hasText: /PlusMagi Tags Reindex/i });

		test.skip((await panelToggle.count()) === 0, 'Environment is not deployed with the PlusMagi editor panel yet.');

		await expect(panelToggle).toBeVisible({ timeout: 30_000 });

		// If the panel is collapsed, expand it.
		const isExpanded = await panelToggle.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await panelToggle.click();
		}

		// Find the input used to add tags.
		const tagInput = page.locator('input[placeholder="Add new tag"]');
		await expect(tagInput).toBeVisible();

		// Simulate typing with unique names to avoid collisions between test runs.
		const uniqueId = Date.now();

		// 1. Add a tag by pressing Enter.
		await tagInput.fill(`PlaywrightTagA_${uniqueId}`);
		await page.waitForTimeout(100); // Allow React state updates before key press.
		await tagInput.press('Enter');
		await expect(tagInput).toHaveValue('');

		// 2. Add a tag by typing a comma (,).
		await tagInput.fill(`PlaywrightTagB_${uniqueId}`);
		await page.waitForTimeout(100); // Wait for React state updates after fill.
		await tagInput.press(',');
		await expect(tagInput).toHaveValue('');

		// 3. Add a tag by confirming with Enter again.
		await tagInput.fill(`PlaywrightTagC_${uniqueId}`);
		await page.waitForTimeout(100);
		await tagInput.press('Enter');
		await expect(tagInput).toHaveValue('');

		// 4. Add multiple tags at once using comma-separated input (paste simulation).
		await tagInput.fill(`PlaywrightTagD_${uniqueId}, PlaywrightTagE_${uniqueId}`);
		await expect(tagInput).toHaveValue('');

		// Expect all tag names to appear in the panel immediately.
		await expect(page.locator(`strong:has-text("PlaywrightTagA_${uniqueId}")`)).toBeVisible({ timeout: 15_000 });
		await expect(page.locator(`strong:has-text("PlaywrightTagB_${uniqueId}")`)).toBeVisible({ timeout: 15_000 });
		await expect(page.locator(`strong:has-text("PlaywrightTagC_${uniqueId}")`)).toBeVisible({ timeout: 15_000 });
		await expect(page.locator(`strong:has-text("PlaywrightTagD_${uniqueId}")`)).toBeVisible({ timeout: 15_000 });
		await expect(page.locator(`strong:has-text("PlaywrightTagE_${uniqueId}")`)).toBeVisible({ timeout: 15_000 });
	});
});