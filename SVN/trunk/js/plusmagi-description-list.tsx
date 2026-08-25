import { createElement, Fragment } from '@wordpress/element';
import { Button, TextControl, TextareaControl } from '@wordpress/components';

type DescriptionListItem = {
	term: string;
	description: string;
};

type DescriptionListAttributes = {
	items?: DescriptionListItem[];
};

type DescriptionListBlockProps = {
	attributes: DescriptionListAttributes;
	setAttributes: (attrs: Record<string, unknown>) => void;
};

function createEmptyItem(): DescriptionListItem {
	return { term: '', description: '' };
}

// Gutenberg can persist an empty array; always keep at least one editable row.
function normalizeItems(items?: DescriptionListItem[]): DescriptionListItem[] {
	return items && items.length > 0 ? items : [createEmptyItem()];
}

function DescriptionListEditor({ attributes, setAttributes }: DescriptionListBlockProps) {
	const items = normalizeItems(attributes.items);

	const updateItem = (index: number, key: keyof DescriptionListItem, value: string) => {
		const nextItems = items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item));
		setAttributes({ items: nextItems });
	};

	const addItem = () => {
		setAttributes({ items: [...items, createEmptyItem()] });
	};

	const removeItem = (index: number) => {
		setAttributes({ items: normalizeItems(items.filter((_, itemIndex) => itemIndex !== index)) });
	};

	return (
		<div className="plusmagi-description-list-editor-wrapper">
			<strong className="plusmagi-description-list-editor-title">Description List</strong>
			{items.map((item, index) => (
				<div className="plusmagi-description-list-item" key={index}>
					<TextControl
						label={`Term ${index + 1}`}
						value={item.term}
						onChange={(value: string) => updateItem(index, 'term', value)}
					/>
					<TextareaControl
						label={`Description ${index + 1}`}
						value={item.description}
						onChange={(value: string) => updateItem(index, 'description', value)}
					/>
					<Button
						variant="secondary"
						isDestructive
						disabled={items.length <= 1}
						className="plusmagi-description-list-remove-item"
						onClick={() => removeItem(index)}
					>
						Remove item
					</Button>
				</div>
			))}
			<Button variant="primary" className="plusmagi-description-list-add-item" onClick={addItem}>
				Add item
			</Button>
		</div>
	);
}

function DescriptionListSave({ attributes }: { attributes: DescriptionListAttributes }) {
	const items = normalizeItems(attributes.items);

	return (
		<dl className="wp-block-plusmagi-markdown-description-list">
			{items.map((item, index) => (
				<Fragment key={index}>
					<dt>{item.term}</dt>
					<dd>{item.description}</dd>
				</Fragment>
			))}
		</dl>
	);
}

const blockType = (window as typeof window & { wp?: { blocks?: { registerBlockType?: (name: string, config: Record<string, unknown>) => void } } }).wp?.blocks?.registerBlockType;

if (typeof blockType === 'function') {
	blockType('plusmagi-blocks/description-list', {
		attributes: {
			items: {
				type: 'array',
				default: [createEmptyItem()],
			},
		},
		edit: (props: DescriptionListBlockProps) => createElement(DescriptionListEditor, props),
		save: (props: { attributes: DescriptionListAttributes }) => createElement(DescriptionListSave, props),
	});
}
