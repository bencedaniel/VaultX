const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('tablemappingdash.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/mapping/tablemappingdash.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    return await ejs.render(template, { mappings: [], ...data }, {async: true});
  };

  it('renders the Mapping Management header', async () => {
    const html = await render();
    expect(html).toContain('Mapping Management');
  });

  it('renders the search input and dropdown', async () => {
    const html = await render();
    expect(html).toContain('type="search"');
    expect(html).toContain('id="search"');
    expect(html).toContain('dropdown-toggle');
    expect(html).toContain('Select column');
  });

  it('renders the Create New Mapping button', async () => {
    const html = await render();
    expect(html).toContain('href="/mapping/new"');
    expect(html).toContain('Create New Mapping');
  });

  it('renders the table headers', async () => {
    const html = await render();
    expect(html).toContain('Table');
    expect(html).toContain('TestType');
    expect(html).toContain('Role');
  });

  it('renders mapping rows with correct data', async () => {
    const mappings = [
      {
        _id: '1',
        Table: 'Results',
        TestType: 'TypeA',
        Role: 'Admin'
      },
      {
        _id: '2',
        Table: 'Scores',
        TestType: 'TypeB',
        Role: 'User'
      }
    ];
    const html = await render({mappings});
    expect(html).toContain('Results');
    expect(html).toContain('TypeA');
    expect(html).toContain('Admin');
    expect(html).toContain('Scores');
    expect(html).toContain('TypeB');
    expect(html).toContain('User');
  });

  it('renders action buttons for each mapping', async () => {
    const mappings = [{_id: '1', Table: 'T', TestType: 'A', Role: 'R'}];
    const html = await render({mappings});
    expect(html).toContain('href="/mapping/edit/1"');
    expect(html).toContain('bi-pen');
    expect(html).toContain('data-bs-target="#deleteModal"');
    expect(html).toContain('bi-trash');
  });

  it('renders the delete modal', async () => {
    const html = await render();
    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('Delete Mapping');
    expect(html).toContain('Are you sure you want to delete this mapping?');
    expect(html).toContain('id="confirmDeleteButton"');
  });

  it('renders empty table body if no mappings', async () => {
    const html = await render();
    const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
    expect(tbodyMatch).toBeTruthy();
    expect(tbodyMatch[1]).not.toContain('<tr>');
  });

  it('renders correct classes for container and table', async () => {
    const html = await render();
    expect(html).toContain('container my-4 border border-black');
    expect(html).toContain('table table-striped table-hover table-bordered');
  });
});
