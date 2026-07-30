const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// อ่านข้อมูลตัวเลือกจาก options.json
const optionsPath = path.join(__dirname, 'options.json');
const rawOptions = fs.readFileSync(optionsPath, 'utf-8');
const optionsData = JSON.parse(rawOptions);

// ฟังก์ชันสำหรับสุ่ม/ผสมตัวเลือก (Combinations)
function getRandomCombinations(data, maxCombinations = 10, itemsPerCombo = 3) {
	const flatOptions = [];

	// แปลงโครงสร้าง options.json ให้อยู่ในรูปรายการ [ { name, value }, ... ]
	for (const [category, items] of Object.entries(data)) {
		if (Array.isArray(items)) {
			items.forEach(item => {
				if (item.name && item.value !== undefined) {
					flatOptions.push({ name: item.name, value: item.value });
				} else if (typeof item === 'string') {
					flatOptions.push({ name: category, value: item });
				}
			});
		} else if (typeof items === 'object' && items !== null) {
			for (const [key, val] of Object.entries(items)) {
				flatOptions.push({ name: key, value: typeof val === 'object' ? JSON.stringify(val) : val });
			}
		}
	}

	// สุ่มจับคู่ตัวเลือก
	const combinations = [];
	for (let i = 0; i < maxCombinations; i++) {
		const shuffled = [...flatOptions].sort(() => 0.5 - Math.random());
		const selected = shuffled.slice(0, Math.min(itemsPerCombo, shuffled.length));
		combinations.push(selected);
	}

	return combinations;
}

test.describe('Generate Combined Option HTML/SVG Artifacts', () => {
	const outputDir = path.join(__dirname, '../tests-results');

	test.beforeAll(() => {
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}
	});

	const combinations = getRandomCombinations(optionsData, 10, 3);

	combinations.forEach((combo, index) => {
		// สร้างชื่อไฟล์ในรูปแบบ test_{option name}__{option value}_{option name}__{option value}.html
		const fileNameSegments = combo.map(opt => {
			const cleanName = String(opt.name).replace(/[^a-zA-Z0-9]/g, '');
			const cleanVal = String(opt.value).replace(/[^a-zA-Z0-9]/g, '');
			return `${cleanName}__${cleanVal}`;
		});

		const fileName = `test_${fileNameSegments.join('_')}.html`;
		const filePath = path.join(outputDir, fileName);

		test(`Combination #${index + 1}: ${fileName}`, async ({ page }) => {
			// ตัวอย่าง Diagram สำหรับใช้เรนเดอร์
			const sampleDiagram = `
				graph TD;
					A[Start] --> B{Decision};
					B -->|Yes| C[Success];
					B -->|No| D[Error];
			`;

			// รันการตั้งค่า Option บน Browser
			await page.setContent(`
				<!DOCTYPE html>
				<html>
				<head>
					<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
				</head>
				<body>
					<div id="container"></div>
				</body>
				</html>
			`);

			// ประมวลผลและ Render SVG ด้วย Options ที่ผสมแล้ว
			const configObj = {};
			combo.forEach(opt => { configObj[opt.name] = opt.value; });

			const svgContent = await page.evaluate(async ({ diagram, config }) => {
				window.mermaid.initialize({ startOnLoad: false, ...config });
				const { svg } = await window.mermaid.render('generated-svg', diagram);
				return svg;
			}, { diagram: sampleDiagram, config: configObj });

			// สร้างเนื้อหาไฟล์ HTML สมบูรณ์ (ประกอบด้วย Options + SVG)
			const fullHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>${fileName}</title>

</head>
<body>
	<h1>Applied Configurations</h1>
	<pre><code>${JSON.stringify(configObj, null, 2)}</code></pre>
	<hr />
	<h1>Rendered SVG</h1>
	<div class="svg-container">
		${svgContent}
	</div>
</body>
</html>`;

			// บันทึกไฟล์ไปยัง tests-results/
			fs.writeFileSync(filePath, fullHtmlContent, 'utf-8');
			expect(fs.existsSync(filePath)).toBeTruthy();
		});
	});
});