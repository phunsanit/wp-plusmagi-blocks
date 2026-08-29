// @ts-check
const { test, expect, resolveAdminTestUrl } = require('./helpers/admin-test');

const POST_ID = 4494;
const ADMIN_URL = process.env.WP_URL_TEST_ADMIN_DESCRIPTION_LIST || resolveAdminTestUrl(`/wp-admin/post.php?post=${POST_ID}&action=edit`);
const FRONT_URL = process.env.WP_URL_TEST_DESCRIPTION_LIST;

const ITEMS = [
	{
		term: 'Description List',
		descriptions: [
			'A semantic list that associates terms with one or more descriptions.',
			'HTML represents the structure with dl, dt, and dd elements.',
		],
	},
	{
		term: 'Description Term',
		descriptions: ['The name or subject being described, represented by a dt element.'],
	},
	{
		term: 'Description Details',
		descriptions: ['The definition or explanation associated with a term, represented by a dd element.'],
	},
];

test.describe('Description List Post 4494', () => {
	test.setTimeout(600_000);

	test('writes the block without changing the title and verifies semantic frontend markup', async ({ page }) => {
		await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		if (page.url().includes('/wp-login.php')) {
			test.skip(true, 'Admin session is not available in this project/browser.');
		}

		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		await page.waitForFunction(
			() => Boolean(window.wp?.blocks?.getBlockType('plusmagi-blocks/description-list')),
			null,
			{ timeout: 30_000 }
		);

		const savedPost = await page.evaluate(async (items) => {
			const { createBlock } = window.wp.blocks;
			const originalTitle = window.wp.data.select('core/editor').getEditedPostAttribute('title');
			const termItems = items.map(({ term, descriptions }) =>
				createBlock(
					'plusmagi-blocks/description-term',
					{ term },
					descriptions.map((description) =>
						createBlock('plusmagi-blocks/description', {}, [createBlock('core/paragraph', { content: description })])
					)
				)
			);
			const descriptionList = createBlock('plusmagi-blocks/description-list', {}, termItems);

			window.wp.data.dispatch('core/block-editor').resetBlocks([descriptionList]);
			await window.wp.data.dispatch('core/editor').savePost();

			return {
				originalTitle,
				savedTitle: window.wp.data.select('core/editor').getEditedPostAttribute('title'),
				permalink: window.wp.data.select('core/editor').getPermalink(),
			};
		}, ITEMS);

		expect(savedPost.savedTitle).toBe(savedPost.originalTitle);
		expect(savedPost.permalink).toBeTruthy();
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isSavingPost())).toBe(false);
		await page.goto(FRONT_URL || savedPost.permalink, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const descriptionList = page.locator('dl.wp-block-plusmagi-markdown-description-list').first();
		await expect(descriptionList).toBeVisible({ timeout: 30_000 });
		await expect(descriptionList.locator(':scope > dt')).toHaveText(ITEMS.map(({ term }) => term));
		await expect(descriptionList.locator(':scope > dd')).toHaveText(ITEMS.flatMap(({ descriptions }) => descriptions));
		await expect(descriptionList.locator(':scope > ol, :scope > ul')).toHaveCount(0);
	});
});