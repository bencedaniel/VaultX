import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/mapping/editTablemapping.ejs');

function renderEditTableMapping(overrides = {}) {
  const data = {
    formData: {
      _id: 'map-1',
      Table: 'F',
      TestType: 'technical test',
      Role: 'artistic'
    },
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/mapping/editTablemapping.ejs', () => {
  test('renders edit form action with mapping id and submit button', async () => {
    const html = await renderEditTableMapping();

    expect(html).toContain('action="/mapping/edit/map-1"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('Edit Table Mapping');
    expect(html).toContain('>Save Mapping<');
  });

  test('renders all table options A-H and selected table', async () => {
    const html = await renderEditTableMapping();

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((table) => {
      expect(html).toContain(`value="${table}"`);
    });

    expect(html).toMatch(/<option value="F"\s+selected>F<\/option>/);
  });

  test('renders test type options including technical test and selected value', async () => {
    const html = await renderEditTableMapping();

    expect(html).toContain('value="compulsory"');
    expect(html).toContain('value="free test"');
    expect(html).toContain('value="technical test"');

    expect(html).toContain('>Compulsory<');
    expect(html).toContain('>Free test<');
    expect(html).toContain('>Technical test<');

    expect(html).toMatch(/<option value="technical test"\s+selected>Technical test<\/option>/);
  });

  test('renders role options and selected role', async () => {
    const html = await renderEditTableMapping();

    expect(html).toContain('value="horse"');
    expect(html).toContain('value="compulsory"');
    expect(html).toContain('value="artistic"');
    expect(html).toContain('value="technical"');

    expect(html).toContain('>Horse<');
    expect(html).toContain('>Compulsory<');
    expect(html).toContain('>Artistic<');
    expect(html).toContain('>Technical<');

    expect(html).toMatch(/<option value="artistic"\s+selected>Artistic<\/option>/);
  });

  test('renders placeholder options in each select', async () => {
    const html = await renderEditTableMapping();

    expect(html).toContain('<option value="">Select Table</option>');
    expect(html).toContain('<option value="">Select Test Type</option>');
    expect(html).toContain('<option value="">Select Role</option>');
  });

  test('renders no selected entries when formData is undefined', async () => {
    const html = await renderEditTableMapping({ formData: undefined });

    expect(html).not.toMatch(/<option value="A"\s+selected>/);
    expect(html).not.toMatch(/<option value="compulsory"\s+selected>/);
    expect(html).not.toMatch(/<option value="horse"\s+selected>/);
  });
});
