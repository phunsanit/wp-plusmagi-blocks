import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { useState, useEffect } from '@wordpress/element';
import { CheckboxControl, FormTokenField } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

declare global {
	interface Window {
		plusmagiTagsEditorConfig?: {
			statusLabels: {
				all: string;
				publish: string;
				future: string;
				draft: string;
			};
			reindexEnabled: boolean | string | number;
		};
	}
}

const getInitialReindexState = (): boolean => {
	const configVal = window.plusmagiTagsEditorConfig?.reindexEnabled;
	return configVal === true || configVal === '1' || configVal === 1;
};

export const TagsReindexPanel: React.FC = () => {
	const [isGapFillEnabled, setIsGapFillEnabled] = useState<boolean>(getInitialReindexState);

	useEffect(() => {
		setIsGapFillEnabled(getInitialReindexState());
	}, []);

	// 1. ดึงข้อมูล Tags ของ Post ปัจจุบัน และดึงรายชื่อ Tag ทั้งหมดที่มีในระบบ
	const { postTags, allTerms } = useSelect((select: any) => {
		const { getEditedPostAttribute } = select('core/editor');
		const { getEntityRecords } = select('core');

		const tagIds: number[] = getEditedPostAttribute('tags') || [];
		const terms = getEntityRecords('taxonomy', 'post_tag', { per_page: -1 }) || [];

		return {
			postTags: tagIds,
			allTerms: terms,
		};
	}, []);

	const { editPost } = useDispatch('core/editor');

	// แปลง ID ของ Tag ให้กลายเป็นชื่อ String สำหรับ FormTokenField
	const selectedTagNames = postTags
		.map((id) => allTerms.find((term: any) => term.id === id)?.name)
		.filter(Boolean);

	const suggestions = allTerms.map((term: any) => term.name);

	/**
	 * ฟังก์ชันจัดการเมื่อผู้ใช้เพิ่มหรือลบ Tag
	 */
	const handleTagsChange = async (newTagNames: string[]) => {
		// หาว่ามี Tag ชื่อใหม่ที่ยังไม่มี ID ในระบบหรือไม่
		const addedNames = newTagNames.filter((name) => !selectedTagNames.includes(name));

		let updatedTagIds = [...postTags];

		if (addedNames.length > 0) {
			try {
				// ยิง API ปลั๊กอินเพื่อ Reindex และสร้าง/ดึง ID
				const response = await apiFetch<{ ids: number[] }>({
					path: '/plusmagi-tags/v1/add-tag',
					method: 'POST',
					data: {
						name: addedNames.join(','),
						reindex_gaps: isGapFillEnabled,
					},
				});

				if (response && Array.isArray(response.ids)) {
					// รวม ID ใหม่เข้ากับ ID เดิม
					updatedTagIds = Array.from(new Set([...updatedTagIds, ...response.ids]));
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Error adding reindexed tag:', error);
			}
		}

		// กรณีมีการลบ Tag ออกจาก TokenField
		const remainingIds = newTagNames
			.map((name) => allTerms.find((term: any) => term.name === name)?.id)
			.filter((id): id is number => id !== undefined);

		const finalTagIds = Array.from(new Set([...updatedTagIds, ...remainingIds]));

		// สั่งให้ Gutenberg บันทึกรายการ Tags ใหม่ลงใน Post
		editPost({ tags: finalTagIds });
	};

	return (
		<PluginDocumentSettingPanel
			name="plusmagi-tags-reindex-panel"
			title={__('PlusMagi Tags Reindex', 'plusmagi-tags-reindex')}
			className="plusmagi-tags-reindex-panel"
		>
			<div style={{ marginBottom: '15px' }}>
				<CheckboxControl
					label={__('Enable Gap Filling (Reuse missing term_id)', 'plusmagi-tags-reindex')}
					help={__('When disabled, new tags use WordPress default auto-increment.', 'plusmagi-tags-reindex')}
					checked={isGapFillEnabled}
					onChange={(value: boolean) => setIsGapFillEnabled(value)}
				/>
			</div>

			<FormTokenField
				label={__('Tags', 'plusmagi-tags-reindex')}
				value={selectedTagNames}
				suggestions={suggestions}
				onChange={handleTagsChange}
				placeholder={__('Add new tag', 'plusmagi-tags-reindex')}
			/>
		</PluginDocumentSettingPanel>
	);
};

// บันทึกเข้า Gutenberg Sidebar
registerPlugin('plusmagi-tags-reindex', {
	render: TagsReindexPanel,
	icon: 'tag',
});

export default TagsReindexPanel;