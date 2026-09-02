const { expect, test, renderMermaidDiagram, renderMermaidDiagramWithSiteTheme } = require('./helpers/mermaid-editor');
const options = require('./options.json');
const theming = options.theming ?? options;

const themeOptions = theming.theme ?? options.theme ?? [];
const defaultTheme = (themeOptions.find((option) => option.default === true) ?? themeOptions[0]).value;
const themeNames = themeOptions.map((option) => option.value);

const configTheming = theming.configTheming ?? options.configTheming ?? {};

const normalizeCases = (items = []) =>
	items
		.map((item) => {
			if (Array.isArray(item)) {
				return { name: item[0], value: item[1] };
			}
			if (item && typeof item.variable === 'string') {
				return { ...item, name: item.variable, value: item.value ?? item.defaultValue };
			}
			return item;
		})
		.filter((item) => item && typeof item.name === 'string');

const themeVariables = normalizeCases(
	theming.themeVariables
		?? options.themeVariables
		?? configTheming.themeVariables
		?? configTheming.coreThemeVariableCases
		?? options.themeVariableCases,
);
const flowchartVariable = normalizeCases(
	theming.flowchartVariable?.variables
		?? theming.flowchartVariable?.options
		?? options.flowchartVariable?.variables
		?? options.flowchartVariable?.options
		?? configTheming.flowchartVariable?.variables
		?? configTheming.flowchartVariable?.options
		?? configTheming.flowchartVariableCases,
);
const sequenceVariable = normalizeCases(
	theming.sequenceDiagramVariables?.variables
		?? theming.sequenceDiagramVariables
		?? theming.sequenceVariable
		?? options.sequenceDiagramVariables?.variables
		?? options.sequenceDiagramVariables
		?? options.sequenceVariable
		?? configTheming.sequenceVariable?.variables
		?? configTheming.sequenceVariable
		?? configTheming.sequenceVariableCases,
);
const pieDiagramVariables = normalizeCases(
	theming.pieDiagramVariables?.variables
		?? theming.pieDiagramVariables
		?? configTheming.pieDiagramVariables?.variables
		?? configTheming.pieDiagramVariables,
);
const stateColor = normalizeCases(
	theming.stateColor?.variables
		?? theming.stateColor
		?? options.stateColor?.variables
		?? options.stateColor
		?? configTheming.stateColor?.variables
		?? configTheming.stateColor
		?? configTheming.stateColorCases,
);
const classColor = normalizeCases(
	theming.classColor?.variables
		?? theming.classColor
		?? options.classColor?.variables
		?? options.classColor
		?? configTheming.classColor?.variables
		?? configTheming.classColor
		?? configTheming.classColorCases,
);
const journey = normalizeCases(
	theming.journey?.variables
		?? theming.journey
		?? options.journey?.variables
		?? options.journey
		?? configTheming.journey?.variables
		?? configTheming.journey
		?? configTheming.userJourneyColorCases,
);

test.describe('Mermaid config - Theming', () => {
	const BASIC_FLOWCHART = `flowchart TD
	A[Start] --> B{Decision}
	B -->|Yes| C[Continue]
	B -->|No| D[Stop]`;

	for (const themeName of themeNames) {
		test(`supports site-wide theme initialize: ${themeName}`, async ({ page }) => {
			const preview = await renderMermaidDiagramWithSiteTheme(page, BASIC_FLOWCHART, themeName);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview).toContainText('Start');
			await expect(preview).toContainText('Decision');
		});
	}

	for (const themeName of themeNames) {
		test(`renders a flowchart with theme: ${themeName}`, async ({ page }) => {
			const preview = await renderMermaidDiagram(page, `---
config:
  theme: ${themeName}
---
${BASIC_FLOWCHART}`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview.getByText('Start', { exact: true })).toBeVisible();
			await expect(preview.getByText('Decision', { exact: true })).toBeVisible();
		});
	}

	test('renders a diagram with base theme variables', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    primaryColor: '#BB2528'
    primaryTextColor: '#fff'
    primaryBorderColor: '#7C0000'
    lineColor: '#F8B229'
    secondaryColor: '#006100'
    tertiaryColor: '#fff'
---
graph TD
	A[Christmas] -->|Get money| B(Go shopping)
	B --> C{Let me think}
	B --> G[/Another/]
	C ==>|One| D[Laptop]
	C -->|Two| E[iPhone]
	C -->|Three| F[fa:fa-car Car]
	subgraph section
		C
		D
		E
		F
		G
	end`);

		await expect(preview.locator('svg')).toBeVisible();
		await expect(preview.getByText('Christmas', { exact: true })).toBeVisible();
		await expect(preview.getByText('Go shopping', { exact: true })).toBeVisible();
		await expect(preview.getByText('Let me think', { exact: true })).toBeVisible();
	});

	test('applies core theme variables including darkMode/background/font/note/error', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    darkMode: true
    background: '#0f172a'
    fontFamily: 'trebuchet ms, verdana, arial'
    fontSize: '16px'
    primaryColor: '#1d4ed8'
    primaryTextColor: '#e2e8f0'
    secondaryColor: '#0ea5e9'
    secondaryBorderColor: '#0284c7'
    secondaryTextColor: '#e0f2fe'
    tertiaryColor: '#22c55e'
    tertiaryBorderColor: '#16a34a'
    tertiaryTextColor: '#dcfce7'
    noteBkgColor: '#fef08a'
    noteTextColor: '#1f2937'
    noteBorderColor: '#f59e0b'
    lineColor: '#38bdf8'
    textColor: '#e2e8f0'
    mainBkg: '#1e293b'
    errorBkgColor: '#7f1d1d'
    errorTextColor: '#fecaca'
---
flowchart TD
	A[Core Theme Vars] --> B[Node B]
	Note[Note-like label]
	B --> Note`);

		await expect(preview.locator('svg')).toBeVisible();
		await expect(preview.getByText('Core Theme Vars', { exact: true })).toBeVisible();
		await expect(preview.getByText('Node B', { exact: true })).toBeVisible();
	});

	test('derives related colors from primaryColor (color and color calculation)', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    primaryColor: '#ff0000'
---
flowchart TD
	A[Derived Colors] --> B[Node B]`);

		await expect(preview.locator('svg')).toBeVisible();
		await expect(preview).toContainText('Derived Colors');
		await expect(preview).toContainText('Node B');
	});

	for (const { name: variableName, value: variableValue } of themeVariables) {
		test(`supports theme variable: ${variableName}`, async ({ page }) => {
			const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    ${variableName}: ${variableValue}
---
flowchart TD
	A[Theme Variable Coverage] --> B[Node B]`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview).toContainText('Theme Variable Coverage');
			await expect(preview).toContainText('Node B');
		});
	}

	test('applies flowchart variable options', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    nodeBorder: '#005f73'
    clusterBkg: '#e9d8a6'
    clusterBorder: '#ca6702'
    defaultLinkColor: '#bb3e03'
    titleColor: '#001219'
    edgeLabelBackground: '#ee9b00'
    nodeTextColor: '#001219'
---
flowchart TD
	subgraph ClusterA
		A[Node A] --> B[Node B]
	end
	B --> C[Node C]`);

		await expect(preview.locator('svg')).toBeVisible();
		await expect(preview.getByText('Node A', { exact: true })).toBeVisible();
		await expect(preview.getByText('Node B', { exact: true })).toBeVisible();
		await expect(preview.getByText('Node C', { exact: true })).toBeVisible();
	});

	for (const { name: variableName, value: variableValue } of flowchartVariable) {
		test(`supports flowchart variable: ${variableName}`, async ({ page }) => {
			const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    ${variableName}: ${variableValue}
---
flowchart TD
	subgraph ClusterA
		A[Node A] --> B[Node B]
	end
	B --> C[Node C]`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview).toContainText('Node A');
			await expect(preview).toContainText('Node B');
			await expect(preview).toContainText('Node C');
		});
	}

	test('applies sequence variable options', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    actorBkg: '#fefae0'
    actorBorder: '#bc6c25'
    actorTextColor: '#283618'
    actorLineColor: '#bc6c25'
    signalColor: '#606c38'
    signalTextColor: '#606c38'
    labelBoxBkgColor: '#faedcd'
    labelBoxBorderColor: '#d4a373'
    labelTextColor: '#283618'
    loopTextColor: '#283618'
    activationBorderColor: '#bc6c25'
    activationBkgColor: '#dda15e'
    sequenceNumberColor: '#606c38'
---
sequenceDiagram
	autonumber
	participant A as Alice
	participant B as Bob
	A->>B: Ping
	B-->>A: Pong`);

		await expect(preview.locator('svg')).toBeVisible();
		await expect(preview).toContainText('Ping');
		await expect(preview).toContainText('Pong');
	});

	for (const { name: variableName, value: variableValue } of sequenceVariable) {
		test(`supports sequence variable: ${variableName}`, async ({ page }) => {
			const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    ${variableName}: ${variableValue}
---
sequenceDiagram
	autonumber
	participant A as Alice
	participant B as Bob
	A->>B: Ping
	B-->>A: Pong`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview).toContainText('Ping');
			await expect(preview).toContainText('Pong');
		});
	}

	test('applies pie variable options', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    pie1: '#264653'
    pie2: '#2a9d8f'
    pie3: '#e9c46a'
    pie4: '#f4a261'
    pie5: '#e76f51'
    pie6: '#8ecae6'
    pie7: '#219ebc'
    pie8: '#023047'
    pie9: '#ffb703'
    pie10: '#fb8500'
    pie11: '#90be6d'
    pie12: '#577590'
    pieTitleTextSize: '20px'
    pieTitleTextColor: '#0b132b'
    pieSectionTextSize: '16px'
    pieSectionTextColor: '#1d3557'
    pieLegendTextSize: '16px'
    pieLegendTextColor: '#1d3557'
    pieStrokeColor: '#1d3557'
    pieStrokeWidth: '3px'
    pieOuterStrokeWidth: '3px'
    pieOuterStrokeColor: '#1d3557'
    pieOpacity: 0.8
---
pie title Resource Allocation
	"Engineering" : 45
	"Design" : 20
	"QA" : 20
	"Ops" : 15`);

		await expect(preview.locator('svg')).toBeVisible();
		await expect(preview).toContainText('Resource Allocation');
		await expect(preview).toContainText('Engineering');
	});

	for (const { name: variableName, value: variableValue } of pieDiagramVariables) {
		test(`supports pie variable: ${variableName}`, async ({ page }) => {
			const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    ${variableName}: ${variableValue}
---
pie title Pie Variable Coverage
	"Engineering" : 45
	"Design" : 20
	"QA" : 20
	"Ops" : 15`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview).toContainText('Pie Variable Coverage');
			await expect(preview).toContainText('Engineering');
		});
	}

	test('applies state and class variable options', async ({ page }) => {
		const statePreview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    labelColor: '#1d3557'
    altBackground: '#a8dadc'
---
stateDiagram-v2
	[*] --> Idle
	Idle --> Active
	Active --> [*]`);

		await expect(statePreview.locator('svg')).toBeVisible();
		await expect(statePreview.getByText('Idle', { exact: true })).toBeVisible();
		await expect(statePreview.getByText('Active', { exact: true })).toBeVisible();

		const classPreview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    classText: '#2d1e2f'
---
classDiagram
	class Animal
	class Dog
	Animal <|-- Dog`);

		await expect(classPreview.locator('svg')).toBeVisible();
		await expect(classPreview.getByText('Animal', { exact: true })).toBeVisible();
		await expect(classPreview.getByText('Dog', { exact: true })).toBeVisible();
	});

	for (const { name: variableName, value: variableValue } of stateColor) {
		test(`supports state color variable: ${variableName}`, async ({ page }) => {
			const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    ${variableName}: ${variableValue}
---
stateDiagram-v2
	state Parent {
		[*] --> Idle
		Idle --> Active
	}
	Parent --> Done
	Done --> [*]`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview).toContainText('Idle');
			await expect(preview).toContainText('Active');
		});
	}

	for (const { name: variableName, value: variableValue } of classColor) {
		test(`supports class color variable: ${variableName}`, async ({ page }) => {
			const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    ${variableName}: ${variableValue}
---
classDiagram
	class Animal
	class Dog
	Animal <|-- Dog`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview).toContainText('Animal');
			await expect(preview).toContainText('Dog');
		});
	}

	test('applies user journey variable options', async ({ page }) => {
		const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    fillType0: '#003049'
    fillType1: '#d62828'
    fillType2: '#f77f00'
    fillType3: '#fcbf49'
    fillType4: '#eae2b7'
    fillType5: '#2a9d8f'
    fillType6: '#264653'
    fillType7: '#8ab17d'
---
journey
	title Purchase Journey
	section Discover
		Search product: 5: User
	section Checkout
		Pay and confirm: 4: User`);

		await expect(preview.locator('svg')).toBeVisible();
		await expect(preview).toContainText('Purchase Journey');
		await expect(preview).toContainText('Search product');
	});

	for (const { name: variableName, value: variableValue } of journey) {
		test(`supports user journey color variable: ${variableName}`, async ({ page }) => {
			const preview = await renderMermaidDiagram(page, `---
config:
  theme: base
  themeVariables:
    ${variableName}: ${variableValue}
---
journey
	title Journey Variable Coverage
	section Discover
		Search product: 5: User
	section Checkout
		Pay and confirm: 4: User`);

			await expect(preview.locator('svg')).toBeVisible();
			await expect(preview).toContainText('Journey Variable Coverage');
			await expect(preview).toContainText('Search product');
		});
	}
});