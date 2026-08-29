import { createElement, Fragment } from '@wordpress/element';
import { InspectorControls, InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

const BLOCK_NAME = 'plusmagi-blocks/table-style';
const ALLOWED_BLOCKS = ['core/table'];
const CORE_TABLE_BLOCK = 'core/table';
const PLAIN_STYLE_IDS = [
	'TableNormal',
	'TableGrid',
	'TableGridLight',
	'TableSimple1',
	'PlainTable1',
	'PlainTable2',
	'PlainTable3',
	'PlainTable4',
	'PlainTable5',
];
const withAccents = (styleNames: string[]) => styleNames.flatMap((styleName) => [
	styleName,
	...Array.from({ length: 6 }, (_, index) => `${styleName}-Accent${index + 1}`),
]);
const GRID_STYLE_IDS = withAccents([
	'GridTable1Light',
	'GridTable2',
	'GridTable3',
	'GridTable4',
	'GridTable5Dark',
	'GridTable6Colorful',
	'GridTable7Colorful',
]);
const LIST_STYLE_IDS = withAccents([
	'ListTable1Light',
	'ListTable2',
	'ListTable3',
	'ListTable4',
	'ListTable5Dark',
	'ListTable6Colorful',
	'ListTable7Colorful',
]);
const TABLE_STYLE_IDS = [...PLAIN_STYLE_IDS, ...GRID_STYLE_IDS, ...LIST_STYLE_IDS];
const TABLE_STYLE_ID_SET = new Set(TABLE_STYLE_IDS);
const TABLE_STYLE_OPTIONS = [
	{ label: 'None', value: '' },
	...PLAIN_STYLE_IDS.map((value) => ({ label: `Plain: ${value}`, value })),
	...GRID_STYLE_IDS.map((value) => ({ label: `Grid: ${value}`, value })),
	...LIST_STYLE_IDS.map((value) => ({ label: `List: ${value}`, value })),
];
const TABLE_TEMPLATE = [[
	'core/table',
	{
		head: [{ cells: [
			{ content: 'Header 1', tag: 'th' },
			{ content: 'Header 2', tag: 'th' },
			{ content: 'Header 3', tag: 'th' },
			{ content: 'Header 4', tag: 'th' },
		] }],
		body: [
			{ cells: [
				{ content: 'Data 1', tag: 'td' },
				{ content: 'Data 2', tag: 'td' },
				{ content: 'Data 3', tag: 'td' },
				{ content: 'Data 4', tag: 'td' },
			] },
			{ cells: [
				{ content: 'Data 5', tag: 'td' },
				{ content: 'Data 6', tag: 'td' },
				{ content: 'Data 7', tag: 'td' },
				{ content: 'Data 8', tag: 'td' },
			] },
			{ cells: [
				{ content: 'Data 9', tag: 'td' },
				{ content: 'Data 10', tag: 'td' },
				{ content: 'Data 11', tag: 'td' },
				{ content: 'Data 12', tag: 'td' },
			] },
			{ cells: [
				{ content: 'Data 13', tag: 'td' },
				{ content: 'Data 14', tag: 'td' },
				{ content: 'Data 15', tag: 'td' },
				{ content: 'Data 16', tag: 'td' },
			] },
		],
		foot: [{ cells: [{ content: 'Total', tag: 'td', colspan: '4' }] }],
	},
]];

function getStyleClass(styleId: string) {
	return String(styleId || 'TableGrid')
		.trim()
		.replace(/[^A-Za-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'TableGrid';
}

function getBlockClassName(attributes: any) {
	return [
		'plusmagi-table-style',
		getStyleClass(attributes.styleId),
		attributes.bandedColumns ? 'is-banded-columns' : '',
	].filter(Boolean).join(' ');
}

function supportsBandedColumns(styleId: string) {
	return /^(Grid|List)Table/.test(getStyleClass(styleId));
}

function getCoreTableClassName(className: string, styleId: string, bandedColumns: boolean) {
	const preservedClasses = String(className || '')
		.split(/\s+/)
		.filter((classToken) => classToken
			&& classToken !== 'wp-block-plusmagi-blocks-table-style'
			&& classToken !== 'plusmagi-table-style'
			&& classToken !== 'is-banded-columns'
			&& !TABLE_STYLE_ID_SET.has(classToken));

	if (styleId) {
		preservedClasses.push('wp-block-plusmagi-blocks-table-style', 'plusmagi-table-style', styleId);
		if (bandedColumns && supportsBandedColumns(styleId)) {
			preservedClasses.push('is-banded-columns');
		}
	}

	return [...new Set(preservedClasses)].join(' ');
}

function renderBandedColumnsState(attributes: any) {
	if (!supportsBandedColumns(attributes.styleId) || attributes.compareBandedColumns) {
		return null;
	}

	return createElement(
		'p',
		{ className: 'plusmagi-banded-columns-state' },
		`Banded Columns: ${attributes.bandedColumns ? 'On' : 'Off'}`,
	);
}

function TableStyleEditor({ attributes, setAttributes }: any) {
	const blockProps = useBlockProps({ className: getBlockClassName(attributes) });

	return createElement(
		'section',
		blockProps,
		createElement(
			InspectorControls,
			null,
			createElement(
				PanelBody,
				{ title: 'Table Design', initialOpen: true },
				createElement(ToggleControl, {
					label: 'Banded Columns',
					checked: Boolean(attributes.bandedColumns),
					onChange: (bandedColumns: boolean) => setAttributes({ bandedColumns }),
				}),
			),
		),
		createElement(RichText, {
			tagName: 'h3',
			className: 'plusmagi-table-style-id',
			value: attributes.styleId || '',
			onChange: (styleId: string) => setAttributes({ styleId }),
			placeholder: 'Table style ID',
			allowedFormats: [],
		}),
		renderBandedColumnsState(attributes),
		createElement(InnerBlocks, {
			allowedBlocks: ALLOWED_BLOCKS,
			template: TABLE_TEMPLATE,
			templateLock: 'all',
		}),
	);
}

function TableStyleSave({ attributes }: any) {
	return createElement(
		'section',
		useBlockProps.save({ className: getBlockClassName(attributes) }),
		createElement(RichText.Content, {
			tagName: 'h3',
			className: 'plusmagi-table-style-id',
			value: attributes.styleId || '',
		}),
		renderBandedColumnsState(attributes),
		createElement(InnerBlocks.Content, null),
	);
}

const registerBlockType = (window as any).wp?.blocks?.registerBlockType;

if (typeof registerBlockType === 'function') {
	registerBlockType(BLOCK_NAME, {
		apiVersion: 3,
		title: 'PlusMagi - Table Style',
		category: 'design',
		icon: 'editor-table',
		keywords: ['plusmagi', 'table', 'table style', 'style id', 'h3'],
		attributes: {
			styleId: {
				type: 'string',
				source: 'html',
				selector: 'h3',
				default: 'TableGrid',
			},
			bandedColumns: {
				type: 'boolean',
				default: false,
			},
			compareBandedColumns: {
				type: 'boolean',
				default: false,
			},
		},
		supports: { html: false },
		edit: TableStyleEditor,
		save: TableStyleSave,
	});
}

if (typeof addFilter === 'function' && typeof createHigherOrderComponent === 'function') {
	addFilter(
		'blocks.registerBlockType',
		'plusmagi-blocks/table-style-attributes',
		(settings: any, name: string) => {
			if (name !== CORE_TABLE_BLOCK) {
				return settings;
			}

			return {
				...settings,
				attributes: {
					...settings.attributes,
					plusmagiStyleId: { type: 'string', default: '' },
					plusmagiBandedColumns: { type: 'boolean', default: false },
				},
			};
		},
	);

	const withTableStyleControls = createHigherOrderComponent((BlockEdit: any) => (props: any) => {
		if (props.name !== CORE_TABLE_BLOCK) {
			return createElement(BlockEdit, props);
		}

		const { attributes, setAttributes } = props;
		const styleId = attributes.plusmagiStyleId || '';
		const bandedColumns = Boolean(attributes.plusmagiBandedColumns);
		const updateStyle = (nextStyleId: string) => {
			const nextBandedColumns = supportsBandedColumns(nextStyleId) ? bandedColumns : false;
			setAttributes({
				plusmagiStyleId: nextStyleId,
				plusmagiBandedColumns: nextBandedColumns,
				className: getCoreTableClassName(attributes.className, nextStyleId, nextBandedColumns),
			});
		};
		const updateBandedColumns = (nextBandedColumns: boolean) => setAttributes({
			plusmagiBandedColumns: nextBandedColumns,
			className: getCoreTableClassName(attributes.className, styleId, nextBandedColumns),
		});

		return createElement(
			Fragment,
			null,
			createElement(BlockEdit, props),
			createElement(
				InspectorControls,
				null,
				createElement(
					PanelBody,
					{ title: 'Table Design', initialOpen: true },
					createElement(SelectControl, {
						label: 'Table Style',
						value: styleId,
						options: TABLE_STYLE_OPTIONS,
						onChange: updateStyle,
					}),
					createElement(ToggleControl, {
						label: 'Banded Columns',
						checked: bandedColumns,
						disabled: !supportsBandedColumns(styleId),
						onChange: updateBandedColumns,
					}),
				),
			),
		);
	}, 'withPlusMagiTableStyleControls');

	addFilter(
		'editor.BlockEdit',
		'plusmagi-blocks/table-style-controls',
		withTableStyleControls,
	);
}