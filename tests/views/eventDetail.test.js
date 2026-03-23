import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/event/EventDetail.ejs');

function renderEventDetail(overrides = {}) {
  const data = {
    formData: {
      _id: 'event-1',
      EventName: 'World Cup Budapest',
      EventLocation: 'Budapest',
      EventDirectorName: 'John Director',
      EventDirectorContact: '+361234567',
      AssignedOfficials: [
        {
          name: 'Anna Smith',
          role: 'Scoring Office',
          contact: 'anna@example.com',
          userID: 'u-1'
        }
      ]
    },
    users: [
      { _id: 'u-1', username: 'anna' },
      { _id: 'u-2', username: 'bela' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/event/EventDetail.ejs', () => {
  test('renders edit form action with event id and readonly event fields', async () => {
    const html = await renderEventDetail();

    expect(html).toContain('action="/event/edit/event-1"');
    expect(html).toContain('method="POST"');

    expect(html).toContain('id="EventName"');
    expect(html).toContain('value="World Cup Budapest"');
    expect(html).toContain('id="EventLocation"');
    expect(html).toContain('value="Budapest"');
    expect(html).toContain('id="EventDirectorName"');
    expect(html).toContain('value="John Director"');
    expect(html).toContain('id="EventDirectorContact"');
    expect(html).toContain('value="+361234567"');

    expect(html).toContain('id="EventName" name="EventName"');
    expect(html).toContain('required disabled');
  });

  test('renders hidden save button and responsible person controls', async () => {
    const html = await renderEventDetail();

    expect(html).toContain('id="ResponsiblePersonList"');
    expect(html).toContain('id="addResponsiblePerson"');
    expect(html).toContain('+ Add Responsible person');
    expect(html).toContain('btn btn-primary w-100 d-none');
    expect(html).toContain('Save Changes');
  });

  test('renders add responsible person modal with dynamic action and user options', async () => {
    const html = await renderEventDetail();

    expect(html).toContain('id="ResponsiblePersonModal"');
    expect(html).toContain('id="ResponsiblePersonModalForm"');
    expect(html).toContain('action="/admin/event/addResponsiblePerson/event-1"');
    expect(html).toContain('id="confirmResponsiblePersonModalButton"');

    expect(html).toContain('<option value="u-1">anna</option>');
    expect(html).toContain('<option value="u-2">bela</option>');
  });

  test('renders view responsible person modal placeholders', async () => {
    const html = await renderEventDetail();

    expect(html).toContain('id="ResponsiblePersonViewModal"');
    expect(html).toContain('id="Name"');
    expect(html).toContain('id="Role"');
    expect(html).toContain('id="Contact"');
    expect(html).toContain('id="UserID"');
    expect(html).toContain('Responsible person details');
  });

  test('includes add modal submit script with fetch POST and URLSearchParams', async () => {
    const html = await renderEventDetail();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");
    expect(html).toContain("confirmResponsiblePersonModalButton?.addEventListener('click', () => {");
    expect(html).toContain("fetch(ResponsiblePersonForm?.getAttribute('action'), {");
    expect(html).toContain("method: 'POST'");
    expect(html).toContain("'Content-Type': 'application/x-www-form-urlencoded'");
    expect(html).toContain('new URLSearchParams({');
    expect(html).toContain("}).then(() => window.location.reload());");
  });

  test('includes removeResponsiblePerson delete endpoint with event id', async () => {
    const html = await renderEventDetail();

    expect(html).toContain('function removeResponsiblePerson(parentElement) {');
    expect(html).toContain("fetch('/admin/event/deleteResponsiblePerson/event-1', {");
    expect(html).toContain("method: 'DELETE'");
    expect(html).toContain("headers: { 'Content-Type': 'application/json' }");
    expect(html).toContain('userID: parentElement.dataset.userid');
  });

  test('renders AssignedOfficials bootstrap calls with matched username', async () => {
    const html = await renderEventDetail();

    expect(html.replace(/\s+/g, '')).toMatch(/addResponsiblePersonInput\("AnnaSmith","ScoringOffice","anna@example.com","u-1--anna"\)/);
  });

  test('falls back to Unknown username when assigned official user is not found', async () => {
    const html = await renderEventDetail({
      formData: {
        _id: 'event-2',
        EventName: 'Fallback Event',
        EventLocation: 'Debrecen',
        EventDirectorName: 'Director 2',
        EventDirectorContact: '+362212345',
        AssignedOfficials: [
          {
            name: 'Missing User',
            role: 'Official',
            contact: 'missing@example.com',
            userID: 'u-99'
          }
        ]
      },
      users: [{ _id: 'u-1', username: 'anna' }]
    });

    expect(html.replace(/\s+/g, '')).toMatch(/addResponsiblePersonInput\("MissingUser","Official","missing@example.com","u-99--Unknown"\)/);
  });
});
