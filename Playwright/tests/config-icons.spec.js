const { test, renderMermaidSourcePreview } = require('./helpers/mermaid-editor');

test.describe('Mermaid config - Icons', () => {
  test('accepts icon references in flowchart labels', async ({ page }) => {
    await renderMermaidSourcePreview(page, `flowchart LR
  A --- B
  B-->C[fa:fa-ban forbidden]
  B-->D(fa:fa-spinner loading)`, 'forbidden');
  });

  test('accepts icon pack registration sample source shape', async ({ page }) => {
    await renderMermaidSourcePreview(page, `flowchart LR
  A[logos:github icon sample] --> B[pack:name syntax accepted]
  B --> C[registerIconPacks at app init]`, 'pack:name syntax accepted');
  });
});