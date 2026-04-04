import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/mapping/newTablemapping.ejs');

function renderNewTableMapping(overrides = {}) {
  const data = {
    formData: {
      Table: 'C',
      TestType: 'free test',
      Role: 'technical'
    },
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/mapping/newTablemapping.ejs', () => {
  test('renders form action, title and submit button', async () => {
    const html = await renderNewTableMapping();

    expect(html).toContain('action="/mapping/new"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('New table mapping');
    expect(html).toContain('>Save mapping<');
  });

  test('renders all table options A-H and selects current table', async () => {
    const html = await renderNewTableMapping();

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((table) => {
      expect(html).toContain(`value="${table}"`);
    });
    expect(html).toMatch(/<option value="C"\s+selected>C<\/option>/);
  });

  test('renders test type options and selected branch', async () => {
    const html = await renderNewTableMapping();

    expect(html).toContain('value="compulsory"');
    expect(html).toContain('value="free test"');
    expect(html).toContain('value="technical"');

    expect(html).toContain('>Compulsory<');
    expect(html).toContain('>Free test<');
    expect(html).toContain('>Technical<');

    expect(html).toMatch(/<option value="free test"\s+selected>Free test<\/option>/);
  });

  test('renders role options and selected branch', async () => {
    const html = await renderNewTableMapping();

    expect(html).toContain('value="horse"');
    expect(html).toContain('value="compulsory"');
    expect(html).toContain('value="artistic"');
    expect(html).toContain('value="technical"');

    expect(html).toContain('>Horse<');
    expect(html).toContain('>Compulsory<');
    expect(html).toContain('>Artistic<');
    expect(html).toContain('>Technical<');

    expect(html).toMatch(/<option value="technical"\s+selected>Technical<\/option>/);
  });

  test('renders placeholder options in all selects', async () => {
    const html = await renderNewTableMapping();

    expect(html).toContain('<option value="">Select table</option>');
    expect(html).toContain('<option value="">Select test type</option>');
    expect(html).toContain('<option value="">Select role</option>');
  });

  test('renders no selected options when formData is missing', async () => {
    const html = await renderNewTableMapping({ formData: undefined });

    expect(html).not.toMatch(/<option value="A"\s+selected>/);
    expect(html).not.toMatch(/<option value="compulsory"\s+selected>/);
    expect(html).not.toMatch(/<option value="horse"\s+selected>/);
  });
});
