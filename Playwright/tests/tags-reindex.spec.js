// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * PlusMagi Tags Reindex — Admin Tools tests
 *
 * Tests cover:
 *  1. Admin page renders correctly
 *  2. Import section validates required input
 *  3. Valid comma/newline input inserts tags and shows a success notice
 */

test.describe('PlusMagi Tags Reindex — Admin Tools', () => {

	// Extend max test timeout to 10 minutes (600,000 ms) for slow production processing.
	test.setTimeout(600_000);

	const TOOLS_URL = '/wp-admin/tools.php?page=plusmagi-tags-reindex';

	async function gotoTools(page) {
		// Navigate to Tools > Tags Reindex.
		await page.goto(TOOLS_URL, { waitUntil: 'domcontentloaded', timeout: 600_000 });

		if (!(await page.locator('#wpadminbar').count())) {
			return { hasAccess: false, hasUI: false };
		}

		const hasUI = (await page.locator('#enable_gap_fill').count()) > 0
			&& (await page.locator('textarea#plusmagi_tags_import_list').count()) > 0;

		return { hasAccess: true, hasUI };
	}

	test('renders the Tags Reindex settings page correctly', async ({ page }) => {
		const state = await gotoTools(page);
		test.skip(!state.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!state.hasUI, 'Environment is not deployed with the current PlusMagi admin UI yet.');

		await expect(page.locator('h1')).toContainText('PlusMagi Tags Reindex');
		await expect(page.locator('#enable_gap_fill')).toBeVisible();
		await expect(page.locator('textarea#plusmagi_tags_import_list')).toBeVisible();
		await expect(page.locator('button[name="plusmagi_tags_import_submit"]')).toBeVisible();
	});

	test('does not submit when import tags textarea is empty', async ({ page }) => {
		const state = await gotoTools(page);
		test.skip(!state.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!state.hasUI, 'Environment is not deployed with the current PlusMagi admin UI yet.');

		const importInput = page.locator('textarea#plusmagi_tags_import_list');
		await importInput.fill('');
		await page.locator('button[name="plusmagi_tags_import_submit"]').click();

		// Empty input should not produce a success notice.
		await expect(page).toHaveURL(/tools\.php\?page=plusmagi-tags-reindex/);
		await expect(page.locator('.notice-success').filter({ hasText: 'Successfully inserted' })).toHaveCount(0);
	});

	test('successfully inserts valid tags from comma/newline-separated input', async ({ page }) => {
		const state = await gotoTools(page);
		test.skip(!state.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!state.hasUI, 'Environment is not deployed with the current PlusMagi admin UI yet.');

		// Use unique names to avoid collisions across repeated test runs.
		const ts = Date.now();
		const tagA = `PlaywrightTagA_${ts}`;
		const tagB = `PlaywrightTagB_${ts}`;
		const tagC = `PlaywrightTagC_${ts}`;
		const tagsPayload = `${tagA}, ${tagB}\n${tagC}`;

		await page.locator('textarea#plusmagi_tags_import_list').fill(tagsPayload);
		await page.locator('button[name="plusmagi_tags_import_submit"]').click();

		// Filter by our expected message to avoid matching notices from other plugins/themes.
		const successNotice = page.locator('.notice-success').filter({ hasText: 'Successfully inserted' });
		await expect(successNotice).toBeVisible();
		await expect(successNotice).toContainText('Successfully inserted 3 new tag(s)');
	});
});