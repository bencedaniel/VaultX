const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('eventdash.ejs', () => {
  const templatePath = path.join(__dirname, '../../views/event/eventdash.ejs');
  let template;

  beforeAll(() => {
    template = fs.readFileSync(templatePath, 'utf-8');
  });

  const render = async (data = {}) => {
    return await ejs.render(template, data, {async: true});
  };

  it('renders the Event manager header', async () => {
    const html = await render({events: []});
    expect(html).toContain('Event manager');
  });

  it('renders the search input and dropdown', async () => {
    const html = await render({events: []});
    expect(html).toContain('type="search"');
    expect(html).toContain('id="search"');
    expect(html).toContain('dropdown-toggle');
    expect(html).toContain('Select column');
  });

  it('renders the Create new event button', async () => {
    const html = await render({events: []});
    expect(html).toContain('href="/admin/event/new"');
    expect(html).toContain('Create new event');
  });

  it('renders the table headers', async () => {
    const html = await render({events: []});
    expect(html).toContain('Name');
    expect(html).toContain('Location');
    expect(html).toContain('Director name');
    expect(html).toContain('Director contact');
    expect(html).toContain('Selected');
  });

  it('renders event rows with correct data', async () => {
    const events = [
      {
        _id: '1',
        EventName: 'Test Event',
        EventLocation: 'Budapest',
        EventDirectorName: 'Kiss Béla',
        EventDirectorContact: '123-456',
        selected: true
      },
      {
        _id: '2',
        EventName: 'Második',
        EventLocation: 'Debrecen',
        EventDirectorName: 'Nagy Anna',
        EventDirectorContact: '987-654',
        selected: false
      }
    ];
    const html = await render({events});
    expect(html).toContain('Test Event');
    expect(html).toContain('Budapest');
    expect(html).toContain('Kiss Béla');
    expect(html).toContain('123-456');
    expect(html).toContain('Yes');
    expect(html).toContain('Második');
    expect(html).toContain('Debrecen');
    expect(html).toContain('Nagy Anna');
    expect(html).toContain('987-654');
    expect(html).toContain('No');
  });

  it('renders action buttons for each event', async () => {
    const events = [{_id: '1', EventName: 'A', EventLocation: 'B', EventDirectorName: 'C', EventDirectorContact: 'D', selected: false}];
    const html = await render({events});
    expect(html).toContain('href="/admin/event/details/1"');
    expect(html).toContain('href="/admin/event/edit/1"');
    expect(html).toContain('data-eventid="1"');
    expect(html).toContain('bi-info-circle');
    expect(html).toContain('bi-pen');
    expect(html).toContain('bi-check');
  });

  it('renders the select modal', async () => {
    const html = await render({events: []});
    expect(html).toContain('id="selectModal"');
    expect(html).toContain('Select event');
    expect(html).toContain('Are you sure you want to select this event?');
    expect(html).toContain('id="confirmSelectButton"');
  });

  it('renders empty table body if no events', async () => {
    const html = await render({events: []});
    // Should not contain any <tr> inside tbody
    const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
    expect(tbodyMatch).toBeTruthy();
    expect(tbodyMatch[1]).not.toContain('<tr>');
  });

  it('renders correct classes for container and table', async () => {
    const html = await render({events: []});
    expect(html).toContain('container my-4 border border-black');
    expect(html).toContain('table table-striped table-hover table-bordered');
  });
});
