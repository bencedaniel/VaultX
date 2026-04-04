const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('resultCalcDashboard.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/resultCalc/dashboard.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    return await ejs.render(template, { resultCalcs: [], ...data }, {async: true});
  };

  it('renders the Result calculation manager header', async () => {
    const html = await render();
    expect(html).toContain('Result calculation manager');
  });

  it('renders the search input and dropdown', async () => {
    const html = await render();
    expect(html).toContain('type="search"');
    expect(html).toContain('id="search"');
    expect(html).toContain('dropdown-toggle');
    expect(html).toContain('Select column');
  });

  it('renders the Create new result calculation button', async () => {
    const html = await render();
    expect(html).toContain('href="/result/calcTemp/new"');
    expect(html).toContain('Create new result calculation');
  });

  it('renders the table headers', async () => {
    const html = await render();
    expect(html).toContain('Test 1');
    expect(html).toContain('Test 2');
    expect(html).toContain('Final');
  });

  it('renders resultCalc rows with correct data and percent sign', async () => {
    const resultCalcs = [
      {
        _id: '1',
        round1FirstP: 10.5,
        round1SecondP: 20.25,
        round2FirstP: 30.75
      },
      {
        _id: '2',
        round1FirstP: 5,
        round1SecondP: 15,
        round2FirstP: 25
      }
    ];
    const html = await render({resultCalcs});
    expect(html).toContain('10.5%');
    expect(html).toContain('20.25%');
    expect(html).toContain('30.75%');
    expect(html).toContain('5%');
    expect(html).toContain('15%');
    expect(html).toContain('25%');
  });

  it('renders action buttons for each resultCalc', async () => {
    const resultCalcs = [{_id: '1', round1FirstP: 1, round1SecondP: 2, round2FirstP: 3}];
    const html = await render({resultCalcs});
    expect(html).toContain('href="/result/calcTemp/edit/1"');
    expect(html).toContain('bi-pen');
    expect(html).toContain('data-bs-target="#deleteModal"');
    expect(html).toContain('bi-trash');
  });

  it('renders the delete modal', async () => {
    const html = await render();
    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('Delete calculation');
    expect(html).toContain('Are you sure you want to delete this mapping?');
    expect(html).toContain('id="confirmDeleteButton"');
  });

  it('renders empty table body if no resultCalcs', async () => {
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
