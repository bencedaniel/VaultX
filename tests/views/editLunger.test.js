const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('editLunger.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/lunger/editLunger.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    // Provide defaults for countries and formData
    const defaults = { countries: ['Hungary', 'Germany', 'France'], formData: {} };
    return await ejs.render(template, { ...defaults, ...data }, {async: true});
  };

  it('renders the Edit Lunger header and form action', async () => {
    const html = await render({formData: {_id: 'lung1'}});
    expect(html).toContain('Edit Lunger');
    expect(html).toContain('form action="/lunger/edit/lung1" method="POST"');
  });

  it('renders empty fields if no formData', async () => {
    const html = await render();
    expect(html).toContain('name="Name"');
    expect(html).toContain('name="feiid"');
    expect(html).toContain('name="Gender"');
    expect(html).toContain('name="Nationality"');
  });

  it('renders form fields with formData values', async () => {
    const formData = {
      _id: 'lung1',
      Name: 'Kiss Béla',
      feiid: 'FEI123',
      Gender: 'Male',
      Nationality: 'Hungary',
    };
    const html = await render({formData, countries: ['Hungary', 'Germany']});
    expect(html).toContain('value="Kiss Béla"');
    expect(html).toContain('value="FEI123"');
    expect(html).toContain('value="Male"');
    expect(html).toContain('value="Hungary"');
  });

  it('renders dropdown options for gender', async () => {
    const html = await render();
    expect(html).toContain('Male');
    expect(html).toContain('Female');
  });

  it('renders dropdown options for countries', async () => {
    const html = await render({countries: ['Hungary', 'Germany', 'France']});
    expect(html).toContain('Hungary');
    expect(html).toContain('Germany');
    expect(html).toContain('France');
  });

  it('renders the submit button', async () => {
    const html = await render();
    expect(html).toContain('button type="submit"');
    expect(html).toContain('Edit Lunger');
  });

  it('renders the container with correct classes', async () => {
    const html = await render();
    expect(html).toContain('container my-4 border border-black');
    expect(html).toContain('bg-primary bg-opacity-10');
  });
});
