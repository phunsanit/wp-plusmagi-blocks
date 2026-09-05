// @ts-check
const { test, expect } = require('./helpers/admin-test');
const { PLANTUML_DIAGRAMS } = require('./fixtures/plantuml-diagrams');

const POST_ID = 4727;
const ADMIN_URL = process.env.WP_URL_TEST_PLANTUML_ADMIN;
const FRONT_URL = process.env.WP_URL_TEST_PLANTUML_FRONT;

test.describe(`PlantUML Diagram Post ${POST_ID}`, () => {
	test.setTimeout(300_000);

	test('writes every PlantUML diagram type separated by a separator block', async ({ page }) => {
		test.skip(!ADMIN_URL, 'WP_URL_TEST_PLANTUML_ADMIN is not configured.');

		await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		if (page.url().includes('/wp-login.php')) {
			test.skip(true, 'Admin session is not available in this project/browser.');
		}

		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		await page.waitForFunction(
			() => Boolean(window.wp?.blocks?.getBlockType('plusmagi-blocks/plantuml')),
			null,
			{ timeout: 30_000 },
		);

		const savedPost = await page.evaluate(async (diagrams) => {
			const originalTitle = window.wp.data.select('core/editor').getEditedPostAttribute('title');
			const intro = window.wp.blocks.createBlock('core/paragraph', {
				content: '<a href="https://plantuml.com/" target="plantuml" rel="noopener noreferrer">PlantUML diagram types</a>',
			});
			const diagramBlocks = diagrams.flatMap(({ id, name, target, url, source, format }, index) => {
				const blocks = [
					window.wp.blocks.createBlock('core/heading', {
						level: 2,
						anchor: `plantuml-${id}`,
						content: `<a href="${url}" target="${target}" rel="noopener noreferrer">${name}</a>`,
					}),
					window.wp.blocks.createBlock('plusmagi-blocks/plantuml', {
						source,
						format,
					}),
				];

				if (index < diagrams.length - 1) {
					blocks.push(window.wp.blocks.createBlock('core/separator'));
				}

				return blocks;
			});

			window.wp.data.dispatch('core/block-editor').resetBlocks([intro, ...diagramBlocks]);
			await window.wp.data.dispatch('core/editor').savePost();

			return {
				originalTitle,
				savedTitle: window.wp.data.select('core/editor').getEditedPostAttribute('title'),
				permalink: window.wp.data.select('core/editor').getPermalink(),
			};
		}, PLANTUML_DIAGRAMS);

		expect(savedPost.savedTitle).toBe(savedPost.originalTitle);
		expect(savedPost.permalink).toBeTruthy();
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isSavingPost())).toBe(false);
		await page.goto(FRONT_URL || savedPost.permalink, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const article = page.locator('article').first();
		const diagramLinks = article.locator(`h2 a[href^="https://plantuml.com/"]`);
		const diagramBlocks = article.locator('.wp-block-plusmagi-blocks-plantuml');
		const images = article.locator('img.plusmagi-plantuml-image');
		const separators = article.locator('hr.wp-block-separator');

		await expect(diagramLinks).toHaveCount(PLANTUML_DIAGRAMS.length);
		await expect(diagramLinks).toHaveText(PLANTUML_DIAGRAMS.map(({ name }) => name));
		await expect.poll(() => diagramLinks.evaluateAll((links, targets) => links.every((link, index) => (
			link.target === targets[index]
			&& link.rel.split(/\s+/).includes('noopener')
			&& link.rel.split(/\s+/).includes('noreferrer')
		)), PLANTUML_DIAGRAMS.map(({ target }) => target))).toBe(true);
		await expect(separators).toHaveCount(PLANTUML_DIAGRAMS.length - 1);
		await expect(diagramBlocks).toHaveCount(PLANTUML_DIAGRAMS.length);
		await expect(images).toHaveCount(PLANTUML_DIAGRAMS.length);

		const imageSources = await images.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src')));
		imageSources.forEach((src, index) => {
			const format = PLANTUML_DIAGRAMS[index].format;
			expect(src).toMatch(new RegExp(`^https://www\\.plantuml\\.com/plantuml/${format}/~h[0-9a-f]+$`));
		});

		await expect.poll(() => images.evaluateAll((nodes) => nodes.filter((node) => node.complete && node.naturalWidth > 0).length), {
			timeout: 180_000,
		}).toBe(PLANTUML_DIAGRAMS.length);
	});
});
