const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.PORTAL_REVIEW_TEST_URL || 'http://127.0.0.1:3011/portal-review/';

test('all five worlds, 25 moments, keyboard, scenes, CTA and stable reading on desktop and mobile', async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  try {
    for (const width of [1440,390]) {
      const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base); await page.evaluate(async()=>Promise.all([...document.querySelectorAll('.hero-slide')].map(img=>{img.loading='eager';return img.decode();})));
      for(const id of ['chris','kim','julian','enzo','hayes']) {
        const picker=page.locator(`[data-show-hero="${id}"]`);await picker.focus();await picker.press('Enter');
        assert.equal(await page.locator('.world-preview').getAttribute('data-world'),id);
        assert.equal(await page.locator('.world-scene').getAttribute('src'),await page.locator(`[data-hero-character="${id}"]`).getAttribute('src'));
        await page.locator('.world-scene').evaluate(img=>img.decode());
        const words=page.locator('.world-interests button');assert.equal(await words.count(),5);
        for(const button of await words.all()) {await button.focus();await button.press('Space');assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.world-interests [aria-pressed="true"]').count(),1);assert((await page.locator('.world-story p').innerText()).length>35);assert((await button.boundingBox()).height>=44);assert.equal(await button.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');}
        const destination=`#character/${id}`;
        assert.equal(await page.locator('.world-cta').getAttribute('href'),destination);await page.locator('.world-cta').click();assert.equal(new URL(page.url()).hash,destination);
        await page.goto(base);await page.evaluate(async()=>Promise.all([...document.querySelectorAll('.hero-slide')].map(img=>img.decode())));
      }
      await page.locator('[data-show-hero="chris"]').click();await page.locator('.world-interests button').first().click();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('#voice-selector-slot [data-hero-voice]').count(),9);assert.equal(await page.locator('#voice-selector-slot img').count(),0);
      assert.deepEqual(errors,[]);await page.close();
    }
    const p=await browser.newPage({viewport:{width:1440,height:1000}});await p.clock.install();await p.goto(base);await p.evaluate(async()=>Promise.all([...document.querySelectorAll('.hero-slide')].map(img=>img.decode())));
    await p.locator('[data-show-hero="kim"]').click();await p.locator('.world-interests button').first().click();const text=await p.locator('.world-story').innerText();
    await p.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);document.querySelector('.hero').dispatchEvent(new Event('mouseleave'));});await p.clock.runFor(8000);
    assert.notEqual(await p.locator('.hero-slide.is-active').getAttribute('data-hero-character'),'kim');
    assert.equal(await p.locator('.world-preview').getAttribute('data-world'),'kim');assert.equal(await p.locator('.world-story').innerText(),text);await p.close();
  } finally {await browser.close();}
});
