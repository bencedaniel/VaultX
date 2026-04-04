const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('newHorse.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/horse/newHorse.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    // Provide defaults for countries and formData
    const defaults = { countries: ['Hungary', 'Germany', 'France'], formData: {} };
    return await ejs.render(template, { ...defaults, ...data }, {async: true});
  };

  it('renders the Add New Horse header and form action', async () => {
    const html = await render();
    expect(html).toContain('New horse');
    expect(html).toContain('form action="/horse/new" method="POST"');
  });

  it('renders empty fields if no formData', async () => {
    const html = await render();
    expect(html).toContain('name="Horsename"');
    expect(html).toContain('name="feiid"');
    expect(html).toContain('name="sex"');
    expect(html).toContain('name="Bdate"');
    expect(html).toContain('name="Nationality"');
    expect(html).toContain('name="Status"');
    expect(html).toContain('name="BoxNr"');
    expect(html).toContain('name="HeadNr"');
    expect(html).toContain('name="ResponsiblePersonName"');
    expect(html).toContain('name="ResponsiblePersonContact"');
  });

  it('renders form fields with formData values and selects', async () => {
    const formData = {
      Horsename: 'Csillag',
      feiid: 'FEI123',
      sex: 'Mare',
      Bdate: '2010-05-10T00:00:00.000Z',
      Nationality: 'Hungary',
      HorseStatus: 'active',
      BoxNr: [{boxNumber: 'B12'}],
      HeadNr: [{headNumber: 'H34'}],
      ResponsiblePersonName: 'Kiss Béla',
      ResponsiblePersonContact: '123-456'
    };
    const html = await render({formData, countries: ['Hungary', 'Germany']});
    expect(html).toContain('value="Csillag"');
    expect(html).toContain('value="FEI123"');
    expect(html).toContain('<option value="Mare" selected');
    expect(html).toContain('value="Hungary"');
    expect(html).toContain('value="Active"');
    expect(html).toContain('value="B12"');
    expect(html).toContain('value="H34"');
    expect(html).toContain('value="Kiss Béla"');
    expect(html).toContain('value="123-456"');
    expect(html).toContain('value="2010-05-10"');
  });

  it('renders dropdown options for sex', async () => {
    const html = await render();
    expect(html).toContain('option value="Mare"');
    expect(html).toContain('option value="Gelding"');
    expect(html).toContain('option value="Stallion"');
  });

  it('renders dropdown options for countries', async () => {
    const html = await render({countries: ['Hungary', 'Germany', 'France']});
    expect(html).toContain('Hungary');
    expect(html).toContain('Germany');
    expect(html).toContain('France');
  });

  it('renders fallback for BoxNr and HeadNr', async () => {
    const formData = { BoxNr: [], box: '', HeadNr: [], head: '' };
    const html = await render({formData});
    // Should be empty string fallback
    expect(html).toMatch(/name="BoxNr"[^>]*value=""/);
    expect(html).toMatch(/name="HeadNr"[^>]*value=""/);
  });

  it('renders BoxNr and HeadNr from alternative fields', async () => {
    const formData = { BoxNr: undefined, box: 'B99', HeadNr: undefined, head: 'H99' };
    const html = await render({formData});
    expect(html).toContain('value="B99"');
    expect(html).toContain('value="H99"');
  });

  it('renders the submit button', async () => {
    const html = await render();
    expect(html).toContain('button type="submit"');
    expect(html).toContain('Create horse');
  });

  it('renders the container with correct classes', async () => {
    const html = await render();
    expect(html).toContain('container my-4 border border-black');
    expect(html).toContain('bg-primary bg-opacity-10');
  });
});
