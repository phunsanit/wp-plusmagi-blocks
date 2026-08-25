const {
	test,
	expect,
	openDescriptionListEditor,
	itemRow,
	fillTerm,
	fillDescription,
	removeItem,
	getAttributes,
} = require('./helpers/description-list-editor');

test.describe('Description List - Block', () => {
	test('renders a single empty item by default', async ({ page }) => {
		const { items } = await openDescriptionListEditor(page);

		await expect(items).toHaveCount(1);
	});

	test('adds a new item', async ({ page }) => {
		const { items, addItemButton } = await openDescriptionListEditor(page);

		await addItemButton.click();

		await expect(items).toHaveCount(2);
	});

	test('removes an item, keeping the remaining ones', async ({ page }) => {
		const { items, addItemButton } = await openDescriptionListEditor(page);

		await addItemButton.click();
		await addItemButton.click();
		await fillTerm(items, 0, 'Term A');
		await fillTerm(items, 1, 'Term B');
		await fillTerm(items, 2, 'Term C');

		await removeItem(items, 1);

		await expect(items).toHaveCount(2);
		await expect(itemRow(items, 0).locator('input')).toHaveValue('Term A');
		await expect(itemRow(items, 1).locator('input')).toHaveValue('Term C');
	});

	test('cannot remove the last remaining item', async ({ page }) => {
		const { items } = await openDescriptionListEditor(page);

		await expect(itemRow(items, 0).locator('.plusmagi-description-list-remove-item')).toBeDisabled();
	});

	test('keeps term and description values in sync with attributes', async ({ page }) => {
		const { items } = await openDescriptionListEditor(page);

		await fillTerm(items, 0, 'HTML');
		await fillDescription(items, 0, 'HyperText Markup Language');

		const attributes = await getAttributes(page);

		expect(attributes.items).toEqual([{ term: 'HTML', description: 'HyperText Markup Language' }]);
	});
});
