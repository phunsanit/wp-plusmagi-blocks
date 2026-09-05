// @ts-check
const { test, expect } = require('./helpers/admin-test');

const ADMIN_URL = process.env.WP_URL_TEST_PLANTUML_ADMIN;
const FRONT_URL = process.env.WP_URL_TEST_PLANTUML_FRONT;

test.describe('PlantUML Block - Live', () => {
	test('registers the PlantUML block in the configured editor', async ({ page }) => {
		test.skip(!ADMIN_URL, 'WP_URL_TEST_PLANTUML_ADMIN is not configured.');

		await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		if (page.url().includes('/wp-login.php')) {
			test.skip(true, 'Admin session is not available in this project/browser.');
		}

		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		const block = await page.waitForFunction(
			() => {
				const blockType = window.wp?.blocks?.getBlockType('plusmagi-blocks/plantuml');

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
			name: 'plusmagi-blocks/plantuml',
			title: 'PlusMagi - PlantUML',
			attributes: {
				source: { type: 'string', default: '' },
				format: { type: 'string', default: 'svg' },
			},
			supports: { align: ['wide', 'full'], html: false },
		});
	});

	test('renders a PlantUML diagram image on the configured frontend page', async ({ page }) => {
		test.skip(!FRONT_URL, 'WP_URL_TEST_PLANTUML_FRONT is not configured.');
		test.skip(!ADMIN_URL, 'WP_URL_TEST_PLANTUML_ADMIN is not configured.');

		const source = '@startuml\nAlice -> Bob: Authentication Request\nBob --> Alice: Authentication Response\n@enduml';
		await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		await page.waitForFunction(() => Boolean(window.wp?.blocks?.getBlockType('plusmagi-blocks/plantuml')), null, { timeout: 30_000 });
		await page.evaluate(async (plantUmlSource) => {
			const block = window.wp.blocks.createBlock('plusmagi-blocks/plantuml', { source: plantUmlSource, format: 'svg' });
			window.wp.data.dispatch('core/block-editor').resetBlocks([block]);
			await window.wp.data.dispatch('core/editor').savePost();
		}, source);
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isSavingPost())).toBe(false);

		await page.goto(FRONT_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const block = page.locator('article .wp-block-plusmagi-blocks-plantuml').first();
		await expect(block).toBeVisible({ timeout: 30_000 });

		const image = block.locator('img.plusmagi-plantuml-image');
		await expect(image).toHaveCount(1);
		await expect(image).toHaveAttribute('src', /^https:\/\/www\.plantuml\.com\/plantuml\/svg\/~h[0-9a-f]+$/);
	});
});
