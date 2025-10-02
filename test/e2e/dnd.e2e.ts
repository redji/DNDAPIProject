import { expect } from 'chai';

describe('D&D Lists Navigation', () => {
  it('loads home page', async () => {
    await browser.url('/');
    const title = await browser.getTitle();
    expect(title).to.contain('Quasar');
  });

  it('navigates to classes list', async () => {
    await browser.url('/#/dnd/classes');
    const url = await browser.getUrl();
    expect(url).to.contain('/dnd/classes');
  });
});
