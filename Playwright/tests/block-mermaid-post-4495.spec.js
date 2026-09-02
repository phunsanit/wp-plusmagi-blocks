// @ts-check
const { test, expect, resolveAdminTestUrl } = require('./helpers/admin-test');
const { MERMAID_DIAGRAMS } = require('./fixtures/mermaid-diagrams');

const POST_ID = 4495;
const ADMIN_URL = process.env.WP_URL_TEST_MERMAID_DIAGRAM_ADMIN || resolveAdminTestUrl(`/wp-admin/post.php?post=${POST_ID}&action=edit`);
const FRONT_URL = process.env.WP_URL_TEST_MERMAID_DIAGRAM_FRONT;
test.describe('Mermaid Diagram Post 4495', () => {
	test.setTimeout(600_000);

	test('writes every diagram with linked names without changing the title', async ({ page }) => {
		await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		if (page.url().includes('/wp-login.php')) {
			test.skip(true, 'Admin session is not available in this project/browser.');
		}

		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		await page.waitForFunction(
			() => Boolean(window.wp?.blocks?.getBlockType('plusmagi-blocks/mermaid')),
			null,
			{ timeout: 30_000 }
		);

		const savedPost = await page.evaluate(async (diagrams) => {
			const originalTitle = window.wp.data.select('core/editor').getEditedPostAttribute('title');
			const intro = window.wp.blocks.createBlock('core/paragraph', {
				content: '<a href="https://mermaid.js.org/intro/" target="intro" rel="noopener noreferrer">Mermaid diagram types</a>',
			});
			const diagramBlocks = diagrams.flatMap(({ id, name, target, url, source }, index) => {
				const blocks = [window.wp.blocks.createBlock('core/heading', {
					level: 2,
					anchor: `mermaid-${id}`,
					content: `<a href="${url}" target="${target}" rel="noopener noreferrer">${name}</a>`,
				}),
				window.wp.blocks.createBlock('plusmagi-blocks/mermaid', {
					markdown: `\`\`\`mermaid\n${source}\n\`\`\``,
				})];

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
		}, MERMAID_DIAGRAMS);

		expect(savedPost.savedTitle).toBe(savedPost.originalTitle);
		expect(savedPost.permalink).toBeTruthy();
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isSavingPost())).toBe(false);
		await page.goto(FRONT_URL || savedPost.permalink, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const article = page.locator('article').first();
		const diagramLinks = article.locator('h2 a[href^="https://mermaid.js.org/syntax/"]');
		const diagrams = article.locator('.plusmagi-markdown-front-mermaid[data-plusmagi-mermaid="1"]');
		const separators = article.locator('hr.wp-block-separator');

		await expect(diagramLinks).toHaveCount(MERMAID_DIAGRAMS.length);
		await expect(diagramLinks).toHaveText(MERMAID_DIAGRAMS.map(({ name }) => name));
		await expect.poll(() => diagramLinks.evaluateAll((links, targets) => links.every((link, index) => (
			link.target === targets[index]
			&& link.rel.split(/\s+/).includes('noopener')
			&& link.rel.split(/\s+/).includes('noreferrer')
		)), MERMAID_DIAGRAMS.map(({ target }) => target))).toBe(true);
		await expect(separators).toHaveCount(MERMAID_DIAGRAMS.length - 1);
		await expect(diagrams).toHaveCount(MERMAID_DIAGRAMS.length);
		await expect.poll(() => diagrams.evaluateAll((nodes) => nodes.filter((node) => {
			const mermaid = node.querySelector('.mermaid');
			return mermaid?.dataset.plusmagiRendered === '1' || mermaid?.dataset.plusmagiRenderError === '1';
		}).length), {
			timeout: 180_000,
		}).toBe(MERMAID_DIAGRAMS.length);

		const renderErrorIndexes = await diagrams.evaluateAll((nodes) => nodes.flatMap((node, index) => {
			const mermaid = node.querySelector('.mermaid');
			if (mermaid?.dataset.plusmagiRenderError !== '1') {
				return [];
			}

			return [index];
		}));
		const renderErrors = renderErrorIndexes.map((index) => MERMAID_DIAGRAMS[index]?.name || `Diagram ${index + 1}`);
		expect(renderErrors, `Mermaid render errors: ${renderErrors.join(', ')}`).toEqual([]);
		await expect.poll(() => diagrams.evaluateAll((nodes) => nodes.filter((node) => node.querySelector('svg')).length)).toBe(MERMAID_DIAGRAMS.length);
	});
});