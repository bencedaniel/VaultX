import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/dailytimetable/newdailytimetable.ejs');

function renderNewDailyTimetable(overrides = {}) {
  const data = {
    selectedEvent: { _id: 'event-1' },
    formData: {
      DayName: 'Sunday',
      DisplayName: 'Closing Day',
      Date: new Date('2026-03-22T00:00:00.000Z')
    },
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/dailytimetable/newdailytimetable.ejs', () => {
  test('renders title, form action and submit button', async () => {
    const html = await renderNewDailyTimetable();

    expect(html).toContain('Add new Day');
    expect(html).toContain('action="/dailytimetable/new/"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>New Day<');
  });

  test('renders hidden selected event field', async () => {
    const html = await renderNewDailyTimetable();

    expect(html).toContain('id="event"');
    expect(html).toContain('name="event"');
    expect(html).toContain('value="event-1"');
    expect(html).toContain('required');
  });

  test('renders prefilled day name and display name', async () => {
    const html = await renderNewDailyTimetable();

    expect(html).toContain('id="DayName"');
    expect(html).toContain('name="DayName"');
    expect(html).toContain('value="Sunday"');

    expect(html).toContain('id="DisplayName"');
    expect(html).toContain('name="DisplayName"');
    expect(html).toContain('value="Closing Day"');
  });

  test('formats Date input to yyyy-mm-dd from formData.Date', async () => {
    const html = await renderNewDailyTimetable();

    expect(html).toContain('id="Date"');
    expect(html).toContain('name="Date"');
    expect(html).toContain('value="2026-03-22"');
  });

  test('supports Date when provided as ISO string', async () => {
    const html = await renderNewDailyTimetable({
      formData: {
        DayName: 'Friday',
        DisplayName: 'Opening Day',
        Date: '2026-03-20T00:00:00.000Z'
      }
    });

    expect(html).toContain('value="2026-03-20"');
  });

  test('renders empty fallback values when formData is missing', async () => {
    const html = await renderNewDailyTimetable({ formData: undefined });

    expect(html).toMatch(/id="DayName"[^>]*name="DayName"[^>]*placeholder="Day Name"[^>]*value=""/);
    expect(html).toMatch(/id="DisplayName"[^>]*name="DisplayName"[^>]*placeholder="Display Name"[^>]*value=""/);
    expect(html).toMatch(/id="Date"[^>]*name="Date"[^>]*value=""/);
  });

  test('renders empty selected event id when selectedEvent is missing', async () => {
    const html = await renderNewDailyTimetable({ selectedEvent: undefined });

    expect(html).toContain('id="event" name="event" required value=""');
  });
});
