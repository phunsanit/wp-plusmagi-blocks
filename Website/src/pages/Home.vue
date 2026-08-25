<template>
	<div class="page-shell min-h-screen text-[#17262a]">
		<div class="ambient-bg" aria-hidden="true"></div>

		<header class="sticky top-0 z-30 border-b border-[#245963]/20 bg-[#f7f6f1]/85 backdrop-blur-md">
			<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
				<a href="#top" class="brand text-lg font-black tracking-tight text-[#0f3840]">PlusMagi Blocks</a>
				<nav class="hidden items-center gap-5 text-sm font-semibold text-[#355e67] md:flex">
					<a href="#plugin" class="hover:text-[#0f3840]">Plugin</a>
					<a href="#steps" class="hover:text-[#0f3840]">Mermaid Block Steps</a>
					<a href="#examples" class="hover:text-[#0f3840]">Examples</a>
					<a href="#faq" class="hover:text-[#0f3840]">FAQ</a>
				</nav>
			</div>
		</header>

		<main id="top" class="relative z-10">
			<section id="plugin" class="mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
				<div class="reveal-up rounded-[1.7rem] border border-[#2f5a64]/20 bg-white/85 p-4 shadow-[0_28px_80px_-40px_rgba(15,56,64,0.55)] md:p-6">
					<img src="/images/plugin-banner-1544x500.png" alt="PlusMagi Blocks plugin header" class="h-auto w-full rounded-2xl border border-[#dbe8ea]" />
				</div>

				<div class="mt-7 grid gap-8 md:grid-cols-[1.15fr_0.85fr]">
					<div class="reveal-up delay-1">
						<p class="eyebrow">WordPress Plugin Page Style</p>
						<h1 class="hero-title mt-4 text-4xl leading-tight sm:text-5xl md:text-6xl">
							Build Mermaid Diagrams
							<span class="block text-[#d25730]">Directly in Gutenberg</span>
						</h1>
						<p class="mt-5 max-w-2xl text-base leading-relaxed text-[#365d67] sm:text-lg">
							PlusMagi Blocks adds a Mermaid block for technical writing and a Description List block for structured documentation.
							This page mirrors a plugin-directory landing layout and explains how to place Mermaid blocks step by step.
						</p>
						<div class="mt-7 flex flex-col gap-3 sm:flex-row">
							<a href="#steps" class="inline-flex justify-center rounded-full bg-[#113f47] px-6 py-3 text-sm font-bold text-[#f7f6f1] transition hover:bg-[#0b2f35]">
								Start Placement Guide
							</a>
							<a href="#examples" class="inline-flex justify-center rounded-full border border-[#113f47]/30 bg-[#fffdf8] px-6 py-3 text-sm font-bold text-[#113f47] transition hover:border-[#113f47]/65">
								View Example Output
							</a>
						</div>
					</div>

					<aside class="reveal-up delay-2 rounded-3xl border border-[#245963]/15 bg-[#f8fbfb] p-5">
						<h2 class="panel-title text-lg font-extrabold text-[#173e46]">Inside This Plugin</h2>
						<ul class="mt-4 space-y-3 text-sm text-[#355d65]">
							<li class="diag-row"><span class="dot bg-[#d25730]"></span>Mermaid block with live SVG preview</li>
							<li class="diag-row"><span class="dot bg-[#2f866d]"></span>Description List block for docs and glossaries</li>
							<li class="diag-row"><span class="dot bg-[#3272a6]"></span>Frontend Mermaid rendering support</li>
							<li class="diag-row"><span class="dot bg-[#d8a233]"></span>WordPress + AMP friendly output strategy</li>
						</ul>
					</aside>
				</div>
			</section>

			<section id="steps" class="mx-auto max-w-6xl px-4 pb-10 md:pb-14">
				<div class="rounded-3xl border border-[#164650]/15 bg-[#123941] p-6 text-[#ecf7f7] md:p-8">
					<h2 class="section-title text-2xl font-black md:text-3xl">How To Place Mermaid Block</h2>
					<ol class="mt-5 grid gap-4 md:grid-cols-2">
						<li v-for="(step, index) in mermaidSteps" :key="step.title" class="step-card reveal-up" :style="{ animationDelay: `${index * 90}ms` }">
							<p class="text-xs font-extrabold tracking-[0.16em] text-[#ffd074]">STEP {{ index + 1 }}</p>
							<h3 class="mt-1 text-lg font-black text-white">{{ step.title }}</h3>
							<p class="mt-2 text-sm text-[#d2e5e7]">{{ step.text }}</p>
						</li>
					</ol>
				</div>
			</section>

			<section id="examples" class="mx-auto max-w-6xl px-4 pb-10 md:pb-14">
				<h2 class="section-title reveal-up text-2xl font-black text-[#153d44] md:text-3xl">Plugin Page Visuals</h2>
				<div class="mt-5 grid gap-5 md:grid-cols-3">
					<article v-for="shot in screenshots" :key="shot.title" class="card reveal-up overflow-hidden" :style="{ animationDelay: `${shot.delay}ms` }">
						<img :src="shot.path" :alt="shot.title" class="h-48 w-full object-cover" />
						<div class="p-4">
							<h3 class="text-base font-black text-[#1c444c]">{{ shot.title }}</h3>
							<p class="mt-2 text-sm text-[#3c626a]">{{ shot.text }}</p>
						</div>
					</article>
				</div>

				<div class="reveal-up mt-6 rounded-2xl border border-[#2a5560]/15 bg-white/85 p-5">
					<p class="code-label">Mermaid example</p>
					<pre class="mt-3 overflow-x-auto rounded-xl bg-[#0f252a] p-4 text-sm text-[#cce4e8]"><code>{{ mermaidSample }}</code></pre>
				</div>
			</section>

			<section id="faq" class="mx-auto max-w-6xl px-4 pb-20">
				<div class="rounded-3xl border border-[#1f4f58]/18 bg-[#eff7f7] p-6 md:p-8">
					<h2 class="section-title text-2xl font-black text-[#153d44] md:text-3xl">Mermaid Block Quick FAQ</h2>
					<div class="mt-5 grid gap-4 md:grid-cols-2">
						<article v-for="qa in faqItems" :key="qa.q" class="card reveal-up p-5">
							<h3 class="text-base font-black text-[#1c444c]">{{ qa.q }}</h3>
							<p class="mt-2 text-sm text-[#3c626a]">{{ qa.a }}</p>
						</article>
					</div>
				</div>
			</section>
		</main>
	</div>
</template>

<script setup lang="ts">
const mermaidSteps = [
	{
		title: 'Open The Block Inserter',
		text: 'Create or edit a post, click + Add Block, then search for Mermaid or PlusMagi Blocks + Mermaid.',
	},
	{
		title: 'Insert Mermaid Block',
		text: 'Choose the Mermaid block and focus the editor area. A text area appears for Mermaid syntax input.',
	},
	{
		title: 'Paste Diagram Code',
		text: 'Paste code such as flowchart or sequence diagram syntax. Keep one diagram per block for clean rendering.',
	},
	{
		title: 'Check Live Preview',
		text: 'The block renders SVG preview in editor. If syntax has errors, fix the Mermaid code and recheck immediately.',
	},
	{
		title: 'Publish And Verify Frontend',
		text: 'Publish or update the post, then open the frontend page to confirm the diagram is rendered and responsive.',
	},
	{
		title: 'Use Multiple Blocks For Sections',
		text: 'For long documents, split diagrams into several Mermaid blocks to keep each topic readable and maintainable.',
	},
];

const screenshots = [
	{
		title: 'Plugin Header Banner',
		text: 'Header area in plugin-page style similar to WordPress plugin directory listings.',
		path: '/images/plugin-banner-772x250.png',
		delay: 0,
	},
	{
		title: 'Mermaid Block Editor',
		text: 'Editing Mermaid syntax and checking preview directly in Gutenberg.',
		path: '/images/plugin-screenshot-1.png',
		delay: 90,
	},
	{
		title: 'Frontend Mermaid Result',
		text: 'Published post output with rendered Mermaid diagram for readers.',
		path: '/images/plugin-screenshot-2.png',
		delay: 180,
	},
];

const mermaidSample = `graph TD
    A[Start] --> B{Need Mermaid Block?}
    B -- Yes --> C[Insert PlusMagi Mermaid Block]
    C --> D[Paste Mermaid Code]
    D --> E[Preview SVG]
    E --> F[Publish Post]`;

const faqItems = [
	{
		q: 'Can I add more than one Mermaid block in a post?',
		a: 'Yes. Add as many Mermaid blocks as needed. This is recommended for long technical documents.',
	},
	{
		q: 'What if preview does not render?',
		a: 'Check Mermaid syntax first. Most issues come from missing arrows, invalid keywords, or unmatched brackets.',
	},
	{
		q: 'Is the Mermaid output responsive?',
		a: 'Yes. The plugin output is designed to scale in normal WordPress content width and mobile layouts.',
	},
	{
		q: 'Which keywords should users search in inserter?',
		a: 'Search with Mermaid or PlusMagi to find the block quickly in Gutenberg inserter.',
	},
];
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Alfa+Slab+One&display=swap');

.page-shell {
	font-family: 'Sora', sans-serif;
	background: #f7f6f1;
}

.ambient-bg {
	position: fixed;
	inset: 0;
	pointer-events: none;
	background-image:
		radial-gradient(circle at 8% 14%, rgba(210, 87, 48, 0.2), transparent 25%),
		radial-gradient(circle at 86% 12%, rgba(34, 114, 135, 0.18), transparent 24%),
		radial-gradient(circle at 52% 86%, rgba(52, 138, 113, 0.14), transparent 28%);
}

.brand,
.hero-title,
.section-title,
.panel-title {
	font-family: 'Alfa Slab One', serif;
	font-weight: 400;
}

.eyebrow {
	display: inline-flex;
	border: 1px solid rgba(23, 58, 63, 0.25);
	background: rgba(255, 255, 255, 0.8);
	border-radius: 999px;
	padding: 0.38rem 0.78rem;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: #254e56;
}

.card {
	border-radius: 1.1rem;
	border: 1px solid rgba(36, 89, 99, 0.16);
	background: rgba(255, 255, 255, 0.88);
}

.step-card {
	border-radius: 1rem;
	border: 1px solid rgba(255, 255, 255, 0.16);
	background: rgba(255, 255, 255, 0.06);
	padding: 1rem;
}

.code-label {
	font-size: 0.73rem;
	font-weight: 700;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: #2d5d66;
}

.diag-row {
	display: flex;
	align-items: flex-start;
	gap: 0.6rem;
}

.dot {
	margin-top: 0.42rem;
	height: 0.5rem;
	width: 0.5rem;
	border-radius: 999px;
	flex-shrink: 0;
}

.reveal-up {
	opacity: 0;
	transform: translateY(16px);
	animation: revealUp 560ms cubic-bezier(0.2, 0.75, 0.18, 1) forwards;
}

.delay-1 {
	animation-delay: 150ms;
}

@keyframes revealUp {
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
