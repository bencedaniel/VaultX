import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/horse/horseDetail.ejs');

function renderHorseDetail(overrides = {}) {
  const data = {
    selectedEvent: { _id: 'event-1' },
    formData: {
      _id: 'horse-1',
      Horsename: 'Thunder',
      feiid: 'FEI-123',
      sex: 'Mare',
      Bdate: '2018-04-05T00:00:00.000Z',
      Nationality: 'HUN',
      HorseStatus: 'Fit',
      BoxNr: [{ boxNumber: 'B12' }],
      HeadNr: [{ headNumber: 'H34' }],
      ResponsiblePersonName: 'John Doe',
      ResponsiblePersonContact: '+3612345678',
      VetCheckStatus: [
        {
          status: 'Passed',
          eventID: { _id: 'event-1', EventName: 'Spring Cup' },
          date: '2026-03-21T12:00:00.000Z'
        },
        {
          status: 'Recheck',
          eventID: { _id: 'event-2', EventName: 'Autumn Cup' },
          date: '2026-03-20T12:00:00.000Z'
        }
      ],
      Notes: [
        {
          note: 'Second note',
          timestamp: '2026-03-21T10:00:00.000Z',
          user: { username: 'judge2' },
          eventID: { _id: 'event-2', EventName: 'Autumn Cup' }
        },
        {
          note: 'First note',
          timestamp: '2026-03-22T10:00:00.000Z',
          user: { username: 'judge1' },
          eventID: { _id: 'event-1', EventName: 'Spring Cup' }
        }
      ]
    },
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/horse/horseDetail.ejs', () => {
  test('renders main disabled horse fields and edit link', async () => {
    const html = await renderHorseDetail();

    expect(html).toContain('>Horse Details<');
    expect(html).toContain('id="Horsename"');
    expect(html).toContain('value="Thunder"');
    expect(html).toContain('id="feiid"');
    expect(html).toContain('value="FEI-123"');
    expect(html).toContain('id="sex"');
    expect(html).toContain('value="Mare"');
    expect(html).toContain('id="Nationality"');
    expect(html).toContain('value="HUN"');
    expect(html).toContain('id="HorseStatus"');
    expect(html).toContain('value="Fit"');
    expect(html).toContain('href="/horse/edit/horse-1"');
  });

  test('renders birthdate in yyyy-mm-dd format', async () => {
    const html = await renderHorseDetail({
      formData: {
        _id: 'horse-2',
        Bdate: '2020-01-02T00:00:00.000Z'
      }
    });

    expect(html).toContain('id="Bdate"');
    expect(html).toContain('value="2020-01-02"');
  });

  test('renders Box/Head fallbacks when values are missing', async () => {
    const html = await renderHorseDetail({
      formData: {
        _id: 'horse-3',
        BoxNr: [],
        HeadNr: []
      }
    });

    expect(html).toContain('id="BoxNr"');
    expect(html).toContain('value="No Box Nr"');
    expect(html).toContain('id="HeadNr"');
    expect(html).toContain('value="No Head Nr"');
  });

  test('renders notes and vet check filter sections with controls', async () => {
    const html = await renderHorseDetail();

    expect(html).toContain('id="filterCheckVet"');
    expect(html).toContain('id="VetCheckActions"');
    expect(html).toContain('id="filterCheck"');
    expect(html).toContain('id="NoteList"');
    expect(html).toContain('id="addNote"');
  });

  test('renders note modals and note form action with horse id', async () => {
    const html = await renderHorseDetail();

    expect(html).toContain('id="NoteModal"');
    expect(html).toContain('id="NoteViewModal"');
    expect(html).toContain('id="NoteModalForm"');
    expect(html).toContain('action="/horse/newNote/horse-1"');
    expect(html).toContain('id="confirmNoteModalButton"');
  });

  test('includes note/vet script helpers and delete endpoint wiring', async () => {
    const html = await renderHorseDetail();

    expect(html).toContain('function addVetCheckInput(status = \'\', event = \'\', timestamp = \'1\')');
    expect(html).toContain('function addUrlInput(value = \'\', timestamp = \'\', user = \'\')');
    expect(html).toContain('function removeNote(parentElement)');
    expect(html).toContain("fetch('/horse/deleteNote/horse-1'");
    expect(html).toContain('function showNotePopup(noteText, timestamp,user)');
    expect(html).toContain('function loadFilteredData()');
    expect(html).toContain('function loadFilteredVetData()');
    expect(html).toContain('let eventId = "event-1"');
    expect(html).toContain('loadFilteredData()');
    expect(html).toContain('loadFilteredVetData()');
  });

  test('embeds serialized notes and vet checks into dataList/vetCheckList', async () => {
    const html = await renderHorseDetail();

    expect(html).toContain('vetCheckList.push({');
    expect(html).toContain('"Passed"');
    expect(html).toContain('"Recheck"');

    expect(html).toContain('dataList.push({');
    expect(html).toContain('"First note"');
    expect(html).toContain('"Second note"');
    expect(html).toContain('"judge1"');
    expect(html).toContain('"judge2"');
  });
});
