// @ts-check
const { test, expect, resolveAdminTestUrl } = require('./helpers/admin-test');

const POST_ID = 4493;
const SOURCE_URL = 'https://infojournal.kku.ac.th/index.php/information/th/article/view/78/63';
const ADMIN_URL = process.env.WP_URL_TEST_ADMIN_THESAURUS || resolveAdminTestUrl(`/wp-admin/post.php?post=${POST_ID}&action=edit`);
const FRONT_URL = process.env.WP_URL_TEST_FRONT_THESAURUS;

const ENTRIES = [
	{
		term: 'การกระจายความรู้',
		definition: 'กระบวนการเผยแพร่และแลกเปลี่ยนความรู้ มีค่าเฉลี่ย 4.04 อยู่ในระดับมาก',
		broaderTerms: 'การจัดการความรู้',
		narrowerTerms: 'การประชุม, การฝึกอบรม, การเล่าเรื่อง, การถ่ายทอดผ่านครอบครัวและเครือญาติ, การใช้เอกสาร',
		relatedTerms: 'การจัดกิจกรรมหลักของวิสาหกิจชุมชน, การจัดการเกี่ยวกับทรัพยากร, การดำเนินการเกี่ยวกับลูกค้า',
	},
	{
		term: 'การกำหนดคุณลักษณะที่เป็นคุณค่าของสินค้า',
		definition: 'การกำหนดและเสนอคุณค่าหรือความพิเศษของสินค้าและบริการ มีค่าเฉลี่ย 3.97 อยู่ในระดับมาก',
		broaderTerms: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน',
		narrowerTerms: 'การออกแบบสินค้าให้โดดเด่น, การลดต้นทุนการผลิต, การช่วยให้ลูกค้าเข้าถึงสินค้า',
		relatedTerms: 'การตรวจสอบและติดตามความรู้, การจัดการความรู้',
	},
	{
		term: 'การกำหนดความต้องการความรู้',
		definition: 'กระบวนการระบุความรู้ที่วิสาหกิจชุมชนต้องการ มีค่าเฉลี่ย 4.09 อยู่ในระดับมาก',
		broaderTerms: 'การจัดการความรู้',
		narrowerTerms: 'ภูมิปัญญาท้องถิ่น, ปัญหาการดำเนินงาน, วิสัยทัศน์ชุมชน, ความต้องการของลูกค้า, การแลกเปลี่ยนเรียนรู้',
		relatedTerms: 'การจัดกิจกรรมหลักของวิสาหกิจชุมชน, การจัดการเกี่ยวกับต้นทุน, การจัดการเกี่ยวกับรายได้',
	},
	{
		term: 'การจัดกิจกรรมหลักของวิสาหกิจชุมชน',
		definition: 'กิจกรรมหลักด้านการผลิต ออกแบบ พัฒนา ส่งมอบ และแลกเปลี่ยนเรียนรู้ มีค่าเฉลี่ย 4.00 สูงสุดในกลุ่มกระบวนการธุรกิจ',
		broaderTerms: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน',
		narrowerTerms: 'การผลิตสินค้าและบริการ, การพัฒนาคุณภาพสินค้า, การส่งมอบสินค้า, การฝึกอบรมและดูงาน',
		relatedTerms: 'การกำหนดความต้องการความรู้, การสร้างและจัดหาความรู้, การจัดเก็บความรู้, การกระจายความรู้, การใช้ความรู้, การตรวจสอบและติดตามความรู้',
	},
	{
		term: 'การจัดการเกี่ยวกับต้นทุน',
		definition: 'การลดและบริหารโครงสร้างต้นทุนของวิสาหกิจชุมชน มีค่าเฉลี่ย 3.80 อยู่ในระดับมาก',
		broaderTerms: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน',
		narrowerTerms: 'การลดต้นทุน, การผลิตจำนวนมาก, โครงสร้างต้นทุนคงที่',
		relatedTerms: 'การกำหนดความต้องการความรู้, การสร้างและจัดหาความรู้',
	},
	{
		term: 'การจัดการเกี่ยวกับทรัพยากร',
		definition: 'การบริหารทรัพย์สิน ภูมิปัญญา บุคลากร เงินทุน และเครือข่ายกระจายสินค้า มีค่าเฉลี่ย 3.75 อยู่ในระดับมาก',
		broaderTerms: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน',
		narrowerTerms: 'ทรัพย์สิน, ภูมิปัญญา, บุคลากร, เงินทุน, เครือข่ายกระจายสินค้า',
		relatedTerms: 'การกระจายความรู้, การจัดการความรู้',
	},
	{
		term: 'การจัดการเกี่ยวกับรายได้',
		definition: 'การบริหารแหล่งรายได้และการแบ่งสรรรายได้อย่างชัดเจนโปร่งใส มีค่าเฉลี่ย 3.52 อยู่ในระดับมาก',
		broaderTerms: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน',
		narrowerTerms: 'รายได้จากการขาย, รายได้จากทรัพย์สิน, การแบ่งสรรรายได้',
		relatedTerms: 'การกำหนดความต้องการความรู้, การใช้ความรู้',
	},
	{
		term: 'การจัดการช่องทางการจัดจำหน่าย',
		definition: 'การสื่อสาร การขาย และการส่งมอบสินค้าและบริการผ่านช่องทางที่หลากหลาย มีค่าเฉลี่ย 3.74 อยู่ในระดับมาก',
		broaderTerms: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน',
		narrowerTerms: 'การโฆษณา, ช่องทางการขาย, บริการหลังการขาย, ร้านค้าในชุมชน',
		relatedTerms: 'การจัดการความรู้, การใช้ความรู้, การกระจายความรู้',
	},
	{
		term: 'การจัดการความรู้',
		definition: 'กระบวนการจัดการความรู้เพื่อสนับสนุนธุรกิจวิสาหกิจชุมชน มีความสัมพันธ์กับกระบวนการทางธุรกิจอย่างมีนัยสำคัญที่ระดับ 0.01 (r = .829, P = .000)',
		broaderTerms: 'การจัดการวิสาหกิจชุมชน',
		narrowerTerms: 'การกำหนดความต้องการความรู้, การสร้างและจัดหาความรู้, การจัดเก็บความรู้, การกระจายความรู้, การใช้ความรู้, การตรวจสอบและติดตามความรู้',
		relatedTerms: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน, ภูมิปัญญาท้องถิ่น, การแลกเปลี่ยนเรียนรู้',
	},
	{
		term: 'การจัดเก็บความรู้',
		definition: 'กระบวนการรักษาความรู้ในบุคคล เอกสาร สื่อคอมพิวเตอร์ และระบบที่เข้าถึงได้ มีค่าเฉลี่ย 3.43 อยู่ในระดับปานกลาง',
		broaderTerms: 'การจัดการความรู้',
		narrowerTerms: 'ความรู้ในตัวบุคคล, เอกสาร, สื่อคอมพิวเตอร์, พิพิธภัณฑ์, ห้องสมุด',
		relatedTerms: 'การจัดกิจกรรมหลักของวิสาหกิจชุมชน, การสร้างคู่ค้าหรือพันธมิตร, การดำเนินการเกี่ยวกับลูกค้า',
	},
	{
		term: 'การใช้ความรู้',
		definition: 'กระบวนการนำความรู้ไปพัฒนาคุณภาพสินค้า การตลาด การขนส่ง และเครือข่าย มีค่าเฉลี่ย 3.93 อยู่ในระดับมาก',
		broaderTerms: 'การจัดการความรู้',
		narrowerTerms: 'การพัฒนาคุณภาพ, การฝึกอบรม, การวิเคราะห์ลูกค้า, การตลาดเชิงรุก, การสร้างเครือข่าย',
		relatedTerms: 'การจัดกิจกรรมหลักของวิสาหกิจชุมชน, การสร้างคู่ค้าหรือพันธมิตร, การจัดการเกี่ยวกับรายได้',
	},
	{
		term: 'การดำเนินการเกี่ยวกับลูกค้า',
		definition: 'การแบ่งกลุ่มลูกค้าและออกแบบสินค้าและบริการตามความต้องการ มีค่าเฉลี่ย 3.47 อยู่ในระดับมาก',
		broaderTerms: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน',
		narrowerTerms: 'การแบ่งกลุ่มลูกค้า, การเลือกกลุ่มเป้าหมาย, การออกแบบตามความต้องการ',
		relatedTerms: 'การสร้างและจัดหาความรู้, การจัดเก็บความรู้, การกระจายความรู้, การตรวจสอบและติดตามความรู้',
	},
	{
		term: 'การตรวจสอบและติดตามความรู้',
		definition: 'กระบวนการประเมิน ปรับปรุง และติดตามความรู้เพื่อนำไปพัฒนาความรู้ใหม่ มีค่าเฉลี่ย 4.09 อยู่ในระดับมาก',
		broaderTerms: 'การจัดการความรู้',
		narrowerTerms: 'การติดตามจากลูกค้า, การปรับปรุงความรู้, การแลกเปลี่ยนภายในกลุ่ม, รายงานผลประจำปี',
		relatedTerms: 'การจัดกิจกรรมหลักของวิสาหกิจชุมชน, การกำหนดคุณลักษณะที่เป็นคุณค่าของสินค้า, การดำเนินการเกี่ยวกับลูกค้า',
	},
	{
		term: 'การสร้างความสัมพันธ์กับลูกค้า',
		definition: 'การสร้างความสัมพันธ์ การช่วยเหลือ และเปิดโอกาสให้ลูกค้ามีส่วนร่วม มีค่าเฉลี่ย 3.75 อยู่ในระดับมาก',
		broaderTerms: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน',
		narrowerTerms: 'การช่วยเหลือลูกค้า, การเข้าถึงสินค้า, การแลกเปลี่ยนความรู้กับลูกค้า, การออกแบบร่วมกัน',
		relatedTerms: 'การจัดการความรู้, การกำหนดความต้องการความรู้, การใช้ความรู้',
	},
	{
		term: 'การสร้างคู่ค้าหรือพันธมิตร',
		definition: 'การสร้างความร่วมมือกับคู่ค้า ผู้ขายวัตถุดิบ และเครือข่ายธุรกิจ มีค่าเฉลี่ย 3.27 อยู่ในระดับปานกลาง',
		broaderTerms: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน',
		narrowerTerms: 'คู่ค้า, พันธมิตร, ผู้ขายวัตถุดิบ, การร่วมลงทุน',
		relatedTerms: 'การจัดเก็บความรู้, การใช้ความรู้',
	},
	{
		term: 'การสร้างและจัดหาความรู้',
		definition: 'กระบวนการสร้างและแสวงหาความรู้จากผู้นำ ภูมิปัญญา การศึกษา และหน่วยงานสนับสนุน มีค่าเฉลี่ย 4.13 สูงสุดในกลุ่มการจัดการความรู้',
		broaderTerms: 'การจัดการความรู้',
		narrowerTerms: 'ภาวะผู้นำ, ภูมิปัญญาบรรพบุรุษ, การฝึกอบรมและดูงาน, การสนับสนุนจากหน่วยงาน, การวิเคราะห์ SWOT',
		relatedTerms: 'การจัดกิจกรรมหลักของวิสาหกิจชุมชน, การจัดการเกี่ยวกับต้นทุน, การดำเนินการเกี่ยวกับลูกค้า',
	},
	{
		term: 'กระบวนการทางธุรกิจของวิสาหกิจชุมชน',
		definition: 'องค์ประกอบการจัดการวิสาหกิจชุมชนตามแนวคิด Business Model Canvas มีค่าเฉลี่ยรวม 3.70 อยู่ในระดับมาก',
		broaderTerms: 'การจัดการวิสาหกิจชุมชน',
		narrowerTerms: 'การดำเนินการเกี่ยวกับลูกค้า, การกำหนดคุณลักษณะที่เป็นคุณค่าของสินค้า, การจัดการช่องทางการจัดจำหน่าย, การสร้างความสัมพันธ์กับลูกค้า, การจัดการเกี่ยวกับรายได้, การจัดการเกี่ยวกับทรัพยากร, การจัดกิจกรรมหลักของวิสาหกิจชุมชน, การสร้างคู่ค้าหรือพันธมิตร, การจัดการเกี่ยวกับต้นทุน',
		relatedTerms: 'การจัดการความรู้, Business Model Canvas',
	},
];

test.describe('Thesaurus Post 4493', () => {
	test.setTimeout(600_000);

	test('writes research-based thesaurus and verifies the frontend', async ({ page }) => {
		await page.goto(ADMIN_URL, {
			waitUntil: 'domcontentloaded',
			timeout: 60_000,
		});

		if (page.url().includes('/wp-login.php')) {
			test.skip(true, 'Admin session is not available in this project/browser.');
		}

		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });

		const closeModal = page.locator('.components-modal__header button').first();
		if (await closeModal.isVisible({ timeout: 2000 }).catch(() => false)) {
			await closeModal.click();
		}

		await page.waitForFunction(() => Boolean(window.wp?.blocks?.getBlockType('plusmagi-blocks/thesaurus')), null, { timeout: 30_000 });

		const savedPost = await page.evaluate(async ({ entries, sourceUrl }) => {
			const { createBlock } = window.wp.blocks;
			const originalTitle = window.wp.data.select('core/editor').getEditedPostAttribute('title');
			const intro = createBlock('core/paragraph', {
				content: 'ศัพท์สัมพันธ์นี้สังเคราะห์จากผลการวิจัยเรื่อง “การวิเคราะห์ความสัมพันธ์ของการจัดการความรู้ในกระบวนการจัดการวิสาหกิจชุมชน” โดยจัดกลุ่มกระบวนการจัดการความรู้และกระบวนการทางธุรกิจ พร้อมแสดงคำกว้างกว่า คำแคบกว่า และคำที่เกี่ยวข้อง',
			});
			const thesaurus = createBlock('plusmagi-blocks/thesaurus', {
				heading: 'ศัพท์สัมพันธ์การจัดการความรู้ในวิสาหกิจชุมชน',
				entries,
			});
			const source = createBlock('core/paragraph', {
				content: `<strong>แหล่งข้อมูล:</strong> <a href="${sourceUrl}">การวิเคราะห์ความสัมพันธ์ของการจัดการความรู้ในกระบวนการจัดการวิสาหกิจชุมชน</a> โดย จิตรลดา เพลิดพริ้ง และ กุลธิดา ท้วมสุข`,
			});

			window.wp.data.dispatch('core/block-editor').resetBlocks([intro, thesaurus, source]);
			await window.wp.data.dispatch('core/editor').savePost();

			return {
				originalTitle,
				savedTitle: window.wp.data.select('core/editor').getEditedPostAttribute('title'),
				permalink: window.wp.data.select('core/editor').getPermalink(),
			};
		}, { entries: ENTRIES, sourceUrl: SOURCE_URL });

		expect(savedPost.savedTitle).toBe(savedPost.originalTitle);
		expect(savedPost.permalink).toBeTruthy();
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isSavingPost())).toBe(false);
		await page.goto(FRONT_URL || savedPost.permalink, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const container = page.locator('.plusmagi-thesaurus-container').first();
		await expect(container).toBeVisible({ timeout: 30_000 });
		await expect(container.locator('h2')).toHaveText('ศัพท์สัมพันธ์การจัดการความรู้ในวิสาหกิจชุมชน');

		const renderedTerms = await container.locator('.plusmagi-thesaurus-entry dfn').allTextContents();
		const expectedTerms = ENTRIES.map((entry) => entry.term).sort((first, second) =>
			first.localeCompare(second, undefined, { sensitivity: 'base', numeric: true })
		);
		expect(renderedTerms).toEqual(expectedTerms);

		await expect(container.locator('.plusmagi-thesaurus-entry')).toHaveCount(ENTRIES.length);
		await expect(container.locator('dd[data-type="broader-terms"]')).toHaveCount(ENTRIES.length);
		await expect(container.locator('dd[data-type="narrower-terms"]')).toHaveCount(ENTRIES.length);
		await expect(container.locator('dd[data-type="related-terms"]')).toHaveCount(ENTRIES.length);
		await expect(container.getByText('r = .829, P = .000', { exact: false })).toBeVisible();
		await expect(page.locator(`a[href="${SOURCE_URL}"]`)).toContainText('การวิเคราะห์ความสัมพันธ์ของการจัดการความรู้');
	});
});