import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/alert/newAlert.ejs');

function renderNewAlert(overrides = {}) {
  const data = {
    formData: {
      title: 'Schedule update',
      description: 'Program changed for Sunday',
      perm: 'event.manage',
      style: 'warning',
      active: false,
      reappear: 15
    },
    permissionList: [
      { name: 'event.manage', displayName: 'Event Manage' },
      { name: 'scores.view', displayName: 'Scores View' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/alert/newAlert.ejs', () => {
  test('renders add alert form and base fields', async () => {
    const html = await renderNewAlert();

    expect(html).toContain('action="/alerts/new"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('Add new alert');

    expect(html).toContain('id="title"');
    expect(html).toContain('name="title"');
    expect(html).toContain('value="Schedule update"');

    expect(html).toContain('id="description"');
    expect(html).toContain('name="description"');
    expect(html).toContain('value="Program changed for Sunday"');

    expect(html).toContain('id="reappear"');
    expect(html).toContain('name="reappear"');
    expect(html).toContain('value="15"');

    expect(html).toContain('>Add alert<');
  });

  test('renders permission searchable dropdown list items', async () => {
    const html = await renderNewAlert();

    expect(html).toContain('Search permission');
    expect(html).toMatch(/class\s*=\s*"[^"]*searchable-list[^"]*"/);
    expect(html).toMatch(/class="list-group-item list-group-item-action searchable-item" val="event.manage"\s*>\s*Event Manage<\/li>/);
    expect(html).toMatch(/class="list-group-item list-group-item-action searchable-item" val="scores.view"\s*>\s*Scores View<\/li>/);
  });

  test('prefills permission display input and hidden permission value from formData', async () => {
    const html = await renderNewAlert();

    expect(html).toContain('placeholder="Search permission"');
    expect(html).toContain('value="Event Manage"');
    expect(html).toMatch(/<input[^>]*type="hidden"[^>]*class="searchable-hidden"[^>]*name="permission"[^>]*value="event\.manage"[^>]*>/);
  });

  test('maps style value to display text and sets hidden style value', async () => {
    const html = await renderNewAlert();

    expect(html).toContain('placeholder="Search Style"');
    expect(html).toContain('value="Warning"');
    expect(html).toMatch(/<input[^>]*type="hidden"[^>]*class="searchable-hidden"[^>]*name="style"[^>]*id="style"[^>]*value="warning"[^>]*>/);

    expect(html).toContain('val="primary">Primary</li>');
    expect(html).toContain('val="secondary">Secondary</li>');
    expect(html).toContain('val="success">Success</li>');
    expect(html).toContain('val="danger">Danger</li>');
    expect(html).toContain('val="warning">Warning</li>');
    expect(html).toContain('val="info">Info</li>');
    expect(html).toContain('val="dark">Dark</li>');
  });

  test('falls back to raw style text when style key is not in map', async () => {
    const html = await renderNewAlert({
      formData: {
        title: 'Custom style alert',
        description: 'Unknown style',
        perm: 'scores.view',
        style: 'customStyle',
        active: true,
        reappear: 30
      }
    });

    expect(html).toContain('placeholder="Search Style"');
    expect(html).toContain('value="customStyle"');
    expect(html).toMatch(/<input[^>]*name="style"[^>]*id="style"[^>]*value="customStyle"[^>]*>/);
  });

  test('renders active status selected false and true branches', async () => {
    const htmlFalse = await renderNewAlert();
    expect(htmlFalse).toMatch(/<option value="false"\s+selected>Inactive<\/option>/);

    const htmlTrue = await renderNewAlert({
      formData: {
        title: 'Active alert',
        description: 'Visible now',
        perm: 'event.manage',
        style: 'success',
        active: true,
        reappear: 5
      }
    });
    expect(htmlTrue).toMatch(/<option value="true"\s+selected>Active<\/option>/);
  });

  test('renders empty defaults when formData is missing', async () => {
    const html = await renderNewAlert({ formData: undefined });

    expect(html).toMatch(/id="title"[^>]*name="title"[^>]*placeholder="Title"[^>]*value=""/);
    expect(html).toMatch(/id="description"[^>]*name="description"[^>]*placeholder="Description"[^>]*value=""/);
    expect(html).toMatch(/<input[^>]*type="hidden"[^>]*class="searchable-hidden"[^>]*name="permission"[^>]*value=""[^>]*>/);
    expect(html).toMatch(/<input[^>]*type="hidden"[^>]*class="searchable-hidden"[^>]*name="style"[^>]*id="style"[^>]*value=""[^>]*>/);
  });
});
