(function (wp) {
  const { registerBlockType } = wp.blocks;
  const { useBlockProps, InspectorControls } = wp.blockEditor || wp.editor;
  const { TextControl, Button, Modal, Notice, PanelBody } = wp.components;
  const { useState } = wp.element;
  const { __ } = wp.i18n;

  const toSlug = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'term';

  const splitTags = (value) =>
    String(value || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

  /**
   * Thesaurus Block - A structured dictionary/thesaurus entry block
   * Allows editors to create thesaurus entries with terms, definitions, synonyms, and antonyms
   */
  registerBlockType('my-thesaurus/entry', {
    title: __('Thesaurus Entry'),
    icon: 'book',
    category: 'widgets',
    attributes: {
      heading: {
        type: 'string',
        default: 'Semantic Thesaurus',
      },
      entries: {
        type: 'array',
        default: [],
      },
    },
    supports: {
      html: false,
    },

    edit: function Edit(props) {
      const { attributes, setAttributes } = props;
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [editingIndex, setEditingIndex] = useState(null);
      const [formData, setFormData] = useState({
        term: '',
        pos: '',
        definition: '',
        synonyms: '',
        antonyms: '',
      });

      const blockProps = useBlockProps({ className: 'my-thesaurus-block' });

      const handleAddEntry = () => {
        setEditingIndex(null);
        setFormData({
          term: '',
          pos: '',
          definition: '',
          synonyms: '',
          antonyms: '',
        });
        setIsModalOpen(true);
      };

      const handleEditEntry = (index) => {
        const entry = attributes.entries[index];
        setFormData({
          term: entry.term || '',
          pos: entry.pos || '',
          definition: entry.definition || '',
          synonyms: entry.synonyms || '',
          antonyms: entry.antonyms || '',
        });
        setEditingIndex(index);
        setIsModalOpen(true);
      };

      const handleSaveEntry = () => {
        if (!formData.term.trim()) {
          alert(__('Term is required'));
          return;
        }

        const newEntries = [...attributes.entries];
        if (editingIndex !== null) {
          newEntries[editingIndex] = formData;
        } else {
          newEntries.push(formData);
        }

        setAttributes({ entries: newEntries });
        setIsModalOpen(false);
      };

      const handleDeleteEntry = (index) => {
        const newEntries = attributes.entries.filter((_, i) => i !== index);
        setAttributes({ entries: newEntries });
      };

      const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingIndex(null);
      };

      return wp.element.createElement(
        'div',
        blockProps,
        wp.element.createElement(
          InspectorControls,
          null,
          wp.element.createElement(
            PanelBody,
            { title: __('Thesaurus Settings'), initialOpen: true },
            wp.element.createElement(TextControl, {
              label: __('Heading'),
              value: attributes.heading || 'Semantic Thesaurus',
              onChange: (value) => setAttributes({ heading: value }),
              placeholder: __('e.g., Semantic Thesaurus'),
              help: __('Shown above the thesaurus entries on the frontend.'),
            })
          )
        ),

        wp.element.createElement(
          Notice,
          { status: 'info', isDismissible: false },
          __('Create thesaurus entries with definitions, synonyms, and antonyms.')
        ),

        wp.element.createElement(
          'div',
          { style: { marginTop: '12px', marginBottom: '12px' } },
          wp.element.createElement(
            Button,
            {
              isPrimary: true,
              onClick: handleAddEntry,
            },
            __('+ Add Thesaurus Entry')
          )
        ),

        attributes.entries.length === 0
          ? wp.element.createElement(
              'div',
              { style: { padding: '12px', textAlign: 'center', color: '#999' } },
              __('No entries yet. Add one to get started!')
            )
          : wp.element.createElement(
              'div',
              { className: 'thesaurus-editor-preview' },
              attributes.entries.map((entry, index) =>
                wp.element.createElement(
                  'div',
                  {
                    key: index,
                    style: {
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '12px',
                      marginBottom: '12px',
                    },
                  },
                  wp.element.createElement(
                    'div',
                    { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                    wp.element.createElement(
                      'div',
                      null,
                      wp.element.createElement(
                        'strong',
                        null,
                        entry.term,
                        ' ',
                        entry.pos && wp.element.createElement('em', { style: { color: '#999', fontSize: '0.9em' } }, '(' + entry.pos + ')')
                      )
                    ),
                    wp.element.createElement(
                      'div',
                      null,
                      wp.element.createElement(
                        Button,
                        {
                          isSecondary: true,
                          isSmall: true,
                          onClick: () => handleEditEntry(index),
                        },
                        __('Edit')
                      ),
                      ' ',
                      wp.element.createElement(
                        Button,
                        {
                          isDestructive: true,
                          isSmall: true,
                          onClick: () => handleDeleteEntry(index),
                        },
                        __('Delete')
                      )
                    )
                  ),
                  wp.element.createElement(
                    'div',
                    { style: { fontSize: '0.9em', color: '#666', marginTop: '8px' } },
                    entry.definition
                  ),
                  entry.synonyms &&
                    wp.element.createElement(
                      'div',
                      { style: { fontSize: '0.85em', marginTop: '6px' } },
                      wp.element.createElement('strong', { style: { color: '#0284c7' } }, 'Synonyms:'),
                      ' ',
                      entry.synonyms
                    ),
                  entry.antonyms &&
                    wp.element.createElement(
                      'div',
                      { style: { fontSize: '0.85em', marginTop: '4px' } },
                      wp.element.createElement('strong', { style: { color: '#e11d48' } }, 'Antonyms:'),
                      ' ',
                      entry.antonyms
                    )
                )
              )
            ),

        isModalOpen &&
          wp.element.createElement(
            Modal,
            {
              title: editingIndex !== null ? __('Edit Thesaurus Entry') : __('Add Thesaurus Entry'),
              onRequestClose: handleCloseModal,
              size: 'large',
            },
            wp.element.createElement(
              'div',
              { style: { padding: '12px' } },
              wp.element.createElement(TextControl, {
                label: __('Term'),
                value: formData.term,
                onChange: (value) => setFormData({ ...formData, term: value }),
                placeholder: __('e.g., Fast'),
                help: __('The word or phrase to define'),
              }),

              wp.element.createElement(TextControl, {
                label: __('Part of Speech (optional)'),
                value: formData.pos,
                onChange: (value) => setFormData({ ...formData, pos: value }),
                placeholder: __('e.g., adj., noun, verb'),
              }),

              wp.element.createElement(TextControl, {
                label: __('Definition'),
                value: formData.definition,
                onChange: (value) => setFormData({ ...formData, definition: value }),
                placeholder: __('The meaning of the term'),
                help: __('Clear and concise definition'),
              }),

              wp.element.createElement(TextControl, {
                label: __('Synonyms (optional)'),
                value: formData.synonyms,
                onChange: (value) => setFormData({ ...formData, synonyms: value }),
                placeholder: __('e.g., quick, rapid, swift, speedy'),
                help: __('Comma-separated list of similar words'),
              }),

              wp.element.createElement(TextControl, {
                label: __('Antonyms (optional)'),
                value: formData.antonyms,
                onChange: (value) => setFormData({ ...formData, antonyms: value }),
                placeholder: __('e.g., slow, sluggish'),
                help: __('Comma-separated list of opposite words'),
              }),

              wp.element.createElement(
                'div',
                { style: { marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' } },
                wp.element.createElement(
                  Button,
                  { isSecondary: true, onClick: handleCloseModal },
                  __('Cancel')
                ),
                wp.element.createElement(
                  Button,
                  { isPrimary: true, onClick: handleSaveEntry },
                  __('Save Entry')
                )
              )
            )
          )
      );
    },

    save: function Save(props) {
      const { entries } = props.attributes;
      const heading = (props.attributes.heading || 'Semantic Thesaurus').trim() || 'Semantic Thesaurus';
      const headingId = 'thesaurus-heading-' + toSlug(heading) + '-' + entries.length;

      return wp.element.createElement(
        'div',
        { className: 'thesaurus-container' },
        wp.element.createElement('h2', { id: headingId }, heading),
        wp.element.createElement(
          'dl',
          { 'aria-labelledby': headingId },
          entries.map((entry, index) => {
            const termSlug = toSlug(entry.term);
            const termId = 'term-' + termSlug + '-' + index;
            const synonyms = splitTags(entry.synonyms);
            const antonyms = splitTags(entry.antonyms);

            return (
            wp.element.createElement(
              'div',
              {
                key: index,
                className: 'thesaurus-entry',
                itemScope: true,
                itemType: 'https://schema.org/DefinedTerm',
                'data-term': termSlug,
              },
              wp.element.createElement(
                'dt',
                { id: termId },
                wp.element.createElement('dfn', { itemProp: 'name', lang: 'en' }, entry.term),
                entry.pos &&
                  wp.element.createElement(
                    'span',
                    {
                      className: 'pos',
                      title: 'Part of Speech: ' + entry.pos,
                      'aria-label': 'Part of Speech: ' + entry.pos,
                    },
                    entry.pos
                  )
              ),

              entry.definition &&
                wp.element.createElement(
                  'dd',
                  {
                    'data-type': 'definition',
                    itemProp: 'description',
                    'aria-describedby': termId,
                  },
                  entry.definition
                ),

              synonyms.length > 0 &&
                wp.element.createElement(
                  'dd',
                  {
                    'data-type': 'synonyms',
                    'aria-label': 'Synonyms for ' + entry.term,
                  },
                  wp.element.createElement('span', { className: 'label', 'aria-hidden': 'true' }, 'Synonyms:'),
                  wp.element.createElement(
                    'ul',
                    { className: 'tag-list', role: 'list' },
                    synonyms.map((tag, i) =>
                        wp.element.createElement(
                          'li',
                          { key: i, className: 'tag', itemProp: 'sameAs' },
                          tag.trim()
                        )
                      )
                  )
                ),

              antonyms.length > 0 &&
                wp.element.createElement(
                  'dd',
                  {
                    'data-type': 'antonyms',
                    'aria-label': 'Antonyms for ' + entry.term,
                  },
                  wp.element.createElement('span', { className: 'label', 'aria-hidden': 'true' }, 'Antonyms:'),
                  wp.element.createElement(
                    'ul',
                    { className: 'tag-list', role: 'list' },
                    antonyms.map((tag, i) =>
                        wp.element.createElement(
                          'li',
                          { key: i, className: 'tag' },
                          tag.trim()
                        )
                      )
                  )
                )
            )
            );
          })
        )
      );
    },
  });
})(window.wp);
