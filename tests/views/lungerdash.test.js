const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('lungerdash.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/lunger/lungerdash.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    return await ejs.render(template, { lungers: [], ...data }, {async: true});
  };

  it('renders the Lunger manager header', async () => {
    const html = await render();
    expect(html).toContain('Lunger manager');
  });

  it('renders the search input and dropdown', async () => {
    const html = await render();
    expect(html).toContain('type="search"');
    expect(html).toContain('id="search"');
    expect(html).toContain('dropdown-toggle');
    expect(html).toContain('Select column');
  });

  it('renders the Create new lunger button', async () => {
    const html = await render();
    expect(html).toContain('href="/lunger/new"');
    expect(html).toContain('Create new lunger');
  });

  it('renders the table headers', async () => {
    const html = await render();
    expect(html).toContain('Name');
    expect(html).toContain('FEI ID');
    expect(html).toContain('Gender');
    expect(html).toContain('Nationality');
  });

  it('renders lunger rows with correct data', async () => {
    const lungers = [
      {
        _id: '1',
        Name: 'Kiss Béla',
        feiid: 'FEI123',
        Gender: 'Male',
        Nationality: 'Hungary'
      },
      {
        _id: '2',
        Name: 'Nagy Anna',
        feiid: 'FEI456',
        Gender: 'Female',
        Nationality: 'Germany'
      }
    ];
    const html = await render({lungers});
    expect(html).toContain('Kiss Béla');
    expect(html).toContain('FEI123');
    expect(html).toContain('Male');
    expect(html).toContain('Hungary');
    expect(html).toContain('Nagy Anna');
    expect(html).toContain('FEI456');
    expect(html).toContain('Female');
    expect(html).toContain('Germany');
  });

  it('renders action buttons for each lunger', async () => {
    const lungers = [{_id: '1', Name: 'A', feiid: 'B', Gender: 'C', Nationality: 'D'}];
    const html = await render({lungers});
    expect(html).toContain('href="/lunger/details/1"');
    expect(html).toContain('href="/lunger/edit/1"');
    expect(html).toContain('bi-info-circle');
    expect(html).toContain('bi-pen');
  });

  it('renders the delete modal', async () => {
    const html = await render();
    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('Delete lunger');
    expect(html).toContain('Are you sure you want to delete this lunger?');
    expect(html).toContain('id="confirmDeleteButton"');
  });

  it('renders empty table body if no lungers', async () => {
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
