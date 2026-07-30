const { test, renderMermaidDiagram } = require('./helpers/mermaid-editor');

test.describe('Mermaid diagram - Swimlanes', () => {
  test('renders a basic swimlane diagram', async ({ page }) => {
    await renderMermaidDiagram(page, `swimlane-beta LR
  subgraph Customer
    request[Request service]
    receive[Receive update]
  end

  subgraph Support
    triage[Triage request]
    answer[Send answer]
  end

  request --> triage
  triage -->|Known issue| answer
  answer --> receive`);
  });
});