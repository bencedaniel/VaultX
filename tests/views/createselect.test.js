const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('createselect.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/order/createselect.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    // Provide default formData with nested dailytimetable
    const defaults = { formData: { _id: 'order1', dailytimetable: { _id: 'dt1' }, creationMethod: '' } };
    return await ejs.render(template, { ...defaults, ...data }, {async: true});
  };

  it('renders the Method of creation header and form action', async () => {
    const html = await render();
    expect(html).toContain('Method of creation');
    expect(html).toContain('form action="/order/createSelect/order1" method="POST"');
  });

  it('renders the creationMethod select with options', async () => {
    const html = await render();
    expect(html).toContain('id="creationMethod"');
    expect(html).toContain('option value="Drawing"');
    expect(html).toContain('option value="Copy"');
    expect(html).toContain('Select method');
  });

  it('selects the correct option based on formData', async () => {
    const html = await render({formData: { _id: 'order1', dailytimetable: { _id: 'dt1' }, creationMethod: 'Drawing' }});
    expect(html).toContain('<option value="Drawing" selected');
    const html2 = await render({formData: { _id: 'order1', dailytimetable: { _id: 'dt1' }, creationMethod: 'Copy' }});
    expect(html2).toContain('<option value="Copy" selected');
  });

  it('renders the Back and Next buttons with correct href', async () => {
    const html = await render();
    expect(html).toContain('href="/dailytimetable/dayparts/dt1"');
    expect(html).toContain('id="submit"');
    expect(html).toContain('Next');
  });

  it('renders the container with correct classes', async () => {
    const html = await render();
    expect(html).toContain('container my-4 border border-black');
    expect(html).toContain('bg-primary bg-opacity-10');
  });
});
