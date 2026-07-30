const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Entity Relationship', () => {
  test('renders a basic ER diagram', async ({ page }) => {
    await renderMermaidDiagram(page, `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`);
  });
});