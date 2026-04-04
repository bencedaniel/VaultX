const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('editResultCalc.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/resultCalc/editResultCalc.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    return await ejs.render(template, { formData: {}, ...data }, {async: true});
  };

  it('renders the Edit result calculation template header and form action', async () => {
    const html = await render({formData: {_id: 'calc1'}});
    expect(html).toContain('Edit result calculation template');
    expect(html).toContain('form action="/result/calcTemp/edit/calc1" method="POST"');
  });

  it('renders empty fields if no formData', async () => {
    const html = await render();
    expect(html).toContain('name="round1FirstP"');
    expect(html).toContain('name="round1SecondP"');
    expect(html).toContain('name="round2FirstP"');
    expect(html).toContain('value=""');
  });

  it('renders form fields with formData values', async () => {
    const formData = {
      _id: 'calc1',
      round1FirstP: 10.5,
      round1SecondP: 20.25,
      round2FirstP: 30.75
    };
    const html = await render({formData});
    expect(html).toContain('value="10.5"');
    expect(html).toContain('value="20.25"');
    expect(html).toContain('value="30.75"');
  });

  it('renders all labels and placeholders', async () => {
    const html = await render();
    expect(html).toContain('label for="round1FirstP"');
    expect(html).toContain('label for="round1SecondP"');
    expect(html).toContain('label for="round2FirstP"');
    expect(html).toContain('placeholder="Test 1 Percentage"');
    expect(html).toContain('placeholder="Test 2 Percentage"');
    expect(html).toContain('placeholder="Final Percentage"');
  });

  it('renders the submit button', async () => {
    const html = await render();
    expect(html).toContain('button type="submit"');
    expect(html).toContain('Save changes');
  });

  it('renders the container with correct classes', async () => {
    const html = await render();
    expect(html).toContain('container my-4 border border-black');
    expect(html).toContain('bg-primary bg-opacity-10');
  });
});
