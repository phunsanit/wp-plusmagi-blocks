import { createElement } from '@wordpress/element';
import { InspectorControls, RichText, useBlockProps } from '@wordpress/block-editor';
import { ColorPalette, PanelBody } from '@wordpress/components';

const BLOCK_NAME = 'plusmagi-blocks/post-it';
const COLORS = [
	{ name: 'Yellow', slug: 'yellow', color: '#fff475' },
	{ name: 'Pink', slug: 'pink', color: '#ffb7c5' },
	{ name: 'Blue', slug: 'blue', color: '#a7d8ff' },
	{ name: 'Green', slug: 'green', color: '#bde8b5' },
	{ name: 'Orange', slug: 'orange', color: '#ffc58f' },
	{ name: 'Purple', slug: 'purple', color: '#d7c2f0' },
];
const TONES = COLORS.map(({ slug }) => slug);

function normalizeTone(tone: string): string {
	return TONES.includes(tone) ? tone : 'yellow';
}

function PostItEditor({ attributes, setAttributes }: any) {
	const tone = normalizeTone(attributes.tone || 'yellow');
	const blockProps = useBlockProps({ className: `plusmagi-post-it is-tone-${tone}` });

	return createElement(
		'aside',
		{ ...blockProps, role: 'note', 'aria-label': 'Post it note' },
		createElement(
			InspectorControls,
			null,
			createElement(
				PanelBody,
				{ title: 'Post it settings' },
				createElement(ColorPalette, {
					colors: COLORS,
					value: COLORS.find(({ slug }) => slug === tone)?.color,
					disableCustomColors: true,
					clearable: false,
					onChange: (color: string) => {
						const selectedTone = COLORS.find((option) => option.color === color)?.slug || 'yellow';
						setAttributes({ tone: selectedTone });
					},
				}),
			),
		),
		createElement(RichText, {
			tagName: 'p',
			value: attributes.content || '',
			placeholder: 'Write a short note...',
			allowedFormats: ['core/bold', 'core/italic', 'core/link'],
			onChange: (content: string) => setAttributes({ content }),
		}),
	);
}

function PostItSave({ attributes }: any) {
	const tone = normalizeTone(attributes.tone || 'yellow');
	const blockProps = useBlockProps.save({ className: `plusmagi-post-it is-tone-${tone}` });

	return createElement(
		'aside',
		{ ...blockProps, role: 'note', 'aria-label': 'Post it note' },
		createElement(RichText.Content, { tagName: 'p', value: attributes.content || '' }),
	);
}

function DeprecatedPostItSave({ attributes }: any) {
	const tone = normalizeTone(attributes.tone || 'yellow');
	const blockProps = useBlockProps.save({ className: `plusmagi-post-it is-tone-${tone}` });

	return createElement(
		'aside',
		{ ...blockProps, role: 'note', 'aria-label': 'Post-it note' },
		createElement(RichText.Content, { tagName: 'p', value: attributes.content || '' }),
	);
}

const registerBlockType = (window as any).wp?.blocks?.registerBlockType;

if (typeof registerBlockType === 'function') {
	registerBlockType(BLOCK_NAME, {
		apiVersion: 3,
		title: 'PlusMagi - Post it',
		category: 'text',
		icon: 'sticky',
		description: 'Add a concise, colorful note to a post or page.',
		keywords: ['plusmagi', 'post it', 'sticky note', 'note'],
		attributes: {
			content: { type: 'string', source: 'html', selector: 'p', default: '' },
			tone: { type: 'string', enum: TONES, default: 'yellow' },
		},
		supports: {
			color: { text: true, background: false, gradients: false },
			typography: {
				fontSize: true,
				lineHeight: true,
				__experimentalFontFamily: true,
				__experimentalFontStyle: true,
				__experimentalFontWeight: true,
				__experimentalTextDecoration: true,
				__experimentalTextTransform: true,
			},
			html: false,
		},
		edit: PostItEditor,
		save: PostItSave,
		deprecated: [{
			attributes: {
				content: { type: 'string', source: 'html', selector: 'p', default: '' },
				tone: { type: 'string', enum: TONES, default: 'yellow' },
			},
			save: DeprecatedPostItSave,
		}],
	});
}