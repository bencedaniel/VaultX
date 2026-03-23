const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('newEvent.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/event/newEvent.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    if (!data.formData) data.formData = {};
    return await ejs.render(template, data, {async: true});
  };

  it('renders the New Event header', async () => {
    const html = await render();
    expect(html).toContain('New Event');
    expect(html).toContain('form action="/admin/event/new" method="POST"');
  });

  it('renders empty form fields if no formData', async () => {
    const html = await render();
    expect(html).toContain('value=""');
    expect(html).toContain('name="EventName"');
    expect(html).toContain('name="EventLocation"');
    expect(html).toContain('name="EventDirectorName"');
    expect(html).toContain('name="EventDirectorContact"');
  });

  it('renders form fields with formData values', async () => {
    const formData = {
      EventName: 'Test Event',
      EventLocation: 'Budapest',
      EventDirectorName: 'Kiss Béla',
      EventDirectorContact: '123-456-789'
    };
    const html = await render({formData});
    expect(html).toContain('value="Test Event"');
    expect(html).toContain('value="Budapest"');
    expect(html).toContain('value="Kiss Béla"');
    expect(html).toContain('value="123-456-789"');
  });

  it('renders all labels and placeholders', async () => {
    const html = await render();
    expect(html).toContain('label for="EventName"');
    expect(html).toContain('label for="EventLocation"');
    expect(html).toContain('label for="EventDirectorName"');
    expect(html).toContain('label for="EventDirectorContact"');
    expect(html).toContain('placeholder="Event Name"');
    expect(html).toContain('placeholder="Event Location"');
    expect(html).toContain('placeholder="Director Name"');
    expect(html).toContain('placeholder="Director Contact"');
  });

  it('renders the submit button', async () => {
    const html = await render();
    expect(html).toContain('button type="submit"');
    expect(html).toContain('New Event');
  });

  it('renders the container with correct classes', async () => {
    const html = await render();
    expect(html).toContain('container my-4 border border-black');
    expect(html).toContain('bg-primary bg-opacity-10');
  });

  it('renders required attribute for all fields', async () => {
    const html = await render();
    expect(html.match(/required/g).length).toBe(4);
  });
});
