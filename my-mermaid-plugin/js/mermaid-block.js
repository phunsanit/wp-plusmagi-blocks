(function (wp) {
  const { registerBlockType } = wp.blocks;
  const { useBlockProps } = wp.blockEditor || wp.editor;
  const { TextareaControl, Notice } = wp.components;
  const { useEffect, useRef } = wp.element;
  const { __ } = wp.i18n;

  registerBlockType('my-mermaid/diagram', {
    title: __('Mermaid Diagram'),
    icon: 'editor-code',
    category: 'widgets',
    attributes: {
      content: {
        type: 'string',
        source: 'text',
        selector: 'pre',
      },
    },
    supports: {
      html: false,
    },
    edit: function Edit(props) {
      const { attributes, setAttributes } = props;
      const previewRef = useRef(null);
      const blockProps = useBlockProps({ className: 'my-mermaid-block' });

      useEffect(() => {
        if (!previewRef.current || !window.mermaid) {
          return;
        }

        const value = attributes.content || '';
        if (!value.trim()) {
          previewRef.current.innerHTML = '<p class="components-placeholder__instructions">Type Mermaid syntax to preview it here.</p>';
          return;
        }

        const id = 'mermaid-preview-' + Math.random().toString(36).slice(2, 10);
        previewRef.current.innerHTML = '';

        window.mermaid.render(id, value)
          .then((result) => {
            previewRef.current.innerHTML = result.svg;
          })
          .catch((error) => {
            previewRef.current.innerHTML = '';
            console.error('Mermaid preview failed:', error);
          });
      }, [attributes.content]);

      return wp.element.createElement(
        'div',
        blockProps,
        wp.element.createElement(
          Notice,
          { status: 'info', isDismissible: false },
          __('Write Mermaid syntax below and preview it instantly.')
        ),
        wp.element.createElement(TextareaControl, {
          label: __('Mermaid markdown'),
          value: attributes.content || '',
          help: __('This content is saved with the post and rendered as SVG on the frontend.'),
          onChange: (value) => setAttributes({ content: value }),
          rows: 8,
        }),
        wp.element.createElement('div', {
          ref: previewRef,
          className: 'my-mermaid-preview',
          style: { marginTop: '12px' },
        })
      );
    },
    save: function Save(props) {
      const content = props.attributes.content || '';
      return wp.element.createElement(
        'pre',
        { className: 'wp-block-code' },
        wp.element.createElement(
          'code',
          { className: 'language-mermaid' },
          content
        )
      );
    },
  });
})(window.wp);
