import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/dailytimetable/editdailytimetable.ejs');

function renderEditDailyTimetable(overrides = {}) {
  const data = {
    formData: {
      _id: 'day-1',
      DayName: 'Saturday',
      DisplayName: 'Final Day',
      Date: new Date('2026-03-21T00:00:00.000Z')
    },
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/dailytimetable/editdailytimetable.ejs', () => {
  test('renders title, form action and submit button', async () => {
    const html = await renderEditDailyTimetable();

    expect(html).toContain('Edit Day');
    expect(html).toContain('action="/dailytimetable/edit/day-1"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Edit Day<');
  });

  test('renders prefilled day name and display name fields', async () => {
    const html = await renderEditDailyTimetable();

    expect(html).toContain('id="DayName"');
    expect(html).toContain('name="DayName"');
    expect(html).toContain('value="Saturday"');

    expect(html).toContain('id="DisplayName"');
    expect(html).toContain('name="DisplayName"');
    expect(html).toContain('value="Final Day"');
  });

  test('formats Date input to yyyy-mm-dd from formData.Date', async () => {
    const html = await renderEditDailyTimetable();

    expect(html).toContain('id="Date"');
    expect(html).toContain('name="Date"');
    expect(html).toContain('value="2026-03-21"');
  });

  test('supports Date value when formData.Date is an ISO string', async () => {
    const html = await renderEditDailyTimetable({
      formData: {
        _id: 'day-2',
        DayName: 'Sunday',
        DisplayName: 'Closing Day',
        Date: '2026-03-22T00:00:00.000Z'
      }
    });

    expect(html).toContain('action="/dailytimetable/edit/day-2"');
    expect(html).toContain('value="2026-03-22"');
  });

  test('renders empty fallback values when formData is missing', async () => {
    const html = await renderEditDailyTimetable({ formData: undefined });

    expect(html).toContain('action="/dailytimetable/edit/"');
    expect(html).toMatch(/id="DayName"\s+name="DayName"\s+placeholder="Day Name"\s+value=""/);
    expect(html).toMatch(/id="DisplayName"\s+name="DisplayName"\s+placeholder="Display Name"\s+value=""/);
    expect(html).toMatch(/id="Date"\s+name="Date"\s+value=""/);
  });

  test('renders empty date when formData.Date is missing', async () => {
    const html = await renderEditDailyTimetable({
      formData: {
        _id: 'day-3',
        DayName: 'NoDate',
        DisplayName: 'No Date Day'
      }
    });

    expect(html).toContain('action="/dailytimetable/edit/day-3"');
    expect(html).toMatch(/id="Date"\s+name="Date"\s+value=""/);
  });
});
