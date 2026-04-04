const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('horsedash.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/horse/horsedash.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    return await ejs.render(template, { horses: [], ...data }, {async: true});
  };

  it('renders the Horse manager header', async () => {
    const html = await render();
    expect(html).toContain('Horse manager');
  });

  it('renders the search input and dropdown', async () => {
    const html = await render();
    expect(html).toContain('type="search"');
    expect(html).toContain('id="search"');
    expect(html).toContain('dropdown-toggle');
    expect(html).toContain('Select column');
  });

  it('renders the Create new horse button', async () => {
    const html = await render();
    expect(html).toContain('href="/horse/new"');
    expect(html).toContain('Create new horse');
  });

  it('renders the table headers', async () => {
    const html = await render();
    expect(html).toContain('Name');
    expect(html).toContain('FEI ID');
    expect(html).toContain('Head nr');
    expect(html).toContain('Box nr');
    expect(html).toContain('Status');
    expect(html).toContain('Person responsible');
  });

  it('renders horse rows with correct data', async () => {
    const horses = [
      {
        _id: '1',
        Horsename: 'Csillag',
        feiid: 'FEI123',
        HeadNr: [{armNumber: 'A12'}],
        BoxNr: [{boxNumber: 'B34'}],
        HorseStatus: 'active',
        ResponsiblePersonName: 'Kiss Béla'
      },
      {
        _id: '2',
        Horsename: 'Villám',
        feiid: 'FEI456',
        HeadNr: [{}],
        BoxNr: [{}],
        HorseStatus: 'inactive',
        ResponsiblePersonName: 'Nagy Anna'
      }
    ];
    const html = await render({horses});
    expect(html).toContain('Csillag');
    expect(html).toContain('FEI123');
    expect(html).toContain('A12');
    expect(html).toContain('B34');
    expect(html).toContain('active');
    expect(html).toContain('Kiss Béla');
    expect(html).toContain('Villám');
    expect(html).toContain('FEI456');
    expect(html).toContain('No head nr');
    expect(html).toContain('No box nr');
    expect(html).toContain('inactive');
    expect(html).toContain('Nagy Anna');
  });

  it('renders action buttons for each horse', async () => {
    const horses = [{_id: '1', Horsename: 'A', feiid: 'B', HeadNr: [{}], BoxNr: [{}], HorseStatus: 'active', ResponsiblePersonName: 'C'}];
    const html = await render({horses});
    expect(html).toContain('href="/horse/details/1"');
    expect(html).toContain('href="/horse/edit/1"');
    expect(html).toContain('bi-info-circle');
    expect(html).toContain('bi-pen');
  });

  it('renders the delete modal', async () => {
    const html = await render();
    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('Delete horse');
    expect(html).toContain('Are you sure you want to delete this horse?');
    expect(html).toContain('id="confirmDeleteButton"');
  });

  it('renders empty table body if no horses', async () => {
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
