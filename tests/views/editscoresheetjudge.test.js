import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/scoringJudge/editscoresheetjudge.ejs');

function renderEditScoresheetJudge(overrides = {}) {
  const data = {
    scoresheet: {
      _id: 'ss-1',
      inputDatas: [
        { id: 'input-a', value: '5.5' },
        { id: 'input-b', value: '7.0' }
      ],
      Judge: {
        userId: { _id: 'judge-1' }
      }
    },
    scoresheetTemp: {
      _id: 'tmpl-1',
      bgImage: '/static/template.png',
      typeOfScores: 'artistic',
      TestType: 'free test',
      outputFieldList: [
        {
          contentid: 'output-title',
          name: 'Title',
          position: { x: 10, y: 20.1, w: 30 }
        },
        {
          contentid: 'output-event',
          name: 'Event',
          position: { x: 40, y: 50.5, w: 25 }
        }
      ],
      inputFieldList: [
        { id: 'input-a', position: { x: 15, y: 30.2, w: 12 } },
        { id: 'input-b', position: { x: 22, y: 35.9, w: 14 } }
      ]
    },
    entry: {
      _id: 'entry-1',
      teamName: 'Team One',
      vaulter: [
        {
          _id: 'v-1',
          Name: 'Vaulter One',
          Nationality: 'HU',
          ArmNr: [{ eventID: 'event-1', armNumber: '12' }]
        }
      ],
      horse: { Horsename: 'Thunder' },
      lunger: { Name: 'Lunger One' },
      category: {
        Artistic: { CH: 0.2, C1: 0.2, C2: 0.2, C3: 0.2, C4: 0.2 },
        TechArtistic: { CH: 0.25, T1: 0.25, T2: 0.25, T3: 0.25, TechDivider: 10 },
        Free: { R: 1, D: 2, M: 3, E: 4, NumberOfMaxExercises: 6 },
        Horse: { A1: 0.5, A2: 0.3, A3: 0.2 }
      }
    },
    timetablePart: {
      _id: 'tt-1',
      Name: 'Round 1',
      dailytimetable: { Date: '2026-03-20T00:00:00.000Z' },
      StartingOrder: [{ Entry: 'entry-1', Order: 3 }]
    },
    event: {
      _id: 'event-1',
      EventName: 'Spring Cup'
    },
    judgeName: 'Judge Name',
    judgesTable: 'A',
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/scoringJudge/editscoresheetjudge.ejs', () => {
  test('renders form action, template image and submit button', async () => {
    const html = await renderEditScoresheetJudge();

    expect(html).toContain('action="/scoring/office/scoresheet/edit/ss-1"');
    expect(html).toContain('src="/static/template.png"');
    expect(html).toContain('>Submit scores<');
  });

  test('renders output and input fields from template definitions', async () => {
    const html = await renderEditScoresheetJudge();

    expect(html).toContain('id="output-output-title"');
    expect(html).toContain('id="output-output-event"');
    expect(html).toContain('data-type="output"');

    expect(html).toContain('id="input-input-a"');
    expect(html).toContain('id="input-input-b"');
    expect(html).toContain('name="ScoreSheetInput[input-a]"');
    expect(html).toContain('name="ScoreSheetInput[input-b]"');

    expect(html).toContain('value="5.5"');
    expect(html).toContain('value="7.0"');
  });

  test('renders hidden metadata fields correctly', async () => {
    const html = await renderEditScoresheetJudge();

    expect(html).toContain('name="EntryId" value="entry-1"');
    expect(html).toContain('name="TimetablePartId" value="tt-1"');
    expect(html).toContain('name="EventId" value="event-1"');
    expect(html).toContain('name="TemplateId" value="tmpl-1"');
    expect(html).toContain('name="Judge[userId]" value="judge-1"');
    expect(html).toContain('name="Judge[table]" value="A"');
    expect(html).toContain('name="totalScoreFE" id="totalScore" value=""');
  });

  test('includes common runtime script wiring and static scoresheet script include', async () => {
    const html = await renderEditScoresheetJudge();

    expect(html).toContain('function refreshOutputField(id, value)');
    expect(html).toContain('const event = {"_id":"event-1","EventName":"Spring Cup"};');
    expect(html).toContain('const timetablePart = {"_id":"tt-1"');
    expect(html).toContain('const entry = {"_id":"entry-1"');
    expect(html).toContain("const JudgeName = \"Judge Name\"");
    expect(html).toContain("const JudgesTable = \"A\"");
    expect(html).toContain("transformElement(records, 10)");
    expect(html).toContain("transformElement(techrecords, 6.3)");
    expect(html).toContain('<script src="/static/scoresheet-calculations.js"></script>');
  });

  test('renders artistic free test config branch values', async () => {
    const html = await renderEditScoresheetJudge({
      scoresheetTemp: {
        _id: 'tmpl-art',
        bgImage: '/static/t-art.png',
        typeOfScores: 'artistic',
        TestType: 'free test',
        outputFieldList: [],
        inputFieldList: []
      }
    });

    expect(html).toContain('window.scoresheetConfig.artisticCH = 0.2;');
    expect(html).toContain('window.scoresheetConfig.artisticC1 = 0.2;');
    expect(html).toContain('window.scoresheetConfig.artisticC2 = 0.2;');
    expect(html).toContain('window.scoresheetConfig.artisticC3 = 0.2;');
    expect(html).toContain('window.scoresheetConfig.artisticC4 = 0.2;');
  });

  test('renders technical test config branch values', async () => {
    const html = await renderEditScoresheetJudge({
      scoresheetTemp: {
        _id: 'tmpl-tech-test',
        bgImage: '/static/t-tech-test.png',
        typeOfScores: 'artistic',
        TestType: 'technical test',
        outputFieldList: [],
        inputFieldList: []
      }
    });

    expect(html).toContain('window.scoresheetConfig.artistictechCH = 0.25;');
    expect(html).toContain('window.scoresheetConfig.artisticT1 = 0.25;');
    expect(html).toContain('window.scoresheetConfig.artisticT2 = 0.25;');
    expect(html).toContain('window.scoresheetConfig.artisticT3 = 0.25;');
    expect(html).toContain('window.scoresheetConfig.techDivider = 10;');
  });

  test('renders technical free test config branch values', async () => {
    const html = await renderEditScoresheetJudge({
      scoresheetTemp: {
        _id: 'tmpl-tech-free',
        bgImage: '/static/t-tech-free.png',
        typeOfScores: 'technical',
        TestType: 'free test',
        outputFieldList: [],
        inputFieldList: []
      }
    });

    expect(html).toContain('window.scoresheetConfig.Rmultipler = 1;');
    expect(html).toContain('window.scoresheetConfig.Dmultipler = 2;');
    expect(html).toContain('window.scoresheetConfig.Mmultipler = 3;');
    expect(html).toContain('window.scoresheetConfig.Emultipler = 4;');
    expect(html).toContain('window.scoresheetConfig.NumberOfMaxExercises = 6;');
  });

  test('renders horse config values whenever typeOfScores is horse', async () => {
    const html = await renderEditScoresheetJudge({
      scoresheetTemp: {
        _id: 'tmpl-horse',
        bgImage: '/static/t-horse.png',
        typeOfScores: 'horse',
        TestType: 'horse test',
        outputFieldList: [],
        inputFieldList: []
      }
    });

    expect(html).toContain('window.scoresheetConfig.a1percentage = 0.5;');
    expect(html).toContain('window.scoresheetConfig.a2percentage = 0.3;');
    expect(html).toContain('window.scoresheetConfig.a3percentage = 0.2;');
  });
});
