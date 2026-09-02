const { test, expect } = require('@playwright/test');
const path = require('path');

const TABLE_STYLE_SCRIPT = path.resolve(__dirname, '../../SVN/trunk/js/plusmagi-table-style.js');

test.beforeEach(async ({ page }) => {
	await page.setContent('<!doctype html><html><body></body></html>');
	await page.addScriptTag({
		content: `
			window.__plusmagiBlocks = {};
			window.React = {
				createElement(type, props, ...children) {
					return { type, props: props || {}, children };
				}
			};
			function InnerBlocks() {}
			InnerBlocks.Content = 'InnerBlocks.Content';
			function RichText() {}
			RichText.Content = 'RichText.Content';
			function InspectorControls() {}
			function PanelBody() {}
			function SelectControl() {}
			function ToggleControl() {}
			function useBlockProps(props) { return props; }
			useBlockProps.save = function save(props) { return props; };
			window.wp = {
				blockEditor: { InspectorControls, InnerBlocks, RichText, useBlockProps },
				components: { PanelBody, SelectControl, ToggleControl },
				compose: {
					createHigherOrderComponent(factory) { return factory; }
				},
				hooks: {
					addFilter(hookName, namespace, callback) {
						window.__plusmagiFilters = window.__plusmagiFilters || {};
						window.__plusmagiFilters[hookName] = callback;
					}
				},
				blocks: {
					registerBlockType(name, config) {
						window.__plusmagiBlocks[name] = config;
					}
				},
				element: window.React
			};
		`,
	});

	await page.addScriptTag({ path: TABLE_STYLE_SCRIPT });
});

test.describe('Table Style block', () => {
	test('extends core/table with selectable styles and no H3 output', async ({ page }) => {
		const output = await page.evaluate(() => {
			const registerFilter = window.__plusmagiFilters['blocks.registerBlockType'];
			const blockEditFilter = window.__plusmagiFilters['editor.BlockEdit'];
			const settings = registerFilter({ attributes: { className: { type: 'string' } } }, 'core/table');
			const updates = [];
			function CoreTableEdit() {}
			const controls = blockEditFilter(CoreTableEdit)({
				name: 'core/table',
				attributes: { className: 'alignwide', plusmagiStyleId: '', plusmagiBandedColumns: false },
				setAttributes(attributes) { updates.push(attributes); },
			});
			const panel = controls.children[1].children[0];
			const select = panel.children[0];
			select.props.onChange('GridTable2-Accent2');

			return {
				attributes: settings.attributes,
				selectLabel: select.props.label,
				optionCount: select.props.options.length,
				update: updates[0],
				htmlElements: controls.children.filter((child) => typeof child.type === 'string').map((child) => child.type),
			};
		});

		expect(output.attributes.plusmagiStyleId).toEqual({ type: 'string', default: '' });
		expect(output.attributes.plusmagiBandedColumns).toEqual({ type: 'boolean', default: false });
		expect(output.selectLabel).toBe('Table Style');
		expect(output.optionCount).toBe(108);
		expect(output.update.className).toContain('alignwide');
		expect(output.update.className).toContain('GridTable2-Accent2');
		expect(output.update.className).toContain('wp-block-plusmagi-blocks-table-style');
		expect(output.htmlElements).toEqual([]);
	});

	test('registers the style ID from an H3 element', async ({ page }) => {
		const config = await page.evaluate(() => {
			const block = window.__plusmagiBlocks['plusmagi-blocks/table-style'];
			return {
				title: block.title,
				category: block.category,
				styleId: block.attributes.styleId,
				bandedColumns: block.attributes.bandedColumns,
				compareBandedColumns: block.attributes.compareBandedColumns,
			};
		});

		expect(config.title).toBe('PlusMagi - Table Style');
		expect(config.category).toBe('design');
		expect(config.styleId).toEqual({
			type: 'string',
			source: 'html',
			selector: 'h3',
			default: 'TableGrid',
		});
		expect(config.bandedColumns).toEqual({ type: 'boolean', default: false });
		expect(config.compareBandedColumns).toEqual({ type: 'boolean', default: false });
	});

	test('saves the style ID as H3 before the table content', async ({ page }) => {
		const output = await page.evaluate(() => {
			const block = window.__plusmagiBlocks['plusmagi-blocks/table-style'];
			const saved = block.save({ attributes: { styleId: 'GridTable1Light' } });
			return {
				wrapper: saved.type,
				heading: saved.children[0],
				bandedColumnsState: saved.children[1],
				tableContent: saved.children[2],
			};
		});

		expect(output.wrapper).toBe('section');
		expect(output.heading.props.value).toBe('GridTable1Light');
		expect(output.heading.props.tagName).toBe('h3');
		expect(output.heading.props.className).toBe('plusmagi-table-style-id');
		expect(output.bandedColumnsState.props.className).toBe('plusmagi-banded-columns-state');
		expect(output.bandedColumnsState.children[0]).toBe('Banded Columns: Off');
		expect(output.tableContent.type).toBe('InnerBlocks.Content');
		expect(await page.evaluate(() => {
			const block = window.__plusmagiBlocks['plusmagi-blocks/table-style'];
			return block.save({ attributes: { styleId: 'GridTable1Light' } }).props.className;
		})).toContain('GridTable1Light');
		expect(output.heading.type).toBe('RichText.Content');
	});

	test('serializes the Banded Columns option as a wrapper class', async ({ page }) => {
		const output = await page.evaluate(() => {
			const block = window.__plusmagiBlocks['plusmagi-blocks/table-style'];
			const enabled = block.save({ attributes: { styleId: 'GridTable2-Accent2', bandedColumns: true } });
			const disabled = block.save({ attributes: { styleId: 'GridTable2-Accent2', bandedColumns: false } });
			const editor = block.edit({ attributes: { styleId: 'GridTable2-Accent2', bandedColumns: true }, setAttributes() {} });
			return {
				enabledClassName: enabled.props.className,
				disabledClassName: disabled.props.className,
				toggle: editor.children[0].children[0].children[0],
			};
		});

		expect(output.enabledClassName).toContain('is-banded-columns');
		expect(output.disabledClassName).not.toContain('is-banded-columns');
		expect(output.toggle.props.label).toBe('Banded Columns');
		expect(output.toggle.props.checked).toBe(true);
	});

	test('places the Banded Columns state below H3 and omits it for Plain tables', async ({ page }) => {
		const output = await page.evaluate(() => {
			const block = window.__plusmagiBlocks['plusmagi-blocks/table-style'];
			const grid = block.save({ attributes: { styleId: 'GridTable2', bandedColumns: true } });
			const plain = block.save({ attributes: { styleId: 'PlainTable2', bandedColumns: false } });
			return {
				gridChildren: grid.children.map((child) => child?.props?.className || child?.type),
				gridLabel: grid.children[1].children[0],
				plainChildren: plain.children.filter(Boolean).map((child) => child?.props?.className || child?.type),
			};
		});

		expect(output.gridChildren).toEqual([
			'plusmagi-table-style-id',
			'plusmagi-banded-columns-state',
			'InnerBlocks.Content',
		]);
		expect(output.gridLabel).toBe('Banded Columns: On');
		expect(output.plainChildren).toEqual(['plusmagi-table-style-id', 'InnerBlocks.Content']);
	});

	test('omits the single-state label in Banded Columns comparison mode', async ({ page }) => {
		const children = await page.evaluate(() => {
			const block = window.__plusmagiBlocks['plusmagi-blocks/table-style'];
			const output = block.save({
				attributes: { styleId: 'GridTable2', bandedColumns: false, compareBandedColumns: true },
			});
			return output.children.filter(Boolean).map((child) => child?.props?.className || child?.type);
		});

		expect(children).toEqual(['plusmagi-table-style-id', 'InnerBlocks.Content']);
	});

	test('uses a four-column table template', async ({ page }) => {
		const table = await page.evaluate(() => {
			const block = window.__plusmagiBlocks['plusmagi-blocks/table-style'];
			const output = block.edit({ attributes: { styleId: 'TableGrid' }, setAttributes() {} });
			return output.children[3].props.template[0][1];
		});

		expect(table.head[0].cells).toHaveLength(4);
		expect(table.body).toHaveLength(4);
		expect(table.body.every((row) => row.cells.length === 4)).toBe(true);
		expect(table.foot[0].cells[0].colspan).toBe('4');
	});
});