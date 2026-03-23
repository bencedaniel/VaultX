import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/dailytimetable/attacheddash.ejs');

function renderAttachedDash(overrides = {}) {
  const data = {
    dailytable: {
      _id: 'day-1',
      DayName: 'Saturday'
    },
    formData: [
      {
        _id: 'tt-2',
        Name: 'Second Program',
        StartTimePlanned: new Date('2026-03-24T10:30:00.000Z'),
        StartTimeReal: null,
        Category: [{ CategoryDispName: 'Senior' }],
        TestType: 'Free Test',
        Round: '1'
      },
      {
        _id: 'tt-1',
        Name: 'First Program',
        StartTimePlanned: new Date('2026-03-24T09:00:00.000Z'),
        StartTimeReal: new Date('2026-03-24T09:05:00.000Z'),
        Category: [{ CategoryDispName: 'Junior' }, { CategoryDispName: 'Children' }],
        TestType: 'Compulsory',
        Round: '2 - Final'
      }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/dailytimetable/attacheddash.ejs', () => {
  test('renders header and top action links with day context', async () => {
    const html = await renderAttachedDash();

    expect(html).toContain('Modify programs on Saturday');
    expect(html).toContain('href="/dailytimetable/dashboard"');
    expect(html).toContain('Back to Day view');
    expect(html).toContain('href="/dailytimetable/newTTelement/day-1"');
    expect(html).toContain('Create New program under Saturday');
  });

  test('renders table headers and row values', async () => {
    const html = await renderAttachedDash();

    expect(html).toContain('<th scope="col">Name</th>');
    expect(html).toContain('<th scope="col">Start Time Planned</th>');
    expect(html).toContain('<th scope="col">Start Time Real</th>');
    expect(html).toContain('<th scope="col">Categories</th>');
    expect(html).toContain('<th scope="col">Test Type</th>');
    expect(html).toContain('<th scope="col">Round</th>');

    expect(html).toContain('>First Program<');
    expect(html).toContain('>Second Program<');
    expect(html).toContain('Junior, Children');
    expect(html).toContain('Senior');
    expect(html).toContain('Compulsory');
    expect(html).toContain('Free Test');
    expect(html).toContain('2 - Final');
    expect(html).toContain('Not started yet');
  });

  test('sorts programs by StartTimePlanned ascending before rendering', async () => {
    const html = await renderAttachedDash({
      formData: [
        {
          _id: 'late',
          Name: 'Late Program',
          StartTimePlanned: new Date('2026-03-24T12:00:00.000Z'),
          StartTimeReal: null,
          Category: [{ CategoryDispName: 'Cat B' }],
          TestType: 'Free Test',
          Round: '1'
        },
        {
          _id: 'early',
          Name: 'Early Program',
          StartTimePlanned: new Date('2026-03-24T08:00:00.000Z'),
          StartTimeReal: null,
          Category: [{ CategoryDispName: 'Cat A' }],
          TestType: 'Compulsory',
          Round: '1'
        }
      ]
    });

    const earlyIdx = html.indexOf('Early Program');
    const lateIdx = html.indexOf('Late Program');

    expect(earlyIdx).toBeGreaterThan(-1);
    expect(lateIdx).toBeGreaterThan(-1);
    expect(earlyIdx).toBeLessThan(lateIdx);
  });

  test('renders manage/edit/save/delete action controls with timetable ids', async () => {
    const html = await renderAttachedDash();

    expect(html).toContain('href="/order/edit/tt-1"');
    expect(html).toContain('href="/order/edit/tt-2"');
    expect(html).toContain('href="/dailytimetable/editTTelement/tt-1"');
    expect(html).toContain('href="/dailytimetable/editTTelement/tt-2"');
    expect(html).toContain('data-timetablepartid="tt-1"');
    expect(html).toContain('data-timetablepartid="tt-2"');
    expect(html).toContain('aria-label="Save time"');
    expect(html).toContain('aria-label="Delete timetable part"');
  });

  test('renders delete and save modals with expected labels', async () => {
    const html = await renderAttachedDash();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('Delete timetable part');
    expect(html).toContain('id="confirmDeleteButton"');

    expect(html).toContain('id="saveModal"');
    expect(html).toContain('Save timetable part starttime');
    expect(html).toContain('id="confirmSaveButton"');
  });

  test('includes delete and save fetch script flows', async () => {
    const html = await renderAttachedDash();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");

    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal', event => {");
    expect(html).toContain("IdToDelete = button.getAttribute('data-timetablepartid');");
    expect(html).toContain("fetch('/dailytimetable/deleteTTelement/' + IdToDelete, {");
    expect(html).toContain("method: 'DELETE'");

    expect(html).toContain("saveModal?.addEventListener('show.bs.modal', event => {");
    expect(html).toContain("IdToSave = button.getAttribute('data-timetablepartid');");
    expect(html).toContain("fetch('/dailytimetable/saveTTelement/' + IdToSave, {");
    expect(html).toContain("method: 'POST'");

    expect(html).toContain('window.location.reload();');
  });

  test('renders empty tbody when no timetable parts are provided', async () => {
    const html = await renderAttachedDash({ formData: [] });

    expect(html).toContain('id="TableBody"');
    expect(html).not.toContain('href="/order/edit/');
    expect(html).not.toContain('href="/dailytimetable/editTTelement/');
    expect(html).not.toContain('data-timetablepartid=');
  });
});
