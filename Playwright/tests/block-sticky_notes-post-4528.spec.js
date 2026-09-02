// @ts-check
const { test, expect } = require('./helpers/admin-test');

const ADMIN_URL = process.env.WP_URL_TEST_STICKY_NOTES_ADMIN;
const FRONT_URL = process.env.WP_URL_TEST_STICKY_NOTES_FRONT;
const DEMOS = [
	{
		tone: 'yellow',
		content: '<strong>Yellow:</strong> a bold reminder for today.',
		background: 'rgb(255, 244, 117)',
		text: 'rgb(73, 60, 0)',
	},
	{
		tone: 'pink',
		content: '<em>Pink:</em> an italic note for a thoughtful detail.',
		background: 'rgb(255, 183, 197)',
		text: 'rgb(100, 28, 53)',
	},
	{
		tone: 'blue',
		content: '<a href="https://wordpress.org/" rel="noreferrer noopener">Blue:</a> a note with a useful link.',
		background: 'rgb(167, 216, 255)',
		text: 'rgb(18, 61, 99)',
	},
	{
		tone: 'green',
		content: 'Green: larger type with comfortable line spacing.',
		style: { typography: { fontSize: '20px', lineHeight: '1.6' } },
		background: 'rgb(189, 232, 181)',
		text: 'rgb(31, 81, 41)',
	},
	{
		tone: 'orange',
		content: 'Orange: strong uppercase emphasis.',
		style: { typography: { fontWeight: '700', textTransform: 'uppercase' } },
		background: 'rgb(255, 197, 143)',
		text: 'rgb(96, 49, 13)',
	},
	{
		tone: 'purple',
		content: 'Purple: a styled handwritten thought.',
		style: { typography: { fontFamily: 'Georgia, serif', fontStyle: 'italic', textDecoration: 'underline' } },
		background: 'rgb(215, 194, 240)',
		text: 'rgb(69, 38, 103)',
	},
];

test.describe('Sticky Notes Block - Post 4528', () => {
	test('publishes every color and Gutenberg formatting demo', async ({ page }) => {
		test.skip(!ADMIN_URL || !FRONT_URL, 'Sticky Notes test URLs are not configured.');
		await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		await page.waitForFunction(() => Boolean(window.wp?.blocks?.getBlockType('plusmagi-blocks/sticky-notes')), null, { timeout: 30_000 });
		const supports = await page.evaluate(() => window.wp.blocks.getBlockType('plusmagi-blocks/sticky-notes').supports);
		expect(supports.typography).toMatchObject({ fontSize: true, lineHeight: true });
		expect(supports.color).toMatchObject({ text: true, background: false });
		expect(supports.align).toBeUndefined();

		const savedPost = await page.evaluate(async (demos) => {
			const originalTitle = window.wp.data.select('core/editor').getEditedPostAttribute('title');
			const blocks = demos.flatMap(({ tone, content, style }, index) => {
				const note = window.wp.blocks.createBlock(
					'plusmagi-blocks/sticky-notes',
					{ tone, content, ...(style ? { style } : {}) },
				);
				return index < demos.length - 1
					? [note, window.wp.blocks.createBlock('core/separator')]
					: [note];
			});
			window.wp.data.dispatch('core/block-editor').resetBlocks(blocks);
			await window.wp.data.dispatch('core/editor').savePost();
			return {
				originalTitle,
				savedTitle: window.wp.data.select('core/editor').getEditedPostAttribute('title'),
			};
		}, DEMOS.map(({ tone, content, style }) => ({ tone, content, style })));

		expect(savedPost.savedTitle).toBe(savedPost.originalTitle);
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isSavingPost())).toBe(false);
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isEditedPostDirty())).toBe(false);

		await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		await page.waitForFunction(() => Boolean(window.wp?.data?.select('core/block-editor')), null, { timeout: 30_000 });
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/block-editor').getBlocks().length), {
			message: 'Saved demo blocks should remain after reloading wp-admin.',
			timeout: 30_000,
		}).toBe(DEMOS.length * 2 - 1);
		const persistedBlocks = await page.evaluate(() => window.wp.data.select('core/block-editor').getBlocks().map((block) => ({
			name: block.name,
			tone: block.attributes.tone || null,
		})));
		expect(persistedBlocks).toEqual(DEMOS.flatMap(({ tone }, index) => (
			index < DEMOS.length - 1
				? [{ name: 'plusmagi-blocks/sticky-notes', tone }, { name: 'core/separator', tone: null }]
				: [{ name: 'plusmagi-blocks/sticky-notes', tone }]
		)));
		const hasEditorCanvas = await page.locator('iframe[name="editor-canvas"]').count() > 0;
		const editorCanvas = hasEditorCanvas ? page.frameLocator('iframe[name="editor-canvas"]') : page;
		const visibleNotes = editorCanvas.locator('[data-type="plusmagi-blocks/sticky-notes"]');
		const visibleSeparators = editorCanvas.locator('[data-type="core/separator"]');
		await expect(visibleNotes).toHaveCount(DEMOS.length);
		await expect(visibleSeparators).toHaveCount(DEMOS.length - 1);
		await expect(visibleNotes.nth(0)).toContainText('Yellow:');
		await expect(visibleNotes.nth(1)).toContainText('Pink:');

		await page.goto(FRONT_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const notes = page.locator('aside.wp-block-plusmagi-blocks-sticky-notes.plusmagi-sticky-notes');
		await expect(notes).toHaveCount(DEMOS.length);
		const separators = page.locator('hr.wp-block-separator');
		await expect(separators).toHaveCount(DEMOS.length - 1);
		const contentOrder = await page.locator('.entry-content, .wp-block-post-content').first().evaluate((container) => (
			Array.from(container.querySelectorAll(':scope > aside.wp-block-plusmagi-blocks-sticky-notes, :scope > hr.wp-block-separator'))
				.map((element) => element.tagName.toLowerCase())
		));
		expect(contentOrder).toEqual(['aside', 'hr', 'aside', 'hr', 'aside', 'hr', 'aside', 'hr', 'aside', 'hr', 'aside']);

		for (const [index, demo] of DEMOS.entries()) {
			const note = notes.nth(index);
			await expect(note).toBeVisible({ timeout: 30_000 });
			await expect(note).toHaveAttribute('role', 'note');
			await expect(note).toHaveAttribute('aria-label', 'Sticky note');
			await expect(note).toHaveClass(new RegExp(`is-tone-${demo.tone}`));
			const appearance = await note.evaluate((element) => ({
				width: element.getBoundingClientRect().width,
				minHeight: getComputedStyle(element).minHeight,
				background: getComputedStyle(element).backgroundColor,
				text: getComputedStyle(element).color,
			}));
			expect(appearance).toEqual({
				width: 288,
				minHeight: '192px',
				background: demo.background,
				text: demo.text,
			});
		}

		await expect(notes.nth(0).locator('strong')).toHaveText('Yellow:');
		await expect(notes.nth(1).locator('em')).toHaveText('Pink:');
		await expect(notes.nth(2).locator('a')).toHaveAttribute('href', 'https://wordpress.org/');
		await expect(notes.nth(3)).toHaveCSS('font-size', '20px');
		await expect(notes.nth(3)).toHaveCSS('line-height', '32px');
		await expect(notes.nth(4)).toHaveCSS('font-weight', '700');
		await expect(notes.nth(4)).toHaveCSS('text-transform', 'uppercase');
		await expect(notes.nth(5)).toHaveCSS('font-style', 'italic');
		await expect(notes.nth(5)).toHaveCSS('text-decoration-line', 'underline');
	});
});