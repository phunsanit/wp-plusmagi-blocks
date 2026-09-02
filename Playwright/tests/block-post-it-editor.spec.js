const { test, expect } = require('@playwright/test');
const path = require('path');

const POST_IT_SCRIPT = path.resolve(__dirname, '../../SVN/trunk/js/plusmagi-post-it.js');
const POST_IT_STYLES = path.resolve(__dirname, '../../SVN/trunk/css/plusmagi-post-it.css');

test.beforeEach(async ({ page }) => {
	await page.setContent('<!doctype html><html><body></body></html>');
	await page.addScriptTag({ content: `
		window.__plusmagiBlocks = {};
		window.wp = {
			element: {
				createElement(type, props, ...children) { return { type, props: props || {}, children }; },
			},
			blockEditor: {
				InspectorControls: 'InspectorControls',
				RichText: Object.assign('RichText', { Content: 'RichText.Content' }),
				useBlockProps: Object.assign((props) => props || {}, { save: (props) => props || {} }),
			},
			components: { ColorPalette: 'ColorPalette', PanelBody: 'PanelBody' },
			blocks: { registerBlockType(name, config) { window.__plusmagiBlocks[name] = config; } },
		};
	` });
	await page.addScriptTag({ path: POST_IT_SCRIPT });
});

test.describe('Post-it Block', () => {
	test('registers with constrained tones and semantic note markup', async ({ page }) => {
		const config = await page.evaluate(() => {
			const block = window.__plusmagiBlocks['plusmagi-blocks/post-it'];
			const saved = block.save({ attributes: { content: 'Remember the deadline.', tone: 'pink' } });
			return {
				title: block.title,
				attributes: block.attributes,
				supports: block.supports,
				savedType: saved.type,
				savedProps: saved.props,
				content: saved.children[0].props.value,
			};
		});

		expect(config.title).toBe('PlusMagi - Post-it');
		expect(config.attributes.tone.enum).toEqual(['yellow', 'pink', 'blue', 'green', 'orange', 'purple']);
		expect(config.supports.typography).toMatchObject({ fontSize: true, lineHeight: true });
		expect(config.supports.color).toMatchObject({ text: true, background: false });
		expect(config.supports.align).toBeUndefined();
		expect(config.savedType).toBe('aside');
		expect(config.savedProps).toMatchObject({ role: 'note', 'aria-label': 'Post-it note' });
		expect(config.savedProps.className).toContain('is-tone-pink');
		expect(config.content).toBe('Remember the deadline.');
	});

	test('falls back to yellow for an unsupported tone', async ({ page }) => {
		const className = await page.evaluate(() => {
			const block = window.__plusmagiBlocks['plusmagi-blocks/post-it'];
			return block.save({ attributes: { content: 'Safe note', tone: 'javascript:alert(1)' } }).props.className;
		});

		expect(className).toContain('is-tone-yellow');
		expect(className).not.toContain('javascript');
	});

	test('pairs every note color with a readable default text color', async ({ page }) => {
		await page.setContent(['yellow', 'pink', 'blue', 'green', 'orange', 'purple']
			.map((tone) => `<aside data-tone="${tone}" class="wp-block-plusmagi-blocks-post-it plusmagi-post-it is-tone-${tone}">Note</aside>`)
			.join(''));
		await page.addStyleTag({ path: POST_IT_STYLES });

		const colors = await page.locator('aside').evaluateAll((notes) => notes.map((note) => ({
			tone: note.getAttribute('data-tone'),
			background: getComputedStyle(note).backgroundColor,
			text: getComputedStyle(note).color,
		})));
		const dimensions = await page.locator('aside').first().boundingBox();
		const decorativeContent = await page.locator('aside').first().evaluate((note) => ({
			before: getComputedStyle(note, '::before').content,
			after: getComputedStyle(note, '::after').content,
		}));

		expect(dimensions).toMatchObject({ width: 288, height: 192 });
		expect(decorativeContent).toEqual({ before: 'none', after: 'none' });
		expect(colors).toEqual([
			{ tone: 'yellow', background: 'rgb(255, 244, 117)', text: 'rgb(73, 60, 0)' },
			{ tone: 'pink', background: 'rgb(255, 183, 197)', text: 'rgb(100, 28, 53)' },
			{ tone: 'blue', background: 'rgb(167, 216, 255)', text: 'rgb(18, 61, 99)' },
			{ tone: 'green', background: 'rgb(189, 232, 181)', text: 'rgb(31, 81, 41)' },
			{ tone: 'orange', background: 'rgb(255, 197, 143)', text: 'rgb(96, 49, 13)' },
			{ tone: 'purple', background: 'rgb(215, 194, 240)', text: 'rgb(69, 38, 103)' },
		]);
	});
});