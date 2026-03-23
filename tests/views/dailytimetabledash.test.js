import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/dailytimetable/dailytimetabledash.ejs');

function renderDailyTimetableDash(overrides = {}) {
  const data = {
    dailytimetables: [
      {
        _id: 'day-1',
        DayName: 'Friday',
        DisplayName: 'Opening Day',
        Date: new Date('2026-03-20T00:00:00.000Z')
      },
      {
        _id: 'day-2',
        DayName: 'Saturday',
        DisplayName: 'Final Day',
        Date: new Date('2026-03-21T00:00:00.000Z')
      }
    ],
    timetableparts: [
      { dailytimetable: 'day-1' },
      { dailytimetable: 'day-1' },
      { dailytimetable: 'day-2' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/dailytimetable/dailytimetabledash.ejs', () => {
  test('renders header, search controls and create day button', async () => {
    const html = await renderDailyTimetableDash();

    expect(html).toContain('Day Management');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');
    expect(html).toContain('href="/dailytimetable/new"');
    expect(html).toContain('Create New Day');
  });

  test('renders table headers and day rows', async () => {
    const html = await renderDailyTimetableDash();

    expect(html).toContain('id="TableBody"');
    expect(html).toContain('<th scope="col">Day name</th>');
    expect(html).toContain('<th scope="col">Display Name(On print,screen)</th>');
    expect(html).toContain('<th scope="col">Date</th>');
    expect(html).toContain('<th scope="col">No of parts</th>');

    expect(html).toContain('>Friday<');
    expect(html).toContain('>Opening Day<');
    expect(html).toContain('>Saturday<');
    expect(html).toContain('>Final Day<');
  });

  test('counts attached timetable parts per day correctly', async () => {
    const html = await renderDailyTimetableDash();

    const countTwo = (html.match(/<td>\s*2\s*<\/td>/g) || []).length;
    const countOne = (html.match(/<td>\s*1\s*<\/td>/g) || []).length;

    expect(countTwo).toBeGreaterThanOrEqual(1);
    expect(countOne).toBeGreaterThanOrEqual(1);
  });

  test('shows zero count when no parts are attached to a day', async () => {
    const html = await renderDailyTimetableDash({
      dailytimetables: [
        {
          _id: 'day-empty',
          DayName: 'Sunday',
          DisplayName: 'No Parts Day',
          Date: new Date('2026-03-22T00:00:00.000Z')
        }
      ],
      timetableparts: []
    });

    expect(html).toContain('>Sunday<');
    expect(html).toMatch(/<td>\s*0\s*<\/td>/);
  });

  test('renders day action buttons with proper links and ids', async () => {
    const html = await renderDailyTimetableDash();

    expect(html).toContain('href="/dailytimetable/dayparts/day-1"');
    expect(html).toContain('href="/dailytimetable/dayparts/day-2"');
    expect(html).toContain('View attached parts');

    expect(html).toContain('href="/dailytimetable/edit/day-1"');
    expect(html).toContain('href="/dailytimetable/edit/day-2"');

    expect(html).toContain('data-dailytimetableid="day-1"');
    expect(html).toContain('data-dailytimetableid="day-2"');
    expect(html).toContain('aria-label="Delete daily timetable"');
  });

  test('renders delete modal and confirm button metadata', async () => {
    const html = await renderDailyTimetableDash();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('Delete dailytimetable');
    expect(html).toContain('id="deleteConfirmationText"');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="dailytimetable"');
    expect(html).toContain('data-beforeurl="/admin"');
  });

  test('includes delete script with data-dailytimetableid and DELETE endpoint', async () => {
    const html = await renderDailyTimetableDash();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");
    expect(html).toContain('let IdToDelete = null;');
    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal', event => {");
    expect(html).toContain("IdToDelete = button.getAttribute('data-dailytimetableid');");

    expect(html).toContain("confirmDeleteButton?.addEventListener('click', () => {");
    expect(html).toContain("fetch('/dailytimetable/delete/' + IdToDelete, {");
    expect(html).toContain("method: 'DELETE'");
    expect(html).toContain('window.location.reload();');
  });

  test('renders empty tbody when there are no days', async () => {
    const html = await renderDailyTimetableDash({ dailytimetables: [], timetableparts: [] });

    expect(html).toContain('id="TableBody"');
    expect(html).not.toContain('href="/dailytimetable/dayparts/');
    expect(html).not.toContain('href="/dailytimetable/edit/');
    expect(html).not.toContain('data-dailytimetableid=');
  });
});
