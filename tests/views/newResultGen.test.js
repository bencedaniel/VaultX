import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/resultGen/newResultGen.ejs');

function renderNewResultGen(overrides = {}) {
  const data = {
    formData: null,
    categories: [
      { _id: 'cat-1', CategoryDispName: 'Junior Individual' },
      { _id: 'cat-2', CategoryDispName: 'Senior Squad' }
    ],
    resultCalcs: [
      { _id: 'calc-1', round1FirstP: 30, round1SecondP: 40, round2FirstP: 30 },
      { _id: 'calc-2', round1FirstP: 50, round1SecondP: 20, round2FirstP: 30 }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/resultGen/newResultGen.ejs', () => {
  test('renders form skeleton with action and submit button text', async () => {
    const html = await renderNewResultGen();

    expect(html).toContain('action="/result/generator/new"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('Edit result calc template');
    // Button label is intentionally asserted as currently implemented in template.
    expect(html).toContain('>Edite<');
  });

  test('renders category and calculation template dropdown options', async () => {
    const html = await renderNewResultGen();

    expect(html).toContain('Junior Individual');
    expect(html).toContain('Senior Squad');
    expect(html).toContain('30,40,30');
    expect(html).toContain('50,20,30');
  });

  test('renders empty hidden values when formData is missing', async () => {
    const html = await renderNewResultGen({ formData: null });

    expect(html).toMatch(/name="category"[\s\S]*?value=""/);
    expect(html).toMatch(/name="calcSchemaTemplate"[\s\S]*?value=""/);
  });

  test('prefills visible and hidden values when formData is provided', async () => {
    const html = await renderNewResultGen({
      formData: {
        category: { _id: 'cat-2' },
        calcSchemaTemplate: 'calc-1'
      }
    });

    expect(html).toContain('value="Senior Squad"');
    expect(html).toContain('value="30,40,30"');

    // category hidden field uses raw formData.category expression in template
    expect(html).toMatch(/name="category"[\s\S]*?value="\[object Object\]"/);
    expect(html).toMatch(/name="calcSchemaTemplate"[\s\S]*?value="calc-1"/);
  });

  test('supports string category id in formData hidden field', async () => {
    const html = await renderNewResultGen({
      formData: {
        category: 'cat-1',
        calcSchemaTemplate: 'calc-2'
      }
    });

    expect(html).toMatch(/name="category"[\s\S]*?value="cat-1"/);
    expect(html).toMatch(/name="calcSchemaTemplate"[\s\S]*?value="calc-2"/);
  });
});
