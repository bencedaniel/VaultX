const ejs = require('ejs');
const path = require('path');

describe('createscoresheet.ejs – Scoring Office (Create Score Sheet)', () => {
  const viewPath = path.join(__dirname, '../../views/scoringOffice/createscoresheet.ejs');
  const render = async (timetableParts = []) => {
    return await ejs.renderFile(viewPath, { timetableParts });
  };

  it('renders the main header and container', async () => {
    const html = await render();
    expect(html).toContain('Select data for a new scoresheet');
    expect(html).toContain('container my-4');
    expect(html).toContain('form');
    expect(html).toContain('action="/scoring/office/scoresheet/new"');
  });

  it('renders the program dropdown with timetableParts', async () => {
    const timetableParts = [
      { _id: 'tt1', dailytimetable: { DayName: 'Monday' }, Name: 'Program 1' },
      { _id: 'tt2', dailytimetable: { DayName: 'Tuesday' }, Name: 'Program 2' }
    ];
    const html = await render(timetableParts);
    expect(html).toContain('id="TTprogram"');
    expect(html).toContain('Monday -- Program 1');
    expect(html).toContain('Tuesday -- Program 2');
  });

  it('renders the entries and table dropdowns', async () => {
    const html = await render();
    expect(html).toContain('id="entriesDropdown"');
    expect(html).toContain('id="Table"');
    expect(html).toContain('Select entry');
    expect(html).toContain('Select Table');
  });

  it('renders Back and Next buttons', async () => {
    const html = await render();
    expect(html).toContain('href="/dailytimetable/dayparts/"');
    expect(html).toContain('id="submit"');
    expect(html).toContain('Next');
    expect(html).toContain('Back');
  });

  it('renders correct classes for layout and styling', async () => {
    const html = await render();
    expect(html).toContain('border border-black');
    expect(html).toContain('rounded');
    expect(html).toContain('shadow');
    expect(html).toContain('bg-primary');
  });

  it('includes the Timetables JS variable and dropdown logic', async () => {
    const timetableParts = [
      {
        _id: 'tt1',
        dailytimetable: { DayName: 'Monday' },
        Name: 'Program 1',
        JudgesList: [ { Table: 'A', JudgeUserID: 'j1' }, { Table: 'B', JudgeUserID: 'j2' } ],
        StartingOrder: [
          { Entry: { _id: 'e1', teamName: 'Team Alpha', vaulter: [ { Name: 'Alice' } ] } },
          { Entry: { _id: 'e2', vaulter: [ { Name: 'Bob' }, { Name: 'Charlie' } ] } }
        ]
      }
    ];
    const html = await render(timetableParts);
    expect(html).toContain('const Timetables =');
    expect(html).toContain('Team Alpha');
    expect(html).toContain('Alice');
    expect(html).toContain('Bob');
    expect(html).toContain('Charlie');
  });

  it('includes the submit button JS logic', async () => {
    const html = await render();
    expect(html).toContain('document.addEventListener');
    expect(html).toContain('submitButton');
    expect(html).toContain('disabled');
  });
});
