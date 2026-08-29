// @ts-check
const { test, expect, resolveAdminTestUrl } = require('./helpers/admin-test');

const POST_ID = 4495;
const ADMIN_URL = process.env.WP_URL_TEST_ADMIN_MERMAID_DIAGRAM || resolveAdminTestUrl(`/wp-admin/post.php?post=${POST_ID}&action=edit`);
const FRONT_URL = process.env.WP_URL_TEST_FRONT_MERMAID_DIAGRAM;
const MERMAID_SOURCE = `flowchart LR
	A[Input] --> B{Valid?}
	B -->|Yes| C[Process]
	B -->|No| D[Review]`;
const MARKDOWN = `# Mermaid Diagram

\`\`\`mermaid
${MERMAID_SOURCE}
\`\`\``;

test.describe('Mermaid Diagram Post 4495', () => {
	test.setTimeout(600_000);

	test('writes the block without changing the title and renders the frontend diagram', async ({ page }) => {
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

		const savedPost = await page.evaluate(async (markdown) => {
			const originalTitle = window.wp.data.select('core/editor').getEditedPostAttribute('title');
			const mermaidBlock = window.wp.blocks.createBlock('plusmagi-blocks/mermaid', { markdown });

			window.wp.data.dispatch('core/block-editor').resetBlocks([mermaidBlock]);
			await window.wp.data.dispatch('core/editor').savePost();

			return {
				originalTitle,
				savedTitle: window.wp.data.select('core/editor').getEditedPostAttribute('title'),
				permalink: window.wp.data.select('core/editor').getPermalink(),
			};
		}, MARKDOWN);

		expect(savedPost.savedTitle).toBe(savedPost.originalTitle);
		expect(savedPost.permalink).toBeTruthy();
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isSavingPost())).toBe(false);
		await page.goto(FRONT_URL || savedPost.permalink, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const diagram = page.locator('.plusmagi-markdown-front-mermaid[data-plusmagi-mermaid="1"]').first();
		await expect(diagram).toBeVisible({ timeout: 30_000 });
		await expect(diagram.locator('svg').first()).toBeVisible({ timeout: 30_000 });
		await expect(diagram).toContainText('Input');
		await expect(diagram).toContainText('Process');
		await expect(diagram).toContainText('Review');
	});
});