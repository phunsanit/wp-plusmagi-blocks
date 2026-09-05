const diagram = (id, name, path, source, format = 'svg') => ({
	id,
	name,
	target: path,
	url: `https://plantuml.com/${path}`,
	source,
	format,
});

const PLANTUML_DIAGRAMS = [
	diagram('sequence', 'Sequence Diagram', 'code-javascript-asynchronous', `@startuml
participant "Web Browser" as WB
participant "Node.js Server" as NS
WB -> NS : fetch('/api/data')
activate NS
NS --> WB : Promise pending
NS -> NS : await db.query()
NS --> WB : JSON response
deactivate NS
@enduml`),
	diagram('use-case', 'Use Case Diagram', 'use-case-diagram', `@startuml
left to right direction
actor Customer
usecase "Place Order" as UC1
Customer --> UC1
@enduml`),
	diagram('class', 'Class Diagram', 'class-diagram', `@startuml
class Animal {
  +String name
  +makeSound()
}
class Dog
Animal <|-- Dog
@enduml`),
	diagram('object', 'Object Diagram', 'object-diagram', `@startuml
object Server01
Server01 : name = "Server 01"
Server01 : status = "active"
@enduml`),
	diagram('activity', 'Activity Diagram', 'activity-diagram-beta', `@startuml
start
:Read request;
if (Valid?) then (yes)
  :Process request;
else (no)
  :Return error;
endif
stop
@enduml`),
	diagram('component', 'Component Diagram', 'component-diagram', `@startuml
[Frontend] --> [API Gateway]
[API Gateway] --> [Backend Service]
@enduml`),
	diagram('deployment', 'Deployment Diagram', 'deployment-diagram', `@startuml
node "Web Server" {
  [App]
}
node "Database Server" {
  database "DB"
}
[App] --> DB
@enduml`),
	diagram('state', 'State Diagram', 'state-diagram', `@startuml
[*] --> Idle
Idle --> Running : start
Running --> Idle : stop
Running --> [*]
@enduml`),
	diagram('timing', 'Timing Diagram', 'timing-diagram', `@startuml
robust "Server" as S
S has Idle,Busy
@0
S is Idle
@100
S is Busy
@200
S is Idle
@enduml`),
	diagram('wireframe', 'Wireframe (Salt)', 'salt', `@startsalt
{
  Login
  Password
  [OK]
}
@endsalt`),
	diagram('gantt', 'Gantt Chart', 'gantt-diagram', `@startgantt
[Design] lasts 5 days
[Development] lasts 10 days
[Design] -> [Development]
@endgantt`),
	diagram('mindmap', 'MindMap', 'mindmap-diagram', `@startmindmap
* Root
** Branch A
** Branch B
@endmindmap`),
	diagram('wbs', 'Work Breakdown Structure', 'wbs-diagram', `@startwbs
* Project
** Phase 1
** Phase 2
@endwbs`),
	diagram('network', 'Network Diagram (nwdiag)', 'nwdiag', `@startnwdiag
nwdiag {
  network dmz {
    web01 [address = "210.1.1.1"];
    web02 [address = "210.1.1.2"];
  }
}
@endnwdiag`),
	diagram('json', 'JSON Data', 'json', `@startjson
{
  "name": "PlusMagi",
  "type": "plugin"
}
@endjson`),
	diagram('yaml', 'YAML Data', 'yaml', `@startyaml
name: PlusMagi
type: plugin
@endyaml`),
	diagram('ebnf', 'EBNF Diagram', 'ebnf', `@startebnf
digit = "0" | "1" | "2" | "3" ;
@endebnf`),
	diagram('regex', 'Regular Expression', 'regex', `@startregex
[a-z]+[0-9]*
@endregex`),
	diagram('ditaa', 'Ditaa (ASCII Art)', 'ditaa', `@startditaa
+--------+
| Hello  |
+--------+
@endditaa`, 'png'),
];

module.exports = { PLANTUML_DIAGRAMS };
