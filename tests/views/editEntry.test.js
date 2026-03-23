import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/entry/editEntry.ejs');

function renderEditEntry(overrides = {}) {
  const defaultFormData = {
    _id: 'entry-1',
    horse: { _id: 'horse-1' },
    lunger: { _id: 'lunger-1' },
    category: { _id: 'cat-1' },
    status: 'registered',
    teamName: 'Team Alpha',
    vaulter: [{ _id: 'v-1', Name: 'Vaulter One' }]
  };
  const data = {
    selectedEvent: { _id: 'event-1' },
    formData: overrides.formData === undefined ? defaultFormData : overrides.formData,
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
  // fallback: ha formData nincs, legyen legalább üres object, hogy a template ne dobjon hibát
  if (!data.formData) data.formData = {};
  if (!data.formData.horse) data.formData.horse = {};
  if (!data.formData.lunger) data.formData.lunger = {};
  if (!data.formData.category) data.formData.category = {};
  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/entry/editEntry.ejs', () => {
  test('renders edit form action with entry id and submit button', async () => {
    const html = await renderEditEntry({ formData: { _id: 'entry-77' } });

    expect(html).toContain('action="/entry/edit/entry-77"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Edit Entry<');
  });

  test('renders selected event hidden field and dropdown lists', async () => {
    const html = await renderEditEntry({ selectedEvent: { _id: 'ev-42' } });

    expect(html).toContain('id="event" name="event" required value="ev-42"');
    expect(html).toContain('Thunder');
    expect(html).toContain('Lunger One');
    expect(html).toContain('Individual Cat');
  });

  test('renders disabled category input and keeps category hidden field', async () => {
    const html = await renderEditEntry();

    expect(html).toContain('placeholder="Search Category"');
    expect(html).toContain('searchable-input" disabled');
    expect(html).toMatch(/name="category"[\s\S]*?value="cat-1"/);
  });

  test('prefills horse, lunger, category and teamName values from formData', async () => {
    const html = await renderEditEntry({
      formData: {
        _id: 'entry-2',
        horse: { _id: 'horse-2' },
        lunger: { _id: 'lunger-2' },
        category: { _id: 'cat-3' },
        status: 'confirmed',
        teamName: 'Squad Name',
        vaulter: []
      }
    });

    expect(html).toContain('value="Blaze"');
    expect(html).toContain('value="Lunger Two"');
    expect(html).toContain('value="Squad Cat"');
    expect(html).toContain('value="Squad Name"');

    expect(html).toMatch(/name="horse"[\s\S]*?value="horse-2"/);
    expect(html).toMatch(/name="lunger"[\s\S]*?value="lunger-2"/);
    expect(html).toMatch(/name="category"[\s\S]*?value="cat-3"/);
  });

  test('maps status to display label and preserves hidden raw status', async () => {
    const html = await renderEditEntry({
      formData: {
        _id: 'entry-3',
        horse: { _id: 'horse-1' },
        lunger: { _id: 'lunger-1' },
        category: { _id: 'cat-1' },
        status: 'cancelled',
        teamName: '',
        vaulter: []
      }
    });

    expect(html).toContain('value="Cancelled"');
    expect(html).toMatch(/name="status"[\s\S]*?value="cancelled"/);
    expect(html).toContain('val="registered" >Registered');
    expect(html).toContain('val="withdrawn" >Withdrawn');
    expect(html).toContain('val="confirmed" >Confirmed');
    expect(html).toContain('val="cancelled">Inactive');
  });

  test('embeds category type map and vaulter scripting branches', async () => {
    const html = await renderEditEntry();

    expect(html).toContain('categoryTypeMap["cat-1"] = "Individual"');
    expect(html).toContain('categoryTypeMap["cat-2"] = "PDD"');
    expect(html).toContain('categoryTypeMap["cat-3"] = "Squad"');

    expect(html).toContain('const vaulters = [{"_id":"v-1","Name":"Vaulter One"},{"_id":"v-2","Name":"Vaulter Two"}]');
    expect(html).toContain('const formVaulters = [{"_id":"v-1","Name":"Vaulter One"}]');

    expect(html).toContain("if (type === 'Squad')");
    expect(html).toContain('renderVaulterInputs(6, formVaulters)');
    expect(html).toContain('renderVaulterInputs(2, formVaulters)');
    expect(html).toContain('renderVaulterInputs(1, formVaulters)');
    expect(html).toContain("document.querySelectorAll('.searchable-dropdown').forEach(wrapper => {");
    expect(html).toContain("if (input && hidden && list && items && typeof listCreator === 'function')");
  });
});
