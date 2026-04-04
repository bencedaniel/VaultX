const ejs = require('ejs');
const path = require('path');

describe('vaulterDetail.ejs – Vaulter Details', () => {
  const viewPath = path.join(__dirname, '../../views/vaulter/vaulterDetail.ejs');
  const render = async (formData = {}, users = [], selectedEvent = { _id: 'ev1' }) => {
    return await ejs.renderFile(viewPath, { formData, users, selectedEvent });
  };

  it('renders the main header and container', async () => {
    const html = await render({});
    expect(html).toContain('Vaulter details');
    expect(html).toContain('container my-4');
    expect(html).toContain('form');
  });

  it('renders all input fields with correct values', async () => {
    const formData = {
      _id: 'v1',
      Name: 'Alice',
      feiid: '123',
      gender: 'F',
      Bdate: '2000-01-01T00:00:00.000Z',
      Nationality: 'HUN',
      Status: 'Active',
      ArmNr: [ { armNumber: 'A1' } ],
      VaulterIncident: []
    };
    const html = await render(formData);
    expect(html).toContain('value="Alice"');
    expect(html).toContain('value="123"');
    expect(html).toContain('value="F"');
    expect(html).toContain('value="2000-01-01"');
    expect(html).toContain('value="HUN"');
    expect(html).toContain('value="Active"');
    expect(html).toContain('value="A1"');
  });

  it('renders the Edit vaulter button with correct link', async () => {
    const formData = { _id: 'v2' };
    const html = await render(formData);
    expect(html).toContain('href="/vaulter/edit/v2"');
    expect(html).toContain('Edit vaulter');
  });

  it('renders the incidents section and Add Incident button', async () => {
    const html = await render({});
    expect(html).toContain('Incidents');
    expect(html).toContain('id="addIncident"');
    expect(html).toContain('+ Add Incident');
  });

  it('renders the incident modal and view modal', async () => {
    const html = await render({});
    expect(html).toContain('id="IncidentModal"');
    expect(html).toContain('id="IncidentViewModal"');
    expect(html).toContain('Incident details');
    expect(html).toContain('incidentTypeContent');
    expect(html).toContain('incidentDescription');
  });

  it('renders correct classes for layout and styling', async () => {
    const html = await render({});
    expect(html).toContain('border border-black');
    expect(html).toContain('rounded');
    expect(html).toContain('shadow');
    expect(html).toContain('bg-primary');
  });

  it('includes JS logic for incidents and modals', async () => {
    const html = await render({});
    expect(html).toContain('addIncidentInput');
    expect(html).toContain('removeIncident');
    expect(html).toContain('showIncidentPopup');
    expect(html).toContain('loadFilteredData');
    expect(html).toContain('DOMContentLoaded');
  });

  it('renders incidents from formData.VaulterIncident', async () => {
    const formData = {
      _id: 'v3',
      VaulterIncident: [
        {
          incidentType: 'Injury',
          description: 'Minor injury',
          date: '2024-03-23T10:00:00.000Z',
          User: 'u1',
          eventID: { _id: 'ev1', EventName: 'Event 1' }
        }
      ]
    };
    const users = [ { _id: 'u1', username: 'judge1' } ];
    const selectedEvent = { _id: 'ev1' };
    const html = await render(formData, users, selectedEvent);
    expect(html).toContain('Injury');
    expect(html).toContain('Minor injury');
    expect(html).toContain('Event 1');
    expect(html).toContain('judge1');
  });
});
