const ejs = require('ejs');
const path = require('path');

describe('dashboard.ejs – SS Template Management', () => {
  const viewPath = path.join(__dirname, '../../views/ssTemp/dashboard.ejs');
  const render = async (ssTemps = []) => {
    return await ejs.renderFile(viewPath, { ssTemps });
  };

  it('renders the main header and container', async () => {
    const html = await render();
    expect(html).toContain('Scoresheet template manager');
    expect(html).toContain('container my-4');
  });

  it('renders the search input, dropdown, and create button', async () => {
    const html = await render();
    expect(html).toContain('type="search"');
    expect(html).toContain('dropdown-menu');
    expect(html).toContain('Select column');
    expect(html).toContain('href="/scoresheets/create"');
    expect(html).toContain('Create new scoresheet template');
  });

  it('renders table headers correctly', async () => {
    const html = await render();
    expect(html).toContain('Categories');
    expect(html).toContain('Number of judges');
    expect(html).toContain('Type of scores');
    expect(html).toContain('Test type');
  });

  it('renders scoresheet rows with correct data and edit/delete buttons', async () => {
    const ssTemps = [
      {
        _id: 'sst1',
        CategoryId: [ { CategoryDispName: 'Vaulting' }, { CategoryDispName: 'Dressage' } ],
        numberOfJudges: 3,
        typeOfScores: 'Technical',
        TestType: 'TypeA'
      },
      {
        _id: 'sst2',
        CategoryId: [ { CategoryDispName: 'Jumping' } ],
        numberOfJudges: 2,
        typeOfScores: 'Artistic',
        TestType: 'TypeB'
      }
    ];
    const html = await render(ssTemps);
    expect(html).toContain('Vaulting, Dressage');
    expect(html).toContain('Jumping');
    expect(html).toContain('3');
    expect(html).toContain('2');
    expect(html).toContain('Technical');
    expect(html).toContain('Artistic');
    expect(html).toContain('TypeA');
    expect(html).toContain('TypeB');
    // Edit and delete buttons
    expect(html).toContain('href="/scoresheets/edit/sst1"');
    expect(html).toContain('href="/scoresheets/edit/sst2"');
    expect(html).toContain('data-scoresheetid="sst1"');
    expect(html).toContain('data-scoresheetid="sst2"');
  });

  it('renders empty table body if no ssTemps', async () => {
    const html = await render([]);
    expect(html).toContain('<tbody');
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
    expect(html).toContain('Delete scoresheet');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('DOMContentLoaded');
    expect(html).toContain("fetch('/scoresheets/delete/'");
  });
});
