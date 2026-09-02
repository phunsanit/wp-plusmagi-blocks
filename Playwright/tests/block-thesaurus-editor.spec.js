import { test, expect } from '@playwright/test';
import { openMermaidBlockEditor } from './helpers/mermaid-editor';

const baseURL = 'https://pitt.plusmagi.com';

test.describe('Thesaurus Block', () => {
  test.beforeEach(async ({ page }) => {
    // Create a new post
    await page.goto(`${baseURL}/wp-admin/post-new.php`, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Wait for editor to load
    await page.waitForSelector('[data-type="my-thesaurus/entry"]', { timeout: 10_000 }).catch(() => null);
  });

  test('should add a thesaurus block', async ({ page }) => {
    // Open block inserter
    await page.click('button[aria-label="Add block"]');

    // Search for Thesaurus block
    await page.fill('input[placeholder="Search blocks"]', 'Thesaurus');
    await page.waitForSelector('button:has-text("Thesaurus Entry")');

    // Insert the block
    await page.click('button:has-text("Thesaurus Entry")');

    // Verify the block was added
    const blockAdded = await page.isVisible('[data-type="my-thesaurus/entry"]');
    expect(blockAdded).toBe(true);
  });

  test('should add a thesaurus entry with term and definition', async ({ page }) => {
    // Insert block
    await page.click('button[aria-label="Add block"]');
    await page.fill('input[placeholder="Search blocks"]', 'Thesaurus');
    await page.click('button:has-text("Thesaurus Entry")');

    // Click "Add Thesaurus Entry" button
    await page.click('button:has-text("+ Add Thesaurus Entry")');

    // Fill in the form
    await page.fill('input[placeholder="e.g., Fast"]', 'Eloquent');
    await page.fill('input[placeholder="e.g., adj., noun, verb"]', 'adj.');
    await page.fill('input[placeholder="The meaning of the term"]', 'Fluent, expressive, and persuasive in speaking or writing');

    // Save entry
    await page.click('button:has-text("Save Entry")');

    // Verify entry was added
    await page.waitForSelector('text=Eloquent');
    const termVisible = await page.isVisible('text=Eloquent');
    expect(termVisible).toBe(true);
  });

  test('should add entry with synonyms and antonyms', async ({ page }) => {
    // Insert block
    await page.click('button[aria-label="Add block"]');
    await page.fill('input[placeholder="Search blocks"]', 'Thesaurus');
    await page.click('button:has-text("Thesaurus Entry")');

    // Click "Add Thesaurus Entry" button
    await page.click('button:has-text("+ Add Thesaurus Entry")');

    // Fill in the form
    await page.fill('input[placeholder="e.g., Fast"]', 'Happy');
    await page.fill('input[placeholder="e.g., adj., noun, verb"]', 'adj.');
    await page.fill('input[placeholder="The meaning of the term"]', 'Feeling or showing pleasure or contentment');
    await page.fill('input[placeholder="e.g., quick, rapid, swift, speedy"]', 'joyful, cheerful, delighted, content');
    await page.fill('input[placeholder="e.g., slow, sluggish"]', 'sad, unhappy, melancholy, miserable');

    // Save entry
    await page.click('button:has-text("Save Entry")');

    // Verify entry with synonyms and antonyms
    await page.waitForSelector('text=Happy');
    const synonymsVisible = await page.isVisible('text=joyful');
    const antonymsVisible = await page.isVisible('text=sad');

    expect(synonymsVisible).toBe(true);
    expect(antonymsVisible).toBe(true);
  });

  test('should edit an existing entry', async ({ page }) => {
    // Insert block and add entry
    await page.click('button[aria-label="Add block"]');
    await page.fill('input[placeholder="Search blocks"]', 'Thesaurus');
    await page.click('button:has-text("Thesaurus Entry")');
    await page.click('button:has-text("+ Add Thesaurus Entry")');

    await page.fill('input[placeholder="e.g., Fast"]', 'Quick');
    await page.fill('input[placeholder="The meaning of the term"]', 'Moving or capable of moving at high speed');
    await page.click('button:has-text("Save Entry")');

    // Edit the entry
    await page.click('button:has-text("Edit"):first-of-type');

    // Clear and update definition
    await page.fill('input[placeholder="The meaning of the term"]', 'Moving with speed or rapidity');
    await page.click('button:has-text("Save Entry")');

    // Verify updated definition
    const updatedDef = await page.isVisible('text=Moving with speed or rapidity');
    expect(updatedDef).toBe(true);
  });

  test('should delete an entry', async ({ page }) => {
    // Insert block and add entry
    await page.click('button[aria-label="Add block"]');
    await page.fill('input[placeholder="Search blocks"]', 'Thesaurus');
    await page.click('button:has-text("Thesaurus Entry")');
    await page.click('button:has-text("+ Add Thesaurus Entry")');

    await page.fill('input[placeholder="e.g., Fast"]', 'Temporary');
    await page.fill('input[placeholder="The meaning of the term"]', 'Lasting for a limited time');
    await page.click('button:has-text("Save Entry")');

    // Delete the entry
    await page.click('button:has-text("Delete")');

    // Verify entry was deleted
    const entryVisible = await page.isVisible('text=Temporary').catch(() => false);
    expect(entryVisible).toBe(false);
  });

  test('should display multiple entries in preview', async ({ page }) => {
    // Insert block
    await page.click('button[aria-label="Add block"]');
    await page.fill('input[placeholder="Search blocks"]', 'Thesaurus');
    await page.click('button:has-text("Thesaurus Entry")');

    // Add first entry
    await page.click('button:has-text("+ Add Thesaurus Entry")');
    await page.fill('input[placeholder="e.g., Fast"]', 'Beautiful');
    await page.fill('input[placeholder="The meaning of the term"]', 'Pleasing to the eye or mind');
    await page.click('button:has-text("Save Entry")');

    // Add second entry
    await page.click('button:has-text("+ Add Thesaurus Entry")');
    await page.fill('input[placeholder="e.g., Fast"]', 'Ugly');
    await page.fill('input[placeholder="The meaning of the term"]', 'Displeasing to the eye or mind');
    await page.click('button:has-text("Save Entry")');

    // Verify both entries are displayed
    const firstEntryVisible = await page.isVisible('text=Beautiful');
    const secondEntryVisible = await page.isVisible('text=Ugly');

    expect(firstEntryVisible).toBe(true);
    expect(secondEntryVisible).toBe(true);
  });

  test('should render thesaurus block on frontend', async ({ page }) => {
    // Insert block and add entry
    await page.click('button[aria-label="Add block"]');
    await page.fill('input[placeholder="Search blocks"]', 'Thesaurus');
    await page.click('button:has-text("Thesaurus Entry")');
    await page.click('button:has-text("+ Add Thesaurus Entry")');

    await page.fill('input[placeholder="e.g., Fast"]', 'Resilient');
    await page.fill('input[placeholder="e.g., adj., noun, verb"]', 'adj.');
    await page.fill('input[placeholder="The meaning of the term"]', 'Able to recover quickly from difficulties');
    await page.fill('input[placeholder="e.g., quick, rapid, swift, speedy"]', 'strong, tough, flexible');
    await page.click('button:has-text("Save Entry")');

    // Publish the post
    const titleInput = await page.$('textarea[aria-label="Add title"]');
    if (titleInput) {
      await titleInput.fill('Test Thesaurus Entry');
    }

    await page.click('button:has-text("Publish"):first-of-type');

    // Check frontend rendering
    const thesaurusContainer = await page.isVisible('.thesaurus-container');
    expect(thesaurusContainer).toBe(true);
  });
});
