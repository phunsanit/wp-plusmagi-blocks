const { test, expect, openDescriptionListEditor } = require('./helpers/description-list-editor');

test.describe('Description List - Block', () => {
	test('registers the block with the dl alias', async ({ page }) => {
		const config = await openDescriptionListEditor(page);

		expect(config.title).toBe('PlusMagi - Description list');
		expect(config.keywords).toContain('dl');
		expect(config.template).toEqual([
			['plusmagi-blocks/description-term', {}, [['plusmagi-blocks/description']]],
			['plusmagi-blocks/description-term', {}, [['plusmagi-blocks/description']]],
			['plusmagi-blocks/description-term', {}, [['plusmagi-blocks/description']]],
		]);
		expect(config.allowedBlocks).toEqual(['plusmagi-blocks/description-term']);
	});

	test('keeps the ordered attribute default for backward compatibility', async ({ page }) => {
		const config = await openDescriptionListEditor(page);

		expect(config.attributes.ordered.default).toBe(true);
	});

	test('registers semantic term and description child blocks', async ({ page }) => {
		const config = await openDescriptionListEditor(page);
		const childBlocks = await page.evaluate(() => ({
			term: window.__plusmagiBlocks['plusmagi-blocks/description-term'],
			description: window.__plusmagiBlocks['plusmagi-blocks/description'],
		}));

		expect(config.allowedBlocks).toContain('plusmagi-blocks/description-term');
		expect(childBlocks.term.parent).toEqual(['plusmagi-blocks/description-list']);
		expect(childBlocks.description.parent).toEqual(['plusmagi-blocks/description-term']);
	});
});
