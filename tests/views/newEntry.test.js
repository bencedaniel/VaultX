import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/entry/newEntry.ejs');

function renderNewEntry(overrides = {}) {
  const data = {
    selectedEvent: { _id: 'event-1' },
    formData: null,
    horses: [
      { _id: 'horse-1', Horsename: 'Thunder' },
      { _id: 'horse-2', Horsename: 'Blaze' }
    ],
    lungers: [
      { _id: 'lunger-1', Name: 'Lunger One' },
      { _id: 'lunger-2', Name: 'Lunger Two' }
    ],
    categorys: [
      { _id: 'cat-1', CategoryDispName: 'Individual Cat', Type: 'Individual' },
      { _id: 'cat-2', CategoryDispName: 'PDD Cat', Type: 'PDD' },
      { _id: 'cat-3', CategoryDispName: 'Squad Cat', Type: 'Squad' }
    ],
    vaulters: [
      { _id: 'v-1', Name: 'Vaulter One' },
      { _id: 'v-2', Name: 'Vaulter Two' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/entry/newEntry.ejs', () => {
  test('renders form skeleton with event id and submit button', async () => {
    const html = await renderNewEntry({ selectedEvent: { _id: 'ev-42' } });

    expect(html).toContain('action="/entry/new"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('id="event" name="event" required value="ev-42"');
    expect(html).toContain('>New Entry<');
  });

  test('renders horse, lunger and category dropdown options', async () => {
    const html = await renderNewEntry();

    expect(html).toContain('Thunder');
    expect(html).toContain('Blaze');
    expect(html).toContain('Lunger One');
    expect(html).toContain('Lunger Two');
    expect(html).toContain('Individual Cat');
    expect(html).toContain('PDD Cat');
    expect(html).toContain('Squad Cat');
  });

  test('renders status options and selected display mapping from formData status', async () => {
    const html = await renderNewEntry({
      formData: {
        horse: { _id: 'horse-1' },
        lunger: { _id: 'lunger-1' },
        category: { _id: 'cat-1' },
        status: 'cancelled',
        teamName: 'Team X',
        vaulter: []
      }
    });

    expect(html).toContain('val="registered" >Registered');
    expect(html).toContain('val="withdrawn" >Withdrawn');
    expect(html).toContain('val="confirmed" >Confirmed');
    expect(html).toContain('val="cancelled">Inactive');

    // selectedStatusDisplay map converts cancelled -> Cancelled in input value
    expect(html).toContain('placeholder="Search Status"');
    expect(html).toContain('value="Cancelled"');
    expect(html).toMatch(/name="status"[\s\S]*?value="cancelled"/);
  });

  test('prefills visible and hidden fields from formData', async () => {
    const html = await renderNewEntry({
      formData: {
        horse: { _id: 'horse-2' },
        lunger: { _id: 'lunger-2' },
        category: { _id: 'cat-3' },
        status: 'registered',
        teamName: 'Squad Name',
        vaulter: [{ _id: 'v-1', Name: 'Vaulter One' }]
      }
    });

    expect(html).toContain('value="Blaze"');
    expect(html).toContain('value="Lunger Two"');
    expect(html).toContain('value="Squad Cat"');

    expect(html).toMatch(/name="horse"[\s\S]*?value="horse-2"/);
    expect(html).toMatch(/name="lunger"[\s\S]*?value="lunger-2"/);
    expect(html).toMatch(/name="category"[\s\S]*?value="cat-3"/);
    expect(html).toContain('id="teamName" name="teamName"');
    expect(html).toContain('value="Squad Name"');
  });

  test('renders empty hidden values when formData is missing', async () => {
    const html = await renderNewEntry({ formData: null });

    expect(html).toMatch(/name="horse"[\s\S]*?value=""/);
    expect(html).toMatch(/name="lunger"[\s\S]*?value=""/);
    expect(html).toMatch(/name="category"[\s\S]*?value=""/);
    expect(html).toMatch(/name="status"[\s\S]*?value=""/);
    expect(html).toContain('id="teamNameDiv" style="display: none;"');
  });

  test('embeds client-side categoryTypeMap and vaulter initialization data', async () => {
    const html = await renderNewEntry({
      formData: {
        horse: { _id: 'horse-1' },
        lunger: { _id: 'lunger-1' },
        category: { _id: 'cat-2' },
        status: 'confirmed',
        teamName: '',
        vaulter: [{ _id: 'v-2', Name: 'Vaulter Two' }]
      }
    });

    expect(html).toContain('categoryTypeMap["cat-1"] = "Individual"');
    expect(html).toContain('categoryTypeMap["cat-2"] = "PDD"');
    expect(html).toContain('categoryTypeMap["cat-3"] = "Squad"');

    expect(html).toContain('const vaulters = [{"_id":"v-1","Name":"Vaulter One"},{"_id":"v-2","Name":"Vaulter Two"}]');
    expect(html).toContain('const formVaulters = [{"_id":"v-2","Name":"Vaulter Two"}]');

    expect(html).toContain("if (type === 'Squad')");
    expect(html).toContain('renderVaulterInputs(6, formVaulters)');
    expect(html).toContain('renderVaulterInputs(2, formVaulters)');
    expect(html).toContain('renderVaulterInputs(1, formVaulters)');
    expect(html).toContain("if (input && hidden && list && items && typeof listCreator === 'function')");
  });
});
