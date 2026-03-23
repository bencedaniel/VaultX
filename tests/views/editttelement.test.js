import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/dailytimetable/editttelement.ejs');

function renderEditTTElement(overrides = {}) {
  const data = {
    formData: {
      _id: 'part-1',
      Name: 'Compulsory Program',
      dailytimetable: { _id: 'day-2' },
      StartTimePlanned: '9:5:00',
      Category: ['cat-2'],
      TestType: 'Technical Test',
      Round: '2 - Final',
      NumberOfJudges: 4,
      JudgesList: [
        { JudgeUserID: 'j-1', Table: 'A' },
        { JudgeUserID: 'j-2', Table: 'B' }
      ]
    },
    days: [
      { _id: 'day-1', DayName: 'Friday', Date: new Date('2026-03-20T00:00:00.000Z') },
      { _id: 'day-2', DayName: 'Saturday', Date: new Date('2026-03-21T00:00:00.000Z') }
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

describe('views/dailytimetable/editttelement.ejs', () => {
  test('renders edit form action with element id and base fields', async () => {
    const html = await renderEditTTElement();

    expect(html).toContain('action="/dailytimetable/editTTelement/part-1"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('Edit program element');

    expect(html).toContain('id="Name"');
    expect(html).toContain('value="Compulsory Program"');
    expect(html).toContain('id="dailytimetable"');
    expect(html).toContain('id="StartTimePlanned"');
    expect(html).toContain('type="time"');
    expect(html).toContain('>Edit program<');
  });

  test('renders day options and selects the current parent day', async () => {
    const html = await renderEditTTElement();

    expect(html).toContain('value="day-1"');
    expect(html).toContain('value="day-2"');
    expect(html).toMatch(/<option value="day-2"\s+selected>/);
  });

  test('normalizes StartTimePlanned to HH:mm format', async () => {
    const html = await renderEditTTElement({
      formData: {
        _id: 'part-2',
        Name: 'Free Program',
        dailytimetable: { _id: 'day-1' },
        StartTimePlanned: '7:3:00',
        Category: [],
        TestType: 'Free Test',
        Round: '1',
        NumberOfJudges: 2,
        JudgesList: []
      }
    });

    expect(html).toContain('value="07:03"');
  });

  test('renders categories and checks selected Category values', async () => {
    const html = await renderEditTTElement();

    expect(html).toContain('id="cat_cat-1"');
    expect(html).toContain('id="cat_cat-2"');
    expect(html).toContain('Individual');
    expect(html).toContain('Squad');
    expect(html).toMatch(/value="cat-2"[\s\S]*?checked/);
  });

  test('selects TestType, Round and NumberOfJudges from formData', async () => {
    const html = await renderEditTTElement();

    expect(html).toMatch(/<option value="Technical Test"\s+selected>/);
    expect(html).toMatch(/<option value="2 - Final"\s+selected>/);
    expect(html).toMatch(/<option value="4"\s+selected>/);
  });

  test('includes judge script bootstrap and existing judges initialization', async () => {
    const html = await renderEditTTElement();

    expect(html).toContain('const judgesList = [{"_id":"j-1","username":"judgeA"}');
    expect(html).toContain('const existingJudges = [{"JudgeUserID":"j-1","Table":"A"},{"JudgeUserID":"j-2","Table":"B"}]');

    expect(html).toContain("numberOfJudgesSelect.addEventListener('change'");
    expect(html).toContain("document.addEventListener('DOMContentLoaded', () => {");
    expect(html).toContain('if (existingJudges.length) {');
    expect(html).toContain('numberOfJudgesSelect.value = existingJudges.length;');
    expect(html).toContain('createNewJudgeSelects(judgesList, el.JudgeUserID, existingJudges.length, el.Table, idx);');
  });

  test('includes unique-selection enforcement for judges and tables', async () => {
    const html = await renderEditTTElement();

    expect(html).toContain('function updateDisabledOptions()');
    expect(html).toContain('const chosenJudges = new Set');
    expect(html).toContain('const chosenTables = new Set');
    expect(html).toContain('opt.disabled = chosenJudges.has(opt.value);');
    expect(html).toContain('opt.disabled = chosenTables.has(opt.value);');
  });

  test('includes createNewJudgeSelects builder function with indexed names', async () => {
    const html = await renderEditTTElement();

    expect(html).toContain('function createNewJudgeSelects(');
    expect(html).toContain("selectJudge.name = `JudgesList[${index}][JudgeUserID]`");
    expect(html).toContain("selectTable.name = `JudgesList[${index}][Table]`");
    expect(html).toContain("const tables = ['A','B','C','D','E','F','G','H'];");
    expect(html).toContain("selectJudge.addEventListener('change', updateDisabledOptions);");
    expect(html).toContain("selectTable.addEventListener('change', updateDisabledOptions);");
  });
});
