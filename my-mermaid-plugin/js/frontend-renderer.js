(function () {
  function collectMermaidElements(root) {
    return Array.from(root.querySelectorAll('[data-mermaid-source]'));
  }

  function renderMermaid(root) {
    if (typeof window === 'undefined' || !window.mermaid) {
      return;
    }

    const blocks = collectMermaidElements(root || document);
    blocks.forEach((block, index) => {
      const source = block.dataset.mermaidSource || block.textContent || '';
      if (!source.trim()) {
        return;
      }

      const id = `mermaid-render-${Date.now()}-${index}`;
      window.mermaid.render(id, source).then((result) => {
        block.innerHTML = result.svg;
        block.classList.add('is-rendered');
      }).catch((error) => {
        console.error('Mermaid rendering failed:', error);
      });
    });
  }

  if (typeof module !== 'undefined') {
    module.exports = { collectMermaidElements, renderMermaid };
  }

  if (typeof window !== 'undefined') {
    window.renderMermaid = renderMermaid;
    window.addEventListener('DOMContentLoaded', () => renderMermaid(document));
  }
})();
