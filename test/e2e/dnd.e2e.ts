import { expect } from 'chai';


describe('D&D Lists Navigation', () => {
  it('loads home and shows endpoint links', async () => {
    await browser.url('/');
    const list = await $('//div[contains(@class,"q-page")]');
    expect(await list.isExisting()).to.equal(true);

    const classesLink = await $('//div[text()="classes"]');
    expect(await classesLink.isExisting()).to.equal(true);
  });

  it('navigates to classes list and shows items', async () => {
    await browser.url('/#/dnd/classes');
    const refreshBtn = await $('//button[.//span[text()="Refresh"]]');
    await refreshBtn.click();

    await browser.waitUntil(async () => {
      const items = await $$('//div[@role="listitem"]');
      return items.length > 0;
    }, { timeout: 15000, timeoutMsg: 'expected items to load' });

    const firstItem = await $('(//div[@role="listitem"])[1]');
    expect(await firstItem.isExisting()).to.equal(true);
  });
});




