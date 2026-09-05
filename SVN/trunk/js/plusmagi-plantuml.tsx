import { createElement, useMemo } from '@wordpress/element';
import { useBlockProps } from '@wordpress/block-editor';
import { Notice, SelectControl, TextareaControl } from '@wordpress/components';

const BLOCK_NAME = 'plusmagi-blocks/plantuml';
const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';
const DEFAULT_SOURCE = '@startuml\nAlice -> Bob: Authentication Request\nBob --> Alice: Authentication Response\n@enduml';

function isPlantUml(source: string): boolean {
	return /^\s*@start/mi.test(source);
}

// PlantUML's "~h" hex encoding needs no compression, unlike its deflate-based encoding.
function encodePlantUmlHex(source: string): string {
	const bytes = new TextEncoder().encode(source);
	let hex = '';
	for (let i = 0; i < bytes.length; i += 1) {
		hex += bytes[i].toString(16).padStart(2, '0');
	}
	return `~h${hex}`;
}

function PlantUmlEditor({ attributes, setAttributes }: any) {
	const source = attributes.source || '';
	const format = attributes.format || 'svg';
	const blockProps = useBlockProps({ className: 'plusmagi-plantuml-editor' });
	const trimmedSource = source.trim();
	const hasInvalidSource = trimmedSource !== '' && !isPlantUml(trimmedSource);

	const previewUrl = useMemo(() => {
		if (!isPlantUml(trimmedSource)) {
			return '';
		}
		return `${PLANTUML_SERVER}/${format}/${encodePlantUmlHex(trimmedSource)}`;
	}, [trimmedSource, format]);

	return createElement(
		'div',
		blockProps,
		createElement(TextareaControl, {
			label: 'PlantUML source',
			help: 'Write PlantUML markup starting with @startuml (or another @start tag). Diagrams are rendered by the public PlantUML server.',
			value: source,
			rows: 12,
			placeholder: DEFAULT_SOURCE,
			onChange: (value: string) => setAttributes({ source: value }),
		}),
		createElement(SelectControl, {
			label: 'Image format',
			value: format,
			options: [
				{ label: 'SVG', value: 'svg' },
				{ label: 'PNG', value: 'png' },
			],
			onChange: (value: string) => setAttributes({ format: value }),
		}),
		hasInvalidSource
			? createElement(Notice, { status: 'error', isDismissible: false }, 'Enter markup that starts with @startuml (or another PlantUML @start tag).')
			: null,
		previewUrl
			? createElement(
				'figure',
				{ className: 'plusmagi-plantuml-preview' },
				createElement('figcaption', null, 'Preview'),
				createElement('img', { src: previewUrl, alt: 'PlantUML diagram preview' }),
			)
			: null,
	);
}

const registerBlockType = (window as any).wp?.blocks?.registerBlockType;

if (typeof registerBlockType === 'function') {
	registerBlockType(BLOCK_NAME, {
		apiVersion: 3,
		title: 'PlusMagi - PlantUML',
		category: 'widgets',
		icon: 'editor-code',
		description: 'Render PlantUML diagrams from text markup using the public PlantUML server.',
		keywords: ['plusmagi', 'plantuml', 'uml', 'diagram'],
		attributes: {
			source: { type: 'string', default: '' },
			format: { type: 'string', default: 'svg' },
		},
		supports: { align: ['wide', 'full'], html: false },
		edit: PlantUmlEditor,
		save: () => null,
	});
}
