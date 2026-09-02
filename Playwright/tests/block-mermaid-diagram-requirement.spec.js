const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Requirement', () => {
  test('renders a basic requirement diagram', async ({ page }) => {
    await renderMermaidDiagram(page, `requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req`);
  });
});