// @ts-check
const { test, expect } = require('./helpers/admin-test');

const ADMIN_URL = process.env.WP_URL_TEST_SVG_ADMIN;
const FRONT_URL = process.env.WP_URL_TEST_SVG_FRONT;

test.describe('SVG Block - Live', () => {
	test('registers the SVG block in the configured editor', async ({ page }) => {
		test.skip(!ADMIN_URL, 'WP_URL_TEST_SVG_ADMIN is not configured.');

		await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		if (page.url().includes('/wp-login.php')) {
			test.skip(true, 'Admin session is not available in this project/browser.');
		}

		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		const block = await page.waitForFunction(
			() => {
				const blockType = window.wp?.blocks?.getBlockType('plusmagi-blocks/svg');

				return blockType ? {
					name: blockType.name,
					title: blockType.title,
					attributes: blockType.attributes,
					supports: blockType.supports,
				} : null;
			},
			null,
			{ timeout: 30_000 },
		);

		expect(await block.jsonValue()).toMatchObject({
			name: 'plusmagi-blocks/svg',
			title: 'PlusMagi - SVG',
			attributes: { svg: { type: 'string', default: '' } },
			supports: { align: ['wide', 'full'], html: false },
		});
	});

	test('renders sanitized responsive SVG on the configured frontend page', async ({ page }) => {
		test.skip(!FRONT_URL, 'WP_URL_TEST_SVG_FRONT is not configured.');

		await page.goto(FRONT_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const block = page.locator('article .wp-block-plusmagi-blocks-svg').first();
		await expect(block).toBeVisible({ timeout: 30_000 });
		await expect(block.locator(':scope > svg')).toHaveCount(1);
		expect(await block.locator('script').count()).toBe(0);

		const unsafeAttributes = await block.locator('*').evaluateAll((nodes) => nodes.flatMap((node) => (
			[...node.attributes]
				.filter((attribute) => /^on/i.test(attribute.name) || attribute.name === 'style' || /^javascript:/i.test(attribute.value.trim()))
				.map((attribute) => `${node.tagName.toLowerCase()}:${attribute.name}`)
		)));
		expect(unsafeAttributes).toEqual([]);
	});
});