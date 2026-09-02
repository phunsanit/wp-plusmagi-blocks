// @ts-check
const { test, expect } = require('./helpers/admin-test');

const ADMIN_URL = process.env.WP_URL_TEST_POSTIT_ADMIN;
const FRONT_URL = process.env.WP_URL_TEST_POSTIT_FRONT;

test.describe('Post-it Block - Post 4528', () => {
	test('saves a colored semantic note and verifies the frontend', async ({ page }) => {
		test.skip(!ADMIN_URL || !FRONT_URL, 'Post-it test URLs are not configured.');
		await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		await page.waitForFunction(() => Boolean(window.wp?.blocks?.getBlockType('plusmagi-blocks/post-it')), null, { timeout: 30_000 });
		const supports = await page.evaluate(() => window.wp.blocks.getBlockType('plusmagi-blocks/post-it').supports);
		expect(supports.typography).toMatchObject({ fontSize: true, lineHeight: true });
		expect(supports.color).toMatchObject({ text: true, background: false });
		expect(supports.align).toBeUndefined();

		const savedPost = await page.evaluate(async () => {
			const originalTitle = window.wp.data.select('core/editor').getEditedPostAttribute('title');
			const note = window.wp.blocks.createBlock('plusmagi-blocks/post-it', {
				content: '<strong>Remember:</strong> publish the Post-it block test before release.',
				tone: 'yellow',
			});
			window.wp.data.dispatch('core/block-editor').resetBlocks([note]);
			await window.wp.data.dispatch('core/editor').savePost();
			return {
				originalTitle,
				savedTitle: window.wp.data.select('core/editor').getEditedPostAttribute('title'),
			};
		});

		expect(savedPost.savedTitle).toBe(savedPost.originalTitle);
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isSavingPost())).toBe(false);
		await page.goto(FRONT_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const note = page.locator('aside.wp-block-plusmagi-blocks-post-it.plusmagi-post-it').first();
		await expect(note).toBeVisible({ timeout: 30_000 });
		await expect(note).toHaveAttribute('role', 'note');
		await expect(note).toHaveAttribute('aria-label', 'Post-it note');
		await expect(note).toHaveClass(/is-tone-yellow/);
		await expect(note.locator('p')).toContainText('publish the Post-it block test before release');
		await expect(note.locator('strong')).toHaveText('Remember:');
		const appearance = await note.evaluate((element) => ({
			width: element.getBoundingClientRect().width,
			minHeight: getComputedStyle(element).minHeight,
			background: getComputedStyle(element).backgroundColor,
			text: getComputedStyle(element).color,
		}));
		expect(appearance).toEqual({
			width: 288,
			minHeight: '192px',
			background: 'rgb(255, 244, 117)',
			text: 'rgb(73, 60, 0)',
		});
	});
});