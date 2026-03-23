import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/scoringOffice/dashboard.ejs');

function makeScoreSheet(overrides = {}) {
  return {
    _id: 'ss-1',
    TimetablePartId: { Name: 'Round 1 - Program A' },
    EntryId: {
      teamName: '',
      vaulter: { Name: 'Solo Vaulter' },
      category: { CategoryDispName: 'Senior Individual' }
    },
    Judge: {
      userId: { fullname: 'Judge One' },
      table: 'A'
    },
    totalScoreBE: 7.2345,
    ...overrides
  };
}

function renderScoringOfficeDashboard(overrides = {}) {
  const data = {
    scoreSheets: [
      makeScoreSheet({
        _id: 'ss-1',
        EntryId: {
          teamName: 'Team Alpha',
          vaulter: { Name: 'Ignored' },
          category: { CategoryDispName: 'Team Cat' }
        },
        totalScoreBE: 8.1111
      }),
      makeScoreSheet({
        _id: 'ss-2',
        EntryId: {
          teamName: '',
          vaulter: { Name: 'Single Name' },
          category: { CategoryDispName: 'Single Cat' }
        },
        totalScoreBE: 7.5
      }),
      makeScoreSheet({
        _id: 'ss-3',
        EntryId: {
          teamName: '',
          vaulter: [{ Name: 'A' }, { Name: 'B' }],
          category: { CategoryDispName: 'Pair Cat' }
        },
        totalScoreBE: null
      }),
      makeScoreSheet({
        _id: 'ss-4',
        EntryId: {
          teamName: '',
          vaulter: null,
          category: { CategoryDispName: 'Fallback Cat' }
        },
        totalScoreBE: undefined
      })
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/scoringOffice/dashboard.ejs', () => {
  test('renders page header, search controls and create new scoresheet link', async () => {
    const html = await renderScoringOfficeDashboard();

    expect(html).toContain('Score Sheet manager');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');
    expect(html).toContain('href="/scoring/office/scoresheet/new"');
    expect(html).toContain('Create New ScoreSheet');
  });

  test('renders table headers and key columns', async () => {
    const html = await renderScoringOfficeDashboard();

    expect(html).toContain('<th scope="col">Program Name</th>');
    expect(html).toContain('<th scope="col">Vaulters / Team Name</th>');
    expect(html).toContain('<th scope="col">Category</th>');
    expect(html).toContain('<th scope="col">Judge and Table</th>');
    expect(html).toContain('<th scope="col">Total Score</th>');
  });

  test('resolves vaulter/team display by priority: teamName, object, array, N/A', async () => {
    const html = await renderScoringOfficeDashboard();

    expect(html).toContain('Team Alpha');
    expect(html).toContain('Single Name');
    expect(html).toContain('A, B');
    expect(html).toContain('N/A');
  });

  test('renders category, judge-table and edit links per scoresheet', async () => {
    const html = await renderScoringOfficeDashboard();

    expect(html).toContain('Team Cat');
    expect(html).toContain('Single Cat');
    expect(html).toContain('Pair Cat');

    expect(html).toContain('Judge One - A');

    expect(html).toContain('href="/scoring/office/scoresheet/edit1/ss-1"');
    expect(html).toContain('href="/scoring/office/scoresheet/edit1/ss-2"');
    expect(html).toContain('href="/scoring/office/scoresheet/edit1/ss-3"');
  });

  test('renders total score raw value or Not calculated fallback', async () => {
    const html = await renderScoringOfficeDashboard();

    expect(html).toContain('id="total-ss-1"');
    expect(html).toContain('8.1111');

    expect(html).toContain('id="total-ss-3"');
    expect(html).toContain('Not calculated');
    expect(html).toContain('id="total-ss-4"');
    expect(html).toContain('Not calculated');
  });

  test('renders delete modal structure and delete button metadata', async () => {
    const html = await renderScoringOfficeDashboard();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('Delete scoresheet');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="scoresheet"');
    expect(html).toContain('data-beforeurl="/admin"');
  });

  test('includes runtime script for excelRound formatting and delete endpoint flow', async () => {
    const html = await renderScoringOfficeDashboard();

    expect(html).toContain('const scoreSheets = [{');
    expect(html).toContain("document.getElementById('total-' + scoresheet._id)");
    expect(html).toContain('elem.textContent = excelRound(scoresheet.totalScoreBE, 3);');

    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal'");
    expect(html).toContain("button.getAttribute('data-scoresheetid')");
    expect(html).toContain("fetch('/scoresheets/delete/' + IdToDelete");
    expect(html).toContain('window.location.reload();');
  });
});
