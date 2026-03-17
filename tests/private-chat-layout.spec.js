const { test, expect } = require('@playwright/test');

test.describe('Private chat layout', () => {
  test('header and input stay within the viewport on mobile sizes', async ({ page }) => {
    await page.goto('/pages/private%20chat/private_chat.html', { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      const app = document.getElementById('app');
      if (app) app.classList.add('visible');

      const auth = document.getElementById('auth-screen');
      if (auth) auth.style.display = 'none';

      const loading = document.getElementById('loading-screen');
      if (loading) loading.style.display = 'none';

      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.add('hidden-mobile');

      const empty = document.getElementById('chat-empty');
      if (empty) empty.style.display = 'none';

      const header = document.getElementById('chat-header');
      if (header) header.classList.add('visible');

      const messages = document.getElementById('messages-wrap');
      if (messages) messages.classList.add('visible');

      const input = document.getElementById('input-area');
      if (input) input.classList.add('visible');
    });

    const assertInViewport = async () => {
      const headerBox = await page.locator('#chat-header').boundingBox();
      const inputBox = await page.locator('#input-area').boundingBox();
      const messagesBox = await page.locator('#messages-wrap').boundingBox();
      const viewport = page.viewportSize();

      expect(headerBox).not.toBeNull();
      expect(inputBox).not.toBeNull();
      expect(messagesBox).not.toBeNull();
      expect(viewport).not.toBeNull();

      expect(headerBox.y).toBeGreaterThanOrEqual(0);
      expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(messagesBox.height).toBeGreaterThan(50);
    };

    await assertInViewport();

    await page.setViewportSize({ width: 390, height: 620 });
    await page.waitForTimeout(50);
    await assertInViewport();
  });
});
