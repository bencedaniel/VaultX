const ejs = require('ejs');
const path = require('path');

describe('perprogram.ejs – Scoring Judge (Scoring view per program)', () => {
  const viewPath = path.join(__dirname, '../../views/scoringJudge/perprogram.ejs');
  const render = async (
    timetablePart = {
      Name: 'Test Program',
      StartTimePlanned: new Date('2024-03-23T10:00:00Z'),
      Round: 'R1',
      TestType: 'TypeA',
      StartingOrder: []
    },
    tablebyJudge = 'A',
    judgeName = 'Judge Dredd',
    ScoreSheetsSubmitted = []
  ) => {
    return await ejs.renderFile(viewPath, { timetablePart, tablebyJudge, judgeName, ScoreSheetsSubmitted });
  };

  it('renders the main header, program name, and info', async () => {
    const html = await render();
    expect(html).toContain('Scoring view');
    expect(html).toContain('Program name: Test Program');
    expect(html).toContain('Start time:');
    expect(html).toContain('Round: R1');
    expect(html).toContain('Test type: TypeA');
    expect(html).toContain('Nr of starters: 0');
    expect(html).toContain('Table: A');
    expect(html).toContain('Judge name: Judge Dredd');
  });

  it('renders the search input and dropdown', async () => {
    const html = await render();
    expect(html).toContain('type="search"');
    expect(html).toContain('dropdown-menu');
    expect(html).toContain('Select column');
  });

  it('renders table headers correctly', async () => {
    const html = await render();
    expect(html).toContain('Order Nr.');
    expect(html).toContain('Vaulter(s)');
    expect(html).toContain('Lunger');
    expect(html).toContain('Horse');
    expect(html).toContain('Category');
  });

  it('renders starting order rows with correct data and button enabled/disabled', async () => {
    const timetablePart = {
      Name: 'Test Program',
      StartTimePlanned: new Date('2024-03-23T10:00:00Z'),
      Round: 'R1',
      TestType: 'TypeA',
      _id: 'tp1',
      StartingOrder: [
        {
          Order: 1,
          Entry: {
            _id: 'e1',
            vaulter: [ { Name: 'Alice' }, { Name: 'Bob' } ],
            lunger: { Name: 'Lunger1' },
            horse: { Horsename: 'Horse1' },
            category: { CategoryDispName: 'Cat1' }
          }
        },
        {
          Order: 2,
          Entry: {
            _id: 'e2',
            vaulter: [ { Name: 'Charlie' } ],
            lunger: { Name: 'Lunger2' },
            horse: { Horsename: 'Horse2' },
            category: { CategoryDispName: 'Cat2' }
          }
        }
      ]
    };
    const ScoreSheetsSubmitted = [ { EntryId: 'e2' } ];
    const html = await render(timetablePart, 'B', 'Judge Judy', ScoreSheetsSubmitted);
    // Row 1: not submitted, enabled
    expect(html).toContain('1');
    expect(html).toContain('Alice, Bob');
    expect(html).toContain('Lunger1');
    expect(html).toContain('Horse1');
    expect(html).toContain('Cat1');
    expect(html).toContain("location.href='/scoring/newscoresheet/e1/tp1'");
    // Row 2: submitted, disabled
    expect(html).toContain('2');
    expect(html).toContain('Charlie');
    expect(html).toContain('Lunger2');
    expect(html).toContain('Horse2');
    expect(html).toContain('Cat2');
    expect(html).toContain("location.href='/scoring/newscoresheet/e2/tp1'");
    // Button for e2 should be disabled
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Add Score sheet<\/button>/);
  });

  it('disables Add Score sheet button for Not authorized judge', async () => {
    const timetablePart = {
      Name: 'Test Program',
      StartTimePlanned: new Date('2024-03-23T10:00:00Z'),
      Round: 'R1',
      TestType: 'TypeA',
      _id: 'tp1',
      StartingOrder: [
        {
          Order: 1,
          Entry: {
            _id: 'e1',
            vaulter: [ { Name: 'Alice' } ],
            lunger: { Name: 'Lunger1' },
            horse: { Horsename: 'Horse1' },
            category: { CategoryDispName: 'Cat1' }
          }
        }
      ]
    };
    const html = await render(timetablePart, 'A', 'Not authorized judge', []);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Add Score sheet<\/button>/);
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

  it('includes modal and JS logic for save/delete', async () => {
    const html = await render();
    expect(html).toContain('saveModal');
    expect(html).toContain('confirmSaveButton');
    expect(html).toContain('DOMContentLoaded');
    expect(html).toContain('deleteModal');
    expect(html).toContain('confirmDeleteButton');
  });
});
