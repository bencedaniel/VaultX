const ejs = require('ejs');
const path = require('path');

describe('dashboard.ejs – Scoring Judge (Scoring view)', () => {
  const viewPath = path.join(__dirname, '../../views/scoringJudge/dashboard.ejs');
  const render = async (day = { DayName: 'Monday' }, timetableParts = []) => {
    return await ejs.renderFile(viewPath, { day, timetableParts });
  };

  it('renders the main header and day', async () => {
    const html = await render();
    expect(html).toContain('Scoring view');
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
    expect(html).toContain('Start time planned');
    expect(html).toContain('Categories');
    expect(html).toContain('Test type');
    expect(html).toContain('Round');
  });

  it('renders timetable rows with correct data', async () => {
    const timetableParts = [
      {
        _id: 'tt1',
        Name: 'Program 1',
        StartTimePlanned: new Date('2024-03-23T10:00:00Z'),
        Category: [ { CategoryDispName: 'Vaulting' }, { CategoryDispName: 'Dressage' } ],
        TestType: 'TypeA',
        Round: 'R1'
      },
      {
        _id: 'tt2',
        Name: 'Program 2',
        StartTimePlanned: new Date('2024-03-23T12:00:00Z'),
        Category: [ { CategoryDispName: 'Jumping' } ],
        TestType: 'TypeB',
        Round: 'R2'
      }
    ];
    const html = await render({ DayName: 'Tuesday' }, timetableParts);
    expect(html).toContain('Programs on Tuesday');
    expect(html).toContain('Program 1');
    expect(html).toContain('Program 2');
    expect(html).toContain('Vaulting, Dressage');
    expect(html).toContain('Jumping');
    expect(html).toContain('TypeA');
    expect(html).toContain('TypeB');
    expect(html).toContain('R1');
    expect(html).toContain('R2');
    // Scoring button
    expect(html).toContain('href="/scoring/program/tt1"');
    expect(html).toContain('href="/scoring/program/tt2"');
    expect(html).toContain('btn btn-info btn-sm');
  });

  it('renders empty table body if no timetableParts', async () => {
    const html = await render({ DayName: 'Wednesday' }, []);
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

  it('includes modal JS logic for delete/save (script presence)', async () => {
    const html = await render();
    expect(html).toContain('DOMContentLoaded');
    expect(html).toContain('deleteModal');
    expect(html).toContain('confirmDeleteButton');
    expect(html).toContain('saveModal');
    expect(html).toContain('confirmSaveButton');
  });
});
