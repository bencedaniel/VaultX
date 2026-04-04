const ejs = require('ejs');
const path = require('path');

describe('numberedit.ejs – Arm Number editor', () => {
  const viewPath = path.join(__dirname, '../../views/vaulter/numberedit.ejs');
  const render = async (vaulters = []) => {
    return await ejs.renderFile(viewPath, { vaulters });
  };

  it('renders the main header and container', async () => {
    const html = await render();
    expect(html).toContain('Arm number editor');
    expect(html).toContain('container my-4');
  });

  it('renders the search input and dropdown', async () => {
    const html = await render();
    expect(html).toContain('type="search"');
    expect(html).toContain('dropdown-menu');
    expect(html).toContain('Select column');
  });

  it('renders table headers correctly', async () => {
    const html = await render();
    expect(html).toContain('Name');
    expect(html).toContain('Gender');
    expect(html).toContain('FEI ID');
    expect(html).toContain('Nationality');
    expect(html).toContain('Status');
    expect(html).toContain('Arm nr');
  });

  it('renders vaulter rows with correct data and arm number input', async () => {
    const vaulters = [
      {
        _id: 'v1',
        Name: 'Alice',
        gender: 'F',
        feiid: '123',
        Nationality: 'HUN',
        Status: 'Active',
        ArmNr: [ { armNumber: 'A1' } ]
      },
      {
        _id: 'v2',
        Name: 'Bob',
        gender: 'M',
        feiid: '456',
        Nationality: 'GER',
        Status: 'Inactive',
        ArmNr: []
      }
    ];
    const html = await render(vaulters);
    expect(html).toContain('Alice');
    expect(html).toContain('F');
    expect(html).toContain('123');
    expect(html).toContain('HUN');
    expect(html).toContain('Active');
    expect(html).toContain('value="A1"');
    expect(html).toContain('Bob');
    expect(html).toContain('M');
    expect(html).toContain('456');
    expect(html).toContain('GER');
    expect(html).toContain('Inactive');
    // Bob has empty arm number
    expect(html).toMatch(/id="input_v2"[^>]*value=""/);
    // Save button
    expect(html).toContain('button_v1');
    expect(html).toContain('button_v2');
    expect(html).toContain('SaveButtons');
  });

  it('renders correct classes for layout and styling', async () => {
    const html = await render();
    expect(html).toContain('border border-black');
    expect(html).toContain('table-striped');
    expect(html).toContain('table-hover');
    expect(html).toContain('table-bordered');
    expect(html).toContain('shadow-sm');
    expect(html).toContain('bg-secondary');
  });

  it('renders the delete modal and JS logic', async () => {
    const html = await render();
    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('Delete vaulter');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('DOMContentLoaded');
  });

  it('includes JS logic for form change/save and beforeunload', async () => {
    const html = await render();
    expect(html).toContain('formChanged');
    expect(html).toContain('beforeunload');
    expect(html).toContain('markFormAsChanged');
    expect(html).toContain('ElementSaved');
    expect(html).toContain("fetch('/vaulter/updatenums/'");
  });
});
