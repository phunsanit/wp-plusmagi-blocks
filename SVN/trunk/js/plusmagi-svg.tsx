import { createElement } from '@wordpress/element';
import { useBlockProps } from '@wordpress/block-editor';
import { Notice, TextareaControl } from '@wordpress/components';

const BLOCK_NAME = 'plusmagi-blocks/svg';

function isSvg(source: string): boolean {
	return /^\s*<svg(?:\s|>)/i.test(source);
}

function SvgEditor({ attributes, setAttributes }: any) {
	const source = attributes.svg || '';
	const blockProps = useBlockProps({ className: 'plusmagi-svg-editor' });
	const hasInvalidSource = source.trim() !== '' && !isSvg(source);

	return createElement(
		'div',
		blockProps,
		createElement(TextareaControl, {
			label: 'SVG markup',
			help: 'Paste SVG markup. Scripts and unsafe attributes are removed when the block is rendered.',
			value: source,
			rows: 10,
			placeholder: '<svg viewBox="0 0 100 100" role="img" aria-label="Example">...</svg>',
			onChange: (svg: string) => setAttributes({ svg }),
		}),
		hasInvalidSource
			? createElement(Notice, { status: 'error', isDismissible: false }, 'Enter markup that starts with an <svg> element.')
			: null,
		isSvg(source)
			? createElement(
				'figure',
				{ className: 'plusmagi-svg-preview' },
				createElement('figcaption', null, 'Preview'),
				createElement('img', {
					src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`,
					alt: 'SVG preview',
				}),
			)
			: null,
	);
}

const registerBlockType = (window as any).wp?.blocks?.registerBlockType;

if (typeof registerBlockType === 'function') {
	registerBlockType(BLOCK_NAME, {
		apiVersion: 3,
		title: 'PlusMagi - SVG',
		category: 'media',
		icon: 'format-image',
		description: 'Add sanitized inline SVG markup with an editor preview.',
		keywords: ['plusmagi', 'svg', 'vector', 'image', 'icon'],
		attributes: { svg: { type: 'string', default: '' } },
		supports: { align: ['wide', 'full'], html: false },
		edit: SvgEditor,
		save: () => null,
	});
}