import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/dailytimetable/newttelement.ejs');

function renderNewTTElement(overrides = {}) {
  const data = {
    formData: null,
    days: [
      { _id: 'day-1', DayName: 'Friday', Date: '2026-03-20T00:00:00.000Z' },
      { _id: 'day-2', DayName: 'Saturday', Date: '2026-03-21T00:00:00.000Z' }
    ],
    categorys: [
      { _id: 'cat-1', CategoryDispName: 'Individual' },
      { _id: 'cat-2', CategoryDispName: 'Squad' }
    ],
    judges: [
      { _id: 'j-1', username: 'judgeA' },
      { _id: 'j-2', username: 'judgeB' },
      { _id: 'j-3', username: 'judgeC' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/dailytimetable/newttelement.ejs', () => {
  test('renders form skeleton and required base inputs', async () => {
    const html = await renderNewTTElement();

    expect(html).toContain('action="/dailytimetable/newTTelement/"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('New program element');

    expect(html).toContain('id="Name"');
    expect(html).toContain('name="Name"');
    expect(html).toContain('required');

    expect(html).toContain('id="dailytimetable"');
    expect(html).toContain('name="dailytimetable"');
    expect(html).toContain('Select Day');

    expect(html).toContain('id="StartTimePlanned"');
    expect(html).toContain('type="time"');

    expect(html).toContain('id="judgeInputs"');
    expect(html).toContain('>New program<');
  });

  test('renders day options with hu-HU date formatting', async () => {
    const html = await renderNewTTElement();

    expect(html).toContain('Friday --');
    expect(html).toContain('Saturday --');
    expect(html).toContain('value="day-1"');
    expect(html).toContain('value="day-2"');
  });

  test('selects current day when formData.dailytimetable is a populated object', async () => {
    const html = await renderNewTTElement({
      formData: {
        dailytimetable: { _id: 'day-2' }
      }
    });

    expect(html).toMatch(/<option value="day-2"\s+selected>/);
  });

  test('selects current day when formData.dailytimetable is an id string', async () => {
    const html = await renderNewTTElement({
      formData: {
        dailytimetable: 'day-1'
      }
    });

    expect(html).toMatch(/<option value="day-1"\s+selected>/);
  });

  test('prefills start time from StartTimePlanned and Name from formData', async () => {
    const html = await renderNewTTElement({
      formData: {
        Name: 'Compulsory Round',
        StartTimePlanned: '9:5:00'
      }
    });

    expect(html).toContain('value="Compulsory Round"');
    expect(html).toContain('value="09:05"');
  });

  test('renders categories and checks selected ones from formData.Category', async () => {
    const html = await renderNewTTElement({
      formData: {
        Category: ['cat-2']
      }
    });

    expect(html).toContain('id="cat_cat-1"');
    expect(html).toContain('id="cat_cat-2"');
    expect(html).toContain('Individual');
    expect(html).toContain('Squad');
    expect(html).toMatch(/value="cat-2"[\s\S]*?checked/);
  });

  test('selects TestType, Round and NumberOfJudges when formData provided', async () => {
    const html = await renderNewTTElement({
      formData: {
        TestType: 'Technical Test',
        Round: '2 - Final',
        NumberOfJudges: 4
      }
    });

    expect(html).toMatch(/<option value="Technical Test"\s+selected>/);
    expect(html).toMatch(/<option value="2 - Final"\s+selected>/);
    expect(html).toMatch(/<option value="4"\s+selected>/);
  });

  test('includes judges script bootstrap and unique-option enforcement logic', async () => {
    const html = await renderNewTTElement({
      formData: {
        JudgesList: [
          { JudgeUserID: 'j-1', Table: 'A' },
          { JudgeUserID: 'j-2', Table: 'B' }
        ]
      }
    });

    expect(html).toContain('const judgesList = [{"_id":"j-1","username":"judgeA"}');
    expect(html).toContain('const existingJudges = [{"JudgeUserID":"j-1","Table":"A"},{"JudgeUserID":"j-2","Table":"B"}]');

    expect(html).toContain("numberOfJudgesSelect.addEventListener('change'");
    expect(html).toContain('function updateDisabledOptions()');
    expect(html).toContain('const chosenJudges = new Set');
    expect(html).toContain('const chosenTables = new Set');
    expect(html).toContain('function createNewJudgeSelects(');
    expect(html).toContain("selectJudge.name = `JudgesList[${index}][JudgeUserID]`");
    expect(html).toContain("selectTable.name = `JudgesList[${index}][Table]`");
  });
});
