const diagram = (id, name, path, source) => ({
	id,
	name,
  target: path,
	url: `https://mermaid.js.org/syntax/${path}.html`,
	source,
});

const MERMAID_DIAGRAMS = [
	diagram('flowchart', 'Flowchart', 'flowchart', `flowchart LR
  Start --> Stop`),
	diagram('swimlanes', 'Swimlanes Diagram', 'swimlanes', `swimlane-beta LR
  subgraph Customer
    request[Request service]
  end
  subgraph Support
    triage[Triage request]
  end
  request --> triage`),
	diagram('sequence', 'Sequence Diagram', 'sequenceDiagram', `sequenceDiagram
  Alice->>John: Hello John, how are you?
  John-->>Alice: Great!`),
	diagram('class', 'Class Diagram', 'classDiagram', `classDiagram
  class Animal
  Animal <|-- Duck`),
	diagram('state', 'State Diagram', 'stateDiagram', `stateDiagram-v2
  [*] --> Still
  Still --> Moving
  Moving --> [*]`),
	diagram('entity-relationship', 'Entity Relationship Diagram', 'entityRelationshipDiagram', `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains`),
	diagram('user-journey', 'User Journey Diagram', 'userJourney', `journey
  title My working day
  section Go to work
    Make tea: 5: Me
    Go upstairs: 3: Me`),
	diagram('gantt', 'Gantt Diagram', 'gantt', `gantt
  title A Gantt Diagram
  dateFormat YYYY-MM-DD
  section Section
    A task: a1, 2026-01-01, 30d
    Another task: after a1, 20d`),
	diagram('pie', 'Pie Chart', 'pie', `pie title Pets adopted by volunteers
  "Dogs" : 386
  "Cats" : 85
  "Rats" : 15`),
	diagram('quadrant', 'Quadrant Chart', 'quadrantChart', `quadrantChart
  title Reach and engagement
  x-axis Low Reach --> High Reach
  y-axis Low Engagement --> High Engagement
  quadrant-1 Expand
  Campaign A: [0.3, 0.6]`),
	diagram('requirement', 'Requirement Diagram', 'requirementDiagram', `requirementDiagram
  requirement test_req {
    id: 1
    text: the test text
    risk: high
    verifymethod: test
  }
  element test_entity {
    type: simulation
  }
  test_entity - satisfies -> test_req`),
	diagram('git-graph', 'GitGraph Diagram', 'gitgraph', `gitGraph
  commit
  branch develop
  checkout develop
  commit
  checkout main
  merge develop`),
	diagram('c4', 'C4 Diagram', 'c4', `C4Context
  title System Context
  Person(user, "User")
  System(system, "System")
  Rel(user, system, "Uses")`),
	diagram('mindmap', 'Mindmap', 'mindmap', `mindmap
  Root
    Topic A
      Detail A
    Topic B`),
	diagram('timeline', 'Timeline', 'timeline', `timeline
  title History of Social Media
  2002 : LinkedIn
  2004 : Facebook
  2005 : YouTube`),
	diagram('zenuml', 'ZenUML', 'zenuml', `zenuml
  title Demo
  Alice->John: Hello John, how are you?
  John->Alice: Great!`),
	diagram('sankey', 'Sankey Diagram', 'sankey', `sankey
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,Industry,342.165
Electricity grid,Losses,56.691`),
	diagram('xy-chart', 'XY Chart', 'xyChart', `xychart
  title "Sales Revenue"
  x-axis [jan, feb, mar, apr]
  y-axis "Revenue" 4000 --> 11000
  bar [5000, 6000, 7500, 8200]`),
	diagram('block', 'Block Diagram', 'block', `block
  columns 1
  a b c`),
	diagram('packet', 'Packet Diagram', 'packet', `packet
  0-15: "Source Port"
  16-31: "Destination Port"
  32-63: "Sequence Number"`),
	diagram('kanban', 'Kanban Diagram', 'kanban', `kanban
  Todo[Todo]
    task1[Create Documentation]
  Done[Done]
    task2[Ship Release]`),
	diagram('architecture', 'Architecture Diagram', 'architecture', `architecture-beta
  group api(cloud)[API]
  service db(database)[Database] in api
  service server(server)[Server] in api
  db:L -- R:server`),
	diagram('radar', 'Radar Chart', 'radar', `radar-beta
  title Grades
  axis m["Math"], s["Science"], e["English"]
  curve a["Alice"]{85, 90, 80}
  max 100`),
	diagram('event-modeling', 'Event Modeling Diagram', 'eventmodeling', `eventmodeling
  tf 01 ui CartUI
  tf 02 cmd AddItem
  tf 03 evt ItemAdded`),
	diagram('treemap', 'Treemap Diagram', 'treemap', `treemap-beta
  "Category A"
    "Item A1": 10
    "Item A2": 20
  "Category B"
    "Item B1": 15`),
	diagram('venn', 'Venn Diagram', 'venn', `venn-beta
  title "Team overlap"
  set Frontend
  set Backend
  union Frontend,Backend["APIs"]`),
	diagram('ishikawa', 'Ishikawa Diagram', 'ishikawa', `ishikawa-beta
  Blurry Photo
  Process
    Out of focus
  User
    Shaky hands
  Equipment
    Dirty lens`),
	diagram('wardley', 'Wardley Map', 'wardley', `wardley-beta
  title Tea Shop Value Chain
  anchor Business [0.95, 0.63]
  component Cup of Tea [0.79, 0.61]
  component Tea [0.63, 0.81]
  Business -> Cup of Tea`),
	diagram('cynefin', 'Cynefin Framework', 'cynefin', `cynefin-beta
  title Incident Response
  complex
    "Investigate root cause"
  complicated
    "Analyze performance data"
  clear
    "Restart service"
  chaotic
    "Page on-call immediately"
  confusion
    "Unknown failure mode"`),
	diagram('treeview', 'TreeView Diagram', 'treeView', `treeView-beta
  my-project/
    src/
      index.js
    package.json`),
];

module.exports = { MERMAID_DIAGRAMS };