const test = require('node:test');
const assert = require('node:assert/strict');

const { collectMermaidElements } = require('../js/frontend-renderer.js');

test('collectMermaidElements finds Mermaid blocks from the document', () => {
  const root = {
    querySelectorAll: () => [
      { dataset: { mermaidSource: 'graph TD\nA-->B' } },
      { dataset: { mermaidSource: 'flowchart LR\nC-->D' } },
    ],
  };

  const blocks = collectMermaidElements(root);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].dataset.mermaidSource, 'graph TD\nA-->B');
});
