import { __ } from '@wordpress/i18n';
import { CheckboxControl, FormTokenField, Spinner, Button } from '@wordpress/components';
import { registerPlugin } from '@wordpress/plugins';
import { useSelect, useDispatch, dispatch } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

declare global {
	interface Window {
		wp?: {
			domReady?: (callback: () => void) => void;
		};
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

interface TagTerm {
	id: number;
	name: string;
	count?: number;
}

interface TagStat {
	id: number;
	name: string;
	all: number;
	published: number;
	future: number;
	draft: number;
}

const getInitialReindexState = (): boolean => {
	const configVal = window.plusmagiTagsEditorConfig?.reindexEnabled;
	return configVal === true || configVal === '1' || configVal === 1;
};

const getDocumentSettingPanel = () => {
	const wpGlobal = window.wp as unknown as {
		editPost?: { PluginDocumentSettingPanel?: React.ComponentType<any> };
		editor?: { PluginDocumentSettingPanel?: React.ComponentType<any> };
	};

	return wpGlobal?.editPost?.PluginDocumentSettingPanel || wpGlobal?.editor?.PluginDocumentSettingPanel || null;
};

export const TagsReindexPanel: React.FC = () => {
	const DocumentSettingPanel = getDocumentSettingPanel();

	if (!DocumentSettingPanel) {
		return null;
	}

	const [isGapFillEnabled, setIsGapFillEnabled] = useState<boolean>(getInitialReindexState);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [knownTerms, setKnownTerms] = useState<TagTerm[]>([]);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [isSearching, setIsSearching] = useState<boolean>(false);

	const [statsList, setStatsList] = useState<TagStat[]>([]);
	const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		setIsGapFillEnabled(getInitialReindexState());
	}, []);

	// 1. Fetch current post tag IDs
	const { postTags, hasLoadedInitial } = useSelect((select: any) => {
		const { getEditedPostAttribute } = select('core/editor');
		const tagIds: number[] = getEditedPostAttribute('tags') || [];
		return {
			postTags: Array.isArray(tagIds) ? tagIds : [],
			hasLoadedInitial: true,
		};
	}, []);

	const { editPost } = useDispatch('core/editor');
	const { invalidateResolution } = useDispatch('core');

	// 2. Fetch missing terms details and stats list
	useEffect(() => {
		if (!Array.isArray(postTags) || postTags.length === 0) {
			setStatsList([]);
			return;
		}

		const missingIds = postTags.filter((id) => !knownTerms.some((term) => term.id === id));
		if (missingIds.length > 0) {
			apiFetch<TagTerm[]>({
				path: `/wp/v2/tags?include=${missingIds.join(',')}&_fields=id,name,count`,
			})
				.then((terms) => {
					if (Array.isArray(terms) && terms.length > 0) {
						setKnownTerms((prev) => {
							const combined = [...prev, ...terms];
							return Array.from(new Map(combined.map((t) => [t.id, t])).values());
						});
					}
				})
				.catch((err) => console.error('Error fetching post tags:', err));
		}

		setIsLoadingStats(true);
		apiFetch<TagStat[]>({
			path: `/plusmagi-tags/v1/terms-with-stats?ids=${postTags.join(',')}`,
		})
			.then((res) => {
				if (Array.isArray(res)) {
					setStatsList(res);
				}
			})
			.catch((err) => console.error('Error fetching tag stats:', err))
			.finally(() => setIsLoadingStats(false));
	}, [postTags]);

	// Calculate overall statistics for summary footer
	const totalTagsCount = postTags.length;
	const totalPublishedCount = statsList.reduce((acc, item) => acc + (item.published || 0), 0);
	const totalDraftCount = statsList.reduce((acc, item) => acc + (item.draft || 0), 0);
	const newTagsCount = statsList.filter((s) => s.all === 0).length;

	const cleanTagName = (formattedName: string): string => {
		return formattedName.replace(/\s\(\d+\)$/, '').trim();
	};

	// 3. Search and suggestion autocomplete handler
	const handleInputChange = (token: string) => {
		const searchTerm = token.trim();

		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current);
		}

		if (!searchTerm) {
			setSuggestions([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);

		debounceTimer.current = setTimeout(() => {
			apiFetch<TagTerm[]>({
				path: `/wp/v2/tags?search=${encodeURIComponent(searchTerm)}&per_page=20&_fields=id,name,count`,
			})
				.then((terms) => {
					if (Array.isArray(terms)) {
						setKnownTerms((prev) => {
							const combined = [...prev, ...terms];
							return Array.from(new Map(combined.map((t) => [t.id, t])).values());
						});

						setSuggestions(
							terms.map((term) =>
								term.count !== undefined ? `${term.name} (${term.count})` : term.name
							)
						);
					}
				})
				.catch((err) => console.error('Error searching tags:', err))
				.finally(() => setIsSearching(false));
		}, 300);
	};

	// 4. Handle tag addition/removal via FormTokenField
	const handleTagsChange = async (newTokens: (string | TagTerm)[]) => {
		if (!Array.isArray(newTokens)) return;

		const tokensList = newTokens.map((item) => (typeof item === 'string' ? item : item.name));
		const cleanedNames = Array.from(new Set(tokensList.map(cleanTagName))).filter(Boolean);

		const existingIds: number[] = [];
		const namesToCreate: string[] = [];

		cleanedNames.forEach((name) => {
			const matchedTerm = knownTerms.find(
				(term) => term.name.toLowerCase() === name.toLowerCase()
			);
			if (matchedTerm) {
				existingIds.push(matchedTerm.id);
			} else {
				namesToCreate.push(name);
			}
		});

		let finalTagIds = Array.from(new Set(existingIds));

		if (namesToCreate.length > 0) {
			setIsSubmitting(true);
			try {
				const response = await apiFetch<{ ids: number[]; terms?: TagTerm[] }>({
					path: '/plusmagi-tags/v1/add-tag',
					method: 'POST',
					data: {
						name: namesToCreate.join(','),
						reindex_gaps: isGapFillEnabled,
					},
				});

				if (response && Array.isArray(response.ids)) {
					finalTagIds = Array.from(new Set([...finalTagIds, ...response.ids]));

					if (Array.isArray(response.terms)) {
						setKnownTerms((prev) => {
							const combined = [...prev, ...response.terms!];
							return Array.from(new Map(combined.map((t) => [t.id, t])).values());
						});
					}
				}

				await invalidateResolution('getEntityRecords', ['taxonomy', 'post_tag', { per_page: -1 }]);
			} catch (error) {
				console.error('Error adding reindexed tag:', error);
			} finally {
				setIsSubmitting(false);
			}
		}

		editPost({ tags: finalTagIds });
	};

	// 5. Remove tag handler from summary list
	const handleRemoveTag = (tagIdToRemove: number) => {
		const updatedTagIds = postTags.filter((id) => id !== tagIdToRemove);
		editPost({ tags: updatedTagIds });
	};

	return (
		<DocumentSettingPanel
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

			{!hasLoadedInitial || isSubmitting ? (
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
					<Spinner />
					{isSubmitting && <span>{__('Reindexing tags...', 'plusmagi-tags-reindex')}</span>}
				</div>
			) : (
				<div>
					{/* Tag Search and Input Field */}
					<FormTokenField
						label={__('TAGS', 'plusmagi-tags-reindex')}
						value={[]}
						suggestions={suggestions}
						onChange={(tokens) => {
							handleTagsChange(tokens);
							setSuggestions([]);
						}}
						onInputChange={handleInputChange}
						placeholder={__('Add new tag', 'plusmagi-tags-reindex')}
						__next40pxDefaultSize
					/>
					{isSearching && (
						<div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
							<Spinner />
							<small>{__('Searching tags...', 'plusmagi-tags-reindex')}</small>
						</div>
					)}

					{/* Tag Usage Summary Panel */}
					{statsList.length > 0 && (
						<div className="plusmagi-tags-list" style={{ marginTop: '15px', border: '1px solid #dcdcde', borderRadius: '4px', overflow: 'hidden' }}>
							{/* Panel Header */}
							<div style={{ padding: '8px 10px', background: '#f6f7f7', borderBottom: '1px solid #dcdcde', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<strong className="plusmagi-tags-list__title" style={{ margin: 0 }}>
									{__('Tag Usage Summary', 'plusmagi-tags-reindex')}
								</strong>
								{isLoadingStats && <Spinner />}
							</div>

							{/* Tag Items List */}
							<ul className="plusmagi-tags-list__items" style={{ border: 'none', borderRadius: 0 }}>
								{statsList.map((stat) => {
									const isNew = stat.all === 0;

									return (
										<li key={stat.id} className="plusmagi-tags-list__item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px', position: 'relative', padding: '8px 10px' }}>
											<div className="plusmagi-tags-list__info" style={{ width: '100%', paddingRight: '24px' }}>
												{/* Tag Name */}
												<div className="plusmagi-tags-list__name" style={{ fontWeight: 600 }}>
													{stat.name}
												</div>

												{/* Vertical Stats Row per Item */}
												<div className="plusmagi-tags-list__stats" style={{ display: 'flex', gap: '8px', marginTop: '3px', fontSize: '11px', flexWrap: 'wrap' }}>
													{isNew ? (
														<span style={{ color: '#008a20', fontWeight: 600, background: '#e7f5ea', padding: '1px 6px', borderRadius: '3px' }}>
															{__('New Tag', 'plusmagi-tags-reindex')}
														</span>
													) : (
														<>
															{stat.all > 0 && <span>Total: <strong>{stat.all}</strong></span>}
															{stat.published > 0 && <span style={{ color: '#008a20' }}>Publish: <strong>{stat.published}</strong></span>}
															{stat.draft > 0 && <span style={{ color: '#d63638' }}>Draft: <strong>{stat.draft}</strong></span>}
														</>
													)}
												</div>
											</div>

											{/* Action Remove Button */}
											<Button
												className="plusmagi-tags-list__remove"
												isDestructive
												isSmall
												variant="tertiary"
												onClick={() => handleRemoveTag(stat.id)}
												aria-label={`Remove ${stat.name}`}
												style={{ position: 'absolute', right: '8px', top: '8px', padding: '0 2px', height: '18px', minWidth: '16px', lineHeight: '1' }}
											>
												✕
											</Button>
										</li>
									);
								})}
							</ul>

							{/* Overall Summary Footer Panel */}
							<div className="plusmagi-tags-summary" style={{ padding: '10px 12px', background: '#f8f9fa', borderTop: '1px solid #dcdcde', margin: 0 }}>
								<div style={{ fontSize: '11px', fontWeight: 600, color: '#1e1e1e', marginBottom: '4px' }}>
									{__('Summary Total', 'plusmagi-tags-reindex')}
								</div>
								<div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#555', flexWrap: 'wrap' }}>
									<span>Total Tags: <strong>{totalTagsCount}</strong></span>
									<span style={{ color: '#008a20' }}>Published: <strong>{totalPublishedCount}</strong></span>
									<span style={{ color: '#d63638' }}>Drafts: <strong>{totalDraftCount}</strong></span>
									<span style={{ color: '#008a20' }}>New Tags: <strong>{newTagsCount}</strong></span>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</DocumentSettingPanel>
	);
};

// Register Gutenberg plugin
registerPlugin('plusmagi-tags-reindex', {
	render: TagsReindexPanel,
	icon: 'tag',
});

// Remove default WordPress tags panel safely
if (typeof window !== 'undefined' && window.wp?.domReady) {
	window.wp.domReady(() => {
		dispatch('core/editor')?.removeEditorPanel('taxonomy-panel-post_tag');
	});
}

export default TagsReindexPanel;