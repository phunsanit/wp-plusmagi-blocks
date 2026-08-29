const withAccents = (styleNames) => styleNames.flatMap((styleName) => [
	styleName,
	...Array.from({ length: 6 }, (_, index) => `${styleName}-Accent${index + 1}`),
]);

const TABLE_STYLE_GROUPS = [
	{
		heading: 'Plain Tables (9)',
		styles: [
			'TableNormal',
			'TableGrid',
			'TableGridLight',
			'TableSimple1',
			'PlainTable1',
			'PlainTable2',
			'PlainTable3',
			'PlainTable4',
			'PlainTable5',
		],
	},
	{
		heading: 'Grid Tables (49)',
		styles: withAccents([
			'GridTable1Light',
			'GridTable2',
			'GridTable3',
			'GridTable4',
			'GridTable5Dark',
			'GridTable6Colorful',
			'GridTable7Colorful',
		]),
	},
	{
		heading: 'List Tables (49)',
		styles: withAccents([
			'ListTable1Light',
			'ListTable2',
			'ListTable3',
			'ListTable4',
			'ListTable5Dark',
			'ListTable6Colorful',
			'ListTable7Colorful',
		]),
	},
];

const TABLE_STYLE_IDS = TABLE_STYLE_GROUPS.flatMap(({ styles }) => styles);
const TABLE_STYLE_EXAMPLES = TABLE_STYLE_GROUPS.flatMap(({ heading, styles }) => styles.flatMap((styleId) => (
	heading.startsWith('Plain')
		? [{ styleId, bandedColumns: false, caption: '' }]
		: [
			{ styleId, bandedColumns: false, caption: 'Banded Columns: Off' },
			{ styleId, bandedColumns: true, caption: 'Banded Columns: On' },
		]
)));

module.exports = { TABLE_STYLE_EXAMPLES, TABLE_STYLE_GROUPS, TABLE_STYLE_IDS };