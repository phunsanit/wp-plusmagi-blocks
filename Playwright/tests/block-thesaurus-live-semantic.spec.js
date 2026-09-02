// @ts-check
const { test, expect, resolveAdminTestUrl } = require('./helpers/admin-test');

const NEW_POST_URL = resolveAdminTestUrl('/wp-admin/post-new.php');
const HEADING = 'ศัพท์ใกล้เคียง';
const ENTRY = {
	term: 'Fast',
	pos: 'adj.',
	definition: 'Moving or capable of moving at high speed.',
	synonyms: 'quick, rapid, swift, speedy',
	antonyms: 'slow, sluggish',
};

test.describe('Thesaurus Block - Live Semantic Output', () => {
	test.setTimeout(600_000);

	test('publishes thesaurus markup with semantic attributes on frontend', async ({ page }) => {
		await page.goto(NEW_POST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		await page.waitForFunction(() => Boolean(window.wp?.blocks?.getBlockType('plusmagi-blocks/thesaurus')), null, { timeout: 30_000 });

		const permalink = await page.evaluate(async ({ heading, entry }) => {
			const block = window.wp.blocks.createBlock('plusmagi-blocks/thesaurus', {
				heading,
				entries: [entry],
			});
			window.wp.data.dispatch('core/editor').editPost({
				title: `Playwright Thesaurus ${Date.now()}`,
				status: 'publish',
			});
			window.wp.data.dispatch('core/block-editor').resetBlocks([block]);
			await window.wp.data.dispatch('core/editor').savePost();
			return window.wp.data.select('core/editor').getPermalink();
		}, { heading: HEADING, entry: ENTRY });

		expect(permalink).toBeTruthy();
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isSavingPost())).toBe(false);
		await page.goto(permalink, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const container = page.locator('.plusmagi-thesaurus-container').first();
		await expect(container).toBeVisible({ timeout: 30_000 });
		await expect(container.locator('h2')).toHaveText(HEADING);

		const headingId = await container.locator('h2').getAttribute('id');
		expect(headingId).toBeTruthy();
		await expect(container.locator(`dl[aria-labelledby="${headingId}"]`)).toHaveCount(1);

		const entry = container.locator('.plusmagi-thesaurus-entry').first();
		await expect(entry).toHaveAttribute('itemtype', 'https://schema.org/DefinedTerm');
		await expect(entry).toHaveAttribute('data-term', 'fast');
		await expect(entry.locator('dt dfn[itemprop="name"]')).toHaveText(ENTRY.term);
		await expect(entry.locator('dd[data-type="definition"][itemprop="description"]')).toContainText(ENTRY.definition);
		await expect(entry.locator('dd[data-type="synonyms"][aria-label="Synonyms for Fast"] li.tag[itemprop="sameAs"]')).toHaveCount(4);
		await expect(entry.locator('dd[data-type="antonyms"][aria-label="Antonyms for Fast"] li.tag')).toHaveCount(2);
	});
});