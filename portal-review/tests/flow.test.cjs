const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const catalog = require('../../HTML/portal-data.js').companions;

const base = process.env.PORTAL_REVIEW_TEST_URL || 'http://127.0.0.1:3011/portal-review/';
const ids = ['chris', 'kim', 'julian', 'enzo', 'hayes'];
const launch = () => chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});

async function navigate(page, hash) {
  await page.evaluate(value => new Promise(resolve => {
    if (location.hash === value) { resolve(); return; }
    window.addEventListener('hashchange', resolve, { once: true });
    location.hash = value;
  }), hash);
  await page.waitForURL(url => url.hash === hash);
}

async function openChat(page, id, { cancelFirst = false } = {}) {
  await navigate(page, `#character/${id}`);
  const hello = page.locator(`#ip-view [data-chat="${id}"]`).first();
  await hello.click();
  if (cancelFirst) {
    await page.locator('#portal-dialog[open]').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('#portal-dialog[open]').waitFor({ state: 'hidden' });
    assert.equal(new URL(page.url()).hash, `#character/${id}`);
    await hello.click();
  }
  if (await page.locator('#portal-dialog[open]').count()) {
    await page.locator('[data-auth-demo]').click();
  }
  await page.waitForURL(url => url.hash === `#chat/${id}`);
  await page.locator('#chat-message').waitFor();
  assert.equal(await page.locator('#portal-dialog[open]').count(), 0);
}

async function send(page, message) {
  const before = await page.locator('#chat-log [data-role="assistant"]').count();
  await page.locator('#chat-message').fill(message);
  await page.locator('#chat-message').press('Enter');
  await page.waitForFunction(count => document.querySelectorAll('#chat-log [data-role="assistant"]').length === count + 1, before);
  assert.equal(await page.locator('#chat-message').inputValue(), '');
  assert.equal(await page.locator('#chat-log [data-role="user"] p').last().innerText(), message);
  assert((await page.locator('#chat-log [data-role="assistant"] p').last().innerText()).length > 20);
}

for (const width of [1440, 390]) {
  test(`home → profile → chat, five characters and independent conversations at ${width}px`, async () => {
    const browser = await launch();
    try {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page.evaluate(async () => Promise.all([...document.querySelectorAll('.hero-slide')].map(image => {
        image.loading = 'eager';
        return image.decode();
      })));
      for (const id of ids) {
        await navigate(page, '#home');
        const picker = page.locator(`[data-show-hero="${id}"]`);
        await picker.focus();
        await picker.press('Enter');
        await page.locator('.hero-cta').click();
        await page.waitForURL(url => url.hash === `#character/${id}`);
        await page.locator(`#ip-view [data-chat="${id}"]`).first().waitFor();
        assert.match(await page.locator('#ip-view h1').innerText(), new RegExp(id, 'i'));
        await page.locator('#ip-view .ip-profile-photo img').evaluate(image => image.decode());
        assert(await page.locator('#ip-view .ip-profile-photo img').evaluate(image => image.complete && image.naturalWidth > 0));
        await openChat(page, id, { cancelFirst: id === 'chris' });
        assert.equal(await page.locator('#chat-log [data-role="user"]').count(), 0);
        await send(page, `A small happy moment with ${id}.`);
        const transcript = await page.locator('#chat-log').innerText();
        const draft = `Something else for ${id}`;
        await page.locator('#chat-message').fill(draft);
        await page.locator('[data-show-chat-profile]').click();
        await page.locator(`#ip-view a[href="#character/${id}"]`).first().click();
        await page.waitForURL(url => url.hash === `#character/${id}`);
        await page.locator(`#ip-view [data-chat="${id}"]`).first().click();
        await page.waitForURL(url => url.hash === `#chat/${id}`);
        await page.locator('#chat-message').waitFor();
        assert.equal(await page.locator('#chat-message').inputValue(), draft);
        assert.equal(await page.locator('#chat-log').innerText(), transcript);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        const composer = await page.locator('#chat-message').boundingBox();
        assert(composer.width > 100 && composer.height >= 44);
      }
      await navigate(page, '#chat');
      await page.locator('#ip-view a[href="#chat/chris"]').first().click();
      await page.waitForURL(url => url.hash === '#chat/chris');
      // The hash changes before its event renders the thread; the list has no composer.
      await page.locator('#chat-message').waitFor();
      assert.equal(await page.locator('#ip-view h1').innerText(), 'Chris');
      assert.equal(await page.locator('#chat-log [data-role="user"]').count(), 1);
      assert.equal(await page.locator('#chat-log [data-role="user"] p').innerText(), 'A small happy moment with chris.');
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });
}

test('composer handles whitespace, multiline, IME and literal HTML without storing messages', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await page.goto(base);
    await openChat(page, 'kim');
    const input = page.locator('#chat-message');
    assert(await page.locator('#chat-send').isDisabled());
    await input.fill('   ');
    assert(await page.locator('#chat-send').isDisabled());
    await input.fill('First line');
    await input.press('Shift+Enter');
    await page.keyboard.insertText('Second line');
    assert.equal(await input.inputValue(), 'First line\nSecond line');
    assert.equal(await page.locator('#chat-log [data-role="user"]').count(), 0);
    await input.evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })));
    assert.equal(await page.locator('#chat-log [data-role="user"]').count(), 0);
    const literal = '<img src=x onerror="window.__flowXss=1"> & a small joy';
    await send(page, literal);
    assert.equal(await page.locator('#chat-log [data-role="user"] img').count(), 0);
    assert.equal(await page.evaluate(() => window.__flowXss), undefined);
    const persisted = await page.evaluate(() => [localStorage, sessionStorage].flatMap(store => Object.values(store)).join('\n'));
    assert(!persisted.includes(literal));
    await navigate(page, '#account');
    await page.locator('#ip-view [data-signout]').click();
    await openChat(page, 'kim');
    assert.equal(await page.locator('#chat-log [data-role="user"]').count(), 0);
    await page.reload();
    assert.equal(await page.locator('#chat-message').count(), 0);
  } finally { await browser.close(); }
});

test('standalone sign-in closes auth and invalid chat route offers recovery', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.locator('.login-button').click();
    await page.locator('[data-auth-demo]').click();
    await page.waitForURL(url => url.hash === '#account');
    assert.equal(await page.locator('#portal-dialog[open]').count(), 0);
    await navigate(page, '#chat/missing-character');
    await page.getByRole('heading', { name: 'Character not found.' }).waitFor();
    await page.locator('#ip-view a[href="#discover"]').click();
    await page.waitForURL(url => url.hash === '#discover');
    await page.locator('#discover-view').waitFor();
    assert(await page.locator('#discover-view').isVisible());
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('an in-flight demo reply stays with its character across navigation and browser history', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await openChat(page, 'chris');
    await page.locator('#chat-message').fill('A happy moment for Chris alone.');
    await page.locator('#chat-send').click();
    await page.locator('#chat-status').filter({ hasText: /replying/i }).waitFor();
    await openChat(page, 'kim');
    assert.equal(await page.locator('#chat-log [data-role="user"]').count(), 0);
    await page.locator('#chat-message').fill('A draft for Kim alone.');
    await navigate(page, '#chat/chris');
    await page.waitForFunction(() => document.querySelectorAll('#chat-log [data-role="assistant"]').length === 2);
    assert.equal(await page.locator('#chat-log [data-role="user"] p').innerText(), 'A happy moment for Chris alone.');
    assert.equal(await page.locator('#chat-message').inputValue(), '');
    await page.goBack();
    await page.waitForURL(url => url.hash === '#chat/kim');
    await page.waitForFunction(() => document.querySelector('#chat-message')?.value === 'A draft for Kim alone.');
    assert.equal(await page.locator('#chat-log [data-role="user"]').count(), 0);
    await page.goForward();
    await page.waitForURL(url => url.hash === '#chat/chris');
    await page.waitForFunction(() => document.querySelector('#chat-log [data-role="user"] p')?.textContent === 'A happy moment for Chris alone.');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('email-code login closes auth; profile controls retain focus and legacy sections recover', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    const invalidAssetRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (new URL(request.url()).pathname.endsWith('/undefined')) invalidAssetRequests.push(request.url()); });
    await page.goto(base);
    await page.locator('.login-button').click();
    await page.locator('[data-auth="email"]').click();
    await page.locator('#auth-email').fill('flow-test@example.com');
    await page.locator('#auth-email-form button[type="submit"]').click();
    await page.locator('#auth-code').fill('123456');
    await page.locator('#auth-code-form button[type="submit"]').click();
    await page.waitForURL(url => url.hash === '#account');
    await page.locator('#ip-view [data-signout]').waitFor();
    assert.equal(await page.locator('#portal-dialog[open]').count(), 0);

    await navigate(page, '#character/kim');
    const save = page.locator('#ip-view [data-save="kim"]');
    const originalButton = await save.elementHandle();
    await save.focus();
    await save.press('Space');
    assert.equal(await save.getAttribute('aria-pressed'), 'true');
    assert(await originalButton.evaluate(node => node.isConnected && node === document.activeElement));
    await save.press('Space');
    assert.equal(await save.getAttribute('aria-pressed'), 'false');
    assert(await originalButton.evaluate(node => node.isConnected && node === document.activeElement));
    for (const section of ['moments-kim', 'story-kim']) {
      await page.locator(`[data-profile-section="${section}"]`).focus();
      await page.locator(`[data-profile-section="${section}"]`).press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.id), section);
      const bounds = await page.locator(`#${section}`).boundingBox();
      assert(bounds.y >= 0 && bounds.y < 900);
      assert.equal(new URL(page.url()).hash, '#character/kim');
    }
    await navigate(page, '#home');
    await navigate(page, '#story-kim');
    assert(await page.locator('#ip-view').isVisible());
    assert.equal(await page.locator('#ip-view h1').innerText(), 'Kim Ji-hoon');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'story-kim');
    assert(await page.locator('#home-view').isHidden());

    await navigate(page, '#character/hayes');
    assert.equal(await page.locator('#ip-view video').count(), 0);
    await page.locator('#ip-view .ip-profile-still img').evaluate(image => image.decode());
    assert(await page.locator('#ip-view .ip-profile-still img').evaluate(image => image.naturalWidth > 0));
    assert.deepEqual(invalidAssetRequests, []);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('browser Back cancels pending character authentication before a new chat is started', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await page.goto(base);
    await navigate(page, '#character/chris');
    await navigate(page, '#character/kim');
    await page.locator('#ip-view [data-chat="kim"]').first().click();
    await page.locator('#portal-dialog[open]').waitFor();
    assert.match(await page.locator('#dialog-title').innerText(), /Kim/);
    await page.goBack();
    await page.waitForURL(url => url.hash === '#character/chris');
    await page.locator('#ip-view [data-chat="chris"]').first().waitFor();
    await page.locator('#portal-dialog[open]').waitFor({ state: 'hidden' });
    await page.locator('#ip-view [data-chat="chris"]').first().click();
    await page.locator('#portal-dialog[open]').waitFor();
    assert.match(await page.locator('#dialog-title').innerText(), /Chris/);
    await page.locator('[data-auth-demo]').click();
    await page.waitForURL(url => url.hash === '#chat/chris');
    await page.locator('#chat-message').waitFor();
    assert.equal(await page.locator('#ip-view h1').innerText(), 'Chris');
    assert.equal(await page.locator('#portal-dialog[open]').count(), 0);
  } finally { await browser.close(); }
});

test('all five chats show matching character details on the right with working original-image galleries', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    for (const id of ids) {
      await openChat(page, id);
      const panel = page.locator('#chat-profile-panel');
      await panel.waitFor();
      assert.equal(await panel.evaluate(node => node.parentElement.className), 'chat-profile-slot');
      const roomBounds = await page.locator('.chat-room').boundingBox();
      const profileBounds = await panel.boundingBox();
      assert(profileBounds.x >= roomBounds.x + roomBounds.width);
      assert(profileBounds.x + profileBounds.width <= 1440);
      assert(Math.abs(profileBounds.y - roomBounds.y) <= 1);
      const character = await page.evaluate(value => window.RizzoraCharacters.find(item => item.id === value), id);
      assert.equal(await page.locator('#chat-profile-title').innerText(), character.name);
      const facts = await panel.locator('.chat-profile-facts').innerText();
      for (const value of [character.nationality, character.profession].filter(Boolean)) assert(facts.includes(value));
      const source = catalog.find(item => item.id === id);
      if (source) {
        for (const key of ['birthday', 'height', 'zodiac', 'mbti', 'hobbies', 'traits']) assert.deepEqual(character.profile[key], source[key]);
        for (const value of [source.birthday.replaceAll('/', '-'), source.height, source.zodiac, source.mbti]) assert(facts.includes(value));
      } else {
        assert.equal(character.profile, undefined);
        assert(!/Birthday|Height|Zodiac|MBTI/.test(facts));
      }
      const tags = await panel.locator('.chat-profile-tags').allInnerTexts();
      for (const value of character.profile?.traits || character.traits) assert(tags.join(' ').includes(value));
      assert.equal(await panel.locator('.chat-profile-attribute').filter({ hasText: 'Hobbies' }).locator('p').innerText(), character.profile?.hobbies || character.interests.join(' · '));
      const portrait = panel.locator('.chat-profile-portrait');
      await portrait.evaluate(image => image.decode());
      assert.equal(await portrait.getAttribute('src'), character.image);
      const gallery = panel.locator('[data-profile-image]');
      if (id === 'hayes') {
        // Hayes has only the existing bookshop still; do not invent a second asset.
        assert.equal(await gallery.count(), 0);
      } else {
        assert.equal(await gallery.count(), 2);
        for (const choice of await gallery.all()) {
          await choice.focus();
          await choice.press('Enter');
          assert.equal(await choice.getAttribute('aria-pressed'), 'true');
          assert.equal(await panel.locator('[data-profile-image][aria-pressed="true"]').count(), 1);
          assert.equal(await portrait.getAttribute('src'), await choice.locator('img').getAttribute('src'));
          await portrait.evaluate(image => image.decode());
          assert((await choice.boundingBox()).height >= 44);
        }
        await panel.locator('[data-profile-step="1"]').click();
        assert.equal(await panel.locator('[data-profile-image="0"]').getAttribute('aria-pressed'), 'true');
        await panel.locator('[data-profile-step="-1"]').click();
        assert.equal(await panel.locator('[data-profile-image="1"]').getAttribute('aria-pressed'), 'true');
      }
      await page.locator('[data-show-chat-profile]').focus();
      await page.locator('[data-show-chat-profile]').press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'chat-profile-panel');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('mobile profile drawer preserves messages and draft through keyboard, gallery and desktop resize', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await openChat(page, 'chris');
    await send(page, 'A happy moment while reading your profile.');
    const transcript = await page.locator('#chat-log').innerText();
    const draft = 'Keep this draft while I look around.';
    await page.locator('#chat-message').fill(draft);
    const trigger = page.locator('[data-show-chat-profile]');
    const drawer = page.locator('dialog.chat-profile-dialog');
    const panel = page.locator('#chat-profile-panel');
    assert(await panel.isHidden());
    await trigger.focus();
    await trigger.press('Enter');
    await drawer.waitFor();
    assert.equal(await drawer.evaluate(node => node.open), true);
    assert.equal(await panel.evaluate(node => node.parentElement.tagName), 'DIALOG');
    assert(await page.locator('.chat-profile-close').evaluate(node => node === document.activeElement));
    await panel.locator('[data-profile-image="1"]').click();
    await panel.locator('.chat-profile-portrait').evaluate(image => image.decode());
    const scene = await panel.locator('.chat-profile-portrait').getAttribute('src');
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'hidden' });
    assert(await trigger.evaluate(node => node === document.activeElement));
    assert.equal(await page.locator('#chat-message').inputValue(), draft);
    assert.equal(await page.locator('#chat-log').innerText(), transcript);

    await trigger.press('Enter');
    await drawer.waitFor();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('.chat-profile-slot > #chat-profile-panel').waitFor();
    assert.equal(await drawer.evaluate(node => node.open), false);
    assert.equal(await panel.locator('.chat-profile-portrait').getAttribute('src'), scene);
    assert.equal(await panel.locator('[data-profile-image="1"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#chat-message').inputValue(), draft);
    assert.equal(await page.locator('#chat-log').innerText(), transcript);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('#chat-profile-panel')?.parentElement.tagName === 'DIALOG');
    assert(await drawer.isHidden());
    await trigger.click();
    await drawer.waitFor();
    await page.locator('.chat-profile-close').click();
    await drawer.waitFor({ state: 'hidden' });
    assert(await trigger.evaluate(node => node === document.activeElement));
    assert.equal(await page.locator('#chat-message').inputValue(), draft);
    assert.equal(await page.locator('#chat-log').innerText(), transcript);
    await trigger.click();
    await drawer.waitFor();
    await panel.locator('a[href="#character/chris"]').click();
    await page.waitForURL(url => url.hash === '#character/chris');
    await page.locator('#ip-view [data-chat="chris"]').first().waitFor();
    assert.equal(await page.locator('dialog[open]').count(), 0);
    await page.goBack();
    await page.waitForURL(url => url.hash === '#chat/chris');
    await page.locator('#chat-message').waitFor();
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal(await page.locator('#chat-message').inputValue(), draft);
    assert.equal(await page.locator('#chat-log').innerText(), transcript);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('profile clip, full portrait and collapsible details work without disturbing chat or leaking media across routes', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await openChat(page, 'chris');
    await send(page, 'A happy moment before watching your clip.');
    const transcript = await page.locator('#chat-log').innerText();
    const draft = 'Back to this after the clip.';
    await page.locator('#chat-message').fill(draft);
    const panel = page.locator('#chat-profile-panel');
    const details = panel.locator('[data-profile-details]');
    await details.focus();
    await details.press('Enter');
    assert.equal(await details.getAttribute('aria-expanded'), 'false');
    assert(await panel.locator('#chat-profile-details').isHidden());
    assert(await panel.locator('#chat-profile-title').isVisible());
    assert(await details.evaluate(node => node === document.activeElement));
    await details.press('Enter');
    assert.equal(await details.getAttribute('aria-expanded'), 'true');
    assert(await panel.locator('#chat-profile-details').isVisible());

    const video = panel.locator('video');
    const play = panel.locator('[data-profile-play]');
    await play.click();
    await page.waitForFunction(() => {
      const clip = document.querySelector('.chat-profile-video');
      return clip && !clip.hidden && !clip.paused && clip.readyState >= 2;
    });
    assert.equal(await play.getAttribute('aria-pressed'), 'true');
    await panel.locator('[data-profile-image="1"]').click();
    assert(await video.evaluate(node => node.paused && node.hidden));
    assert.equal(await play.getAttribute('aria-pressed'), 'false');
    await play.click();
    await page.waitForFunction(() => !document.querySelector('.chat-profile-video').paused);
    await panel.locator('[data-profile-zoom]').click();
    const zoom = page.locator('dialog.chat-portrait-zoom');
    await zoom.waitFor();
    assert(await video.evaluate(node => node.paused && node.hidden));
    assert.equal(await zoom.locator('img').evaluate(node => node.src), await panel.locator('.chat-profile-portrait').evaluate(node => node.src));
    await zoom.locator('img').evaluate(image => image.decode());
    await page.keyboard.press('Escape');
    await zoom.waitFor({ state: 'hidden' });
    assert(await panel.locator('[data-profile-zoom]').evaluate(node => node === document.activeElement));

    await play.click();
    await page.waitForFunction(() => !document.querySelector('.chat-profile-video').paused);
    const oldVideo = await video.elementHandle();
    await panel.locator('a[href="#character/chris"]').click();
    await page.locator('#ip-view [data-chat="chris"]').first().waitFor();
    assert(await oldVideo.evaluate(node => node.paused));
    await page.goBack();
    await page.locator('#chat-message').waitFor();
    assert.equal(await page.locator('#chat-message').inputValue(), draft);
    assert.equal(await page.locator('#chat-log').innerText(), transcript);
    assert.equal(await page.locator('dialog[open]').count(), 0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('#chat-profile-panel').parentElement.tagName === 'DIALOG');
    await page.locator('[data-show-chat-profile]').click();
    await page.locator('dialog.chat-profile-dialog').waitFor();
    await page.locator('[data-profile-zoom]').click();
    await page.locator('dialog.chat-portrait-zoom').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('dialog.chat-portrait-zoom').waitFor({ state: 'hidden' });
    assert(await page.locator('dialog.chat-profile-dialog').isVisible());
    assert(await page.locator('[data-profile-zoom]').evaluate(node => node === document.activeElement));
    await page.keyboard.press('Escape');
    await page.locator('dialog.chat-profile-dialog').waitFor({ state: 'hidden' });
    assert(await page.locator('[data-show-chat-profile]').evaluate(node => node === document.activeElement));
    assert.equal(await page.locator('#chat-message').inputValue(), draft);
    assert.equal(await page.locator('#chat-log').innerText(), transcript);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
