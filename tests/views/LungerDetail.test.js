const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('LungerDetail.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/lunger/LungerDetail.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    // Provide defaults for formData, users, selectedEvent
    const defaults = {
      formData: {},
      users: [],
      selectedEvent: {_id: 'ev1'},
    };
    return await ejs.render(template, { ...defaults, ...data }, {async: true});
  };

  it('renders the Lunger details header', async () => {
    const html = await render();
    expect(html).toContain('Lunger details');
  });

  it('renders disabled input fields with formData values', async () => {
    const formData = {
      _id: 'lung1',
      Name: 'Kiss Béla',
      feiid: 'FEI123',
      Gender: 'Male',
      Nationality: 'Hungarian',
    };
    const html = await render({formData});
    expect(html).toContain('value="Kiss Béla"');
    expect(html).toContain('value="FEI123"');
    expect(html).toContain('value="Male"');
    expect(html).toContain('value="Hungarian"');
    expect(html).toContain('disabled');
  });

  it('renders the Incidents section and filter', async () => {
    const html = await render();
    expect(html).toContain('Incidents');
    expect(html).toContain('id="filterCheck"');
    expect(html).toContain('id="IncidentList"');
    expect(html).toContain('id="addIncident"');
  });

  it('renders the Edit lunger button with correct href', async () => {
    const formData = {_id: 'lung1'};
    const html = await render({formData});
    expect(html).toContain('href="/lunger/edit/lung1"');
    expect(html).toMatch(/Edit( |<)/i);
  });

  it('renders the Add Incident modal', async () => {
    const formData = {_id: 'lung1'};
    const html = await render({formData});
    expect(html).toContain('id="IncidentModal"');
    expect(html).toContain('Add Incident');
    expect(html).toContain('incidentType');
    expect(html).toContain('description');
    expect(html).toContain('Incident Type');
  });

  it('renders the View Incident modal', async () => {
    const html = await render();
    expect(html).toContain('id="IncidentViewModal"');
    expect(html).toContain('Incident details');
    expect(html).toContain('incidentTypeContent');
    expect(html).toContain('incidentDescription');
    expect(html).toContain('incidentUser');
    expect(html).toContain('incidentDate');
    expect(html).toContain('eventName');
  });

  it('renders incident data from formData.LungerIncident', async () => {
    const formData = {
      _id: 'lung1',
      LungerIncident: [
        {
          incidentType: 'Injury',
          description: 'Minor injury',
          date: '2024-01-01T12:00:00Z',
          User: 'u1',
          eventID: {_id: 'ev1', EventName: 'Test Event'}
        }
      ]
    };
    const users = [{_id: 'u1', username: 'admin'}];
    const selectedEvent = {_id: 'ev1'};
    const html = await render({formData, users, selectedEvent});
    expect(html).toContain('Injury');
    expect(html).toContain('Minor injury');
    expect(html).toContain('Test Event');
    expect(html).toContain('admin');
  });

  it('renders the container with correct classes', async () => {
    const html = await render();
    expect(html).toContain('container my-4 border border-black');
    expect(html).toContain('bg-primary bg-opacity-10');
  });
});
