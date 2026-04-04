const ejs = require('ejs');
const path = require('path');

describe('vaulterdash.ejs – Vaulter Management', () => {
  const viewPath = path.join(__dirname, '../../views/vaulter/vaulterdash.ejs');
  const render = async (vaulters = []) => {
    return await ejs.renderFile(viewPath, { vaulters });
  };

  it('renders the main header and container', async () => {
    const html = await render();
    expect(html).toContain('Vaulter manager');
    expect(html).toContain('container my-4');
  });

  it('renders the search input, dropdown, and create button', async () => {
    const html = await render();
    expect(html).toContain('type="search"');
    expect(html).toContain('dropdown-menu');
    expect(html).toContain('Select column');
    expect(html).toContain('href="/vaulter/new"');
    expect(html).toContain('Create new vaulter');
  });

  it('renders table headers correctly', async () => {
    const html = await render();
    expect(html).toContain('Name');
    expect(html).toContain('FEI ID');
    expect(html).toContain('Gender');
    expect(html).toContain('Nationality');
    expect(html).toContain('Status');
    expect(html).toContain('Arm nr');
  });

  it('renders vaulter rows with correct data and action buttons', async () => {
    const vaulters = [
      {
        _id: 'v1',
        Name: 'Alice',
        feiid: '123',
        gender: 'F',
        Nationality: 'HUN',
        Status: 'Active',
        ArmNr: [ { armNumber: 'A1' } ]
      },
      {
        _id: 'v2',
        Name: 'Bob',
        feiid: '456',
        gender: 'M',
        Nationality: 'GER',
        Status: 'Inactive',
        ArmNr: []
      }
    ];
    const html = await render(vaulters);
    expect(html).toContain('Alice');
    expect(html).toContain('123');
    expect(html).toContain('F');
    expect(html).toContain('HUN');
    expect(html).toContain('Active');
    expect(html).toContain('A1');
    expect(html).toContain('Bob');
    expect(html).toContain('456');
    expect(html).toContain('M');
    expect(html).toContain('GER');
    expect(html).toContain('Inactive');
    expect(html).toContain('No arm nr');
    // Action buttons
    expect(html).toContain('href="/vaulter/details/v1"');
    expect(html).toContain('href="/vaulter/edit/v1"');
    expect(html).toContain('href="/vaulter/details/v2"');
    expect(html).toContain('href="/vaulter/edit/v2"');
    expect(html).toContain('btn btn-info btn-sm');
    expect(html).toContain('btn btn-warning btn-sm');
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
    expect(html).toContain("fetch('/vaulter/delete/'");
  });
});
