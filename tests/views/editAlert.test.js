import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/alert/editAlert.ejs');

function renderEditAlert(overrides = {}) {
  const data = {
    formData: {
      _id: 'alert-1',
      title: 'System maintenance',
      description: 'Short service pause',
      permission: 'scores.view',
      style: 'warning',
      active: true,
      reappear: 20
    },
    permissionList: [
      { name: 'scores.view', displayName: 'Scores View' },
      { name: 'event.manage', displayName: 'Event Manage' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/alert/editAlert.ejs', () => {
  test('renders edit form action with alert id and base values', async () => {
    const html = await renderEditAlert();

    expect(html).toContain('action="/alerts/edit/alert-1"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('Edit alert');

    expect(html).toContain('id="title"');
    expect(html).toContain('name="title"');
    expect(html).toContain('value="System maintenance"');

    expect(html).toContain('id="description"');
    expect(html).toContain('name="description"');
    expect(html).toContain('value="Short service pause"');

    expect(html).toContain('id="reappear"');
    expect(html).toContain('name="reappear"');
    expect(html).toContain('value="20"');

    expect(html).toContain('>Edit alert<');
  });

  test('renders permission searchable list and maps selected permission display text', async () => {
    const html = await renderEditAlert();

    expect(html).toContain('placeholder="Search permission"');
    expect(html).toContain('value="Scores View"');
    expect(html).toMatch(/type="hidden"\s+class="searchable-hidden"\s+name="permission"\s*value="scores.view"/);

    expect(html).toContain('class="list-group-item list-group-item-action searchable-item" val="scores.view" >Scores View</li>');
    expect(html).toContain('class="list-group-item list-group-item-action searchable-item" val="event.manage" >Event Manage</li>');
  });

  test('maps style key to edit display label and sets hidden style value', async () => {
    const html = await renderEditAlert({
      formData: {
        _id: 'alert-2',
        title: 'Primary blocked',
        description: 'Cannot save primary',
        permission: 'event.manage',
        style: 'primary',
        active: false,
        reappear: 10
      }
    });

    expect(html).toContain('placeholder="Search Style"');
    expect(html).toContain('Primary (save with this option not allowed)');
    expect(html).toMatch(/type="hidden"\s+class="searchable-hidden"\s+name="style"\s+id="style"\s*value="primary"/);
  });

  test('falls back to raw style text when style is not in styleDisplayMap', async () => {
    const html = await renderEditAlert({
      formData: {
        _id: 'alert-3',
        title: 'Custom style',
        description: 'Unknown style value',
        permission: 'scores.view',
        style: 'custom-style',
        active: false,
        reappear: 8
      }
    });

    expect(html).toContain('value="custom-style"');
    expect(html).toMatch(/name="style"\s+id="style"\s*value="custom-style"/);
  });

  test('renders only allowed style options on edit page', async () => {
    const html = await renderEditAlert();

    expect(html).toContain('val="success">Success</li>');
    expect(html).toContain('val="danger">Danger</li>');
    expect(html).toContain('val="warning">Warning</li>');
    expect(html).toContain('val="dark">Dark</li>');

    expect(html).not.toContain('val="primary">Primary</li>');
    expect(html).not.toContain('val="secondary">Secondary</li>');
    expect(html).not.toContain('val="info">Info</li>');
  });

  test('renders active status selected for both true and false branches', async () => {
    const htmlTrue = await renderEditAlert();
    expect(htmlTrue).toMatch(/<option value="true"\s+selected>Active<\/option>/);

    const htmlFalse = await renderEditAlert({
      formData: {
        _id: 'alert-4',
        title: 'Inactive alert',
        description: 'Disabled',
        permission: 'event.manage',
        style: 'dark',
        active: false,
        reappear: 60
      }
    });
    expect(htmlFalse).toMatch(/<option value="false"\s+selected>Inactive<\/option>/);
  });

  test('renders empty defaults when formData is missing', async () => {
    const html = await renderEditAlert({ formData: undefined });

    expect(html).toContain('action="/alerts/edit/"');
    expect(html).toMatch(/id="title"\s+name="title"\s+placeholder="Title"\s*value=""/);
    expect(html).toMatch(/id="description"\s+name="description"\s+placeholder="Description"\s*value=""/);
    expect(html).toMatch(/type="hidden"\s+class="searchable-hidden"\s+name="permission"\s*value=""/);
    expect(html).toMatch(/type="hidden"\s+class="searchable-hidden"\s+name="style"\s+id="style"\s*value=""/);
  });
});
