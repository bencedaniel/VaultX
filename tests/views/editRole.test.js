import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/editRole.ejs');

function renderEditRole(overrides = {}) {
  const data = {
    formData: {
      _id: 'role-1',
      roleName: 'ScoringOffice',
      description: 'Can manage scoring office pages',
      permissions: ['scores.view', 'scores.edit']
    },
    permissions: [
      { name: 'scores.view', displayName: 'Scores View' },
      { name: 'scores.edit', displayName: 'Scores Edit' },
      { name: 'admin.users', displayName: 'Admin Users' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/editRole.ejs', () => {
  test('renders update role title, form action and submit button', async () => {
    const html = await renderEditRole();

    expect(html).toContain('Update Role');
    expect(html).toContain('action="/admin/editRole/role-1"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Update<');
  });

  test('renders roleName and description prefilled from formData', async () => {
    const html = await renderEditRole();

    expect(html).toContain('id="roleName"');
    expect(html).toContain('name="roleName"');
    expect(html).toContain('value="ScoringOffice"');

    expect(html).toContain('id="description"');
    expect(html).toContain('name="description"');
    expect(html).toContain('value="Can manage scoring office pages"');
  });

  test('renders permissions section and all permission options', async () => {
    const html = await renderEditRole();

    expect(html).toContain('Permissions');

    expect(html).toContain('id="perm_scores.view"');
    expect(html).toContain('value="scores.view"');
    expect(html).toContain('Scores View');

    expect(html).toContain('id="perm_scores.edit"');
    expect(html).toContain('value="scores.edit"');
    expect(html).toContain('Scores Edit');

    expect(html).toContain('id="perm_admin.users"');
    expect(html).toContain('value="admin.users"');
    expect(html).toContain('Admin Users');
  });

  test('checks only permissions included in formData.permissions', async () => {
    const html = await renderEditRole();

    expect(html).toMatch(/id="perm_scores.view"[\s\S]*?checked/);
    expect(html).toMatch(/id="perm_scores.edit"[\s\S]*?checked/);
    expect(html).not.toMatch(/id="perm_admin.users"[\s\S]*?checked/);
  });

  test('renders no checked permissions when formData.permissions is empty', async () => {
    const html = await renderEditRole({
      formData: {
        _id: 'role-2',
        roleName: 'Viewer',
        description: 'Read only role',
        permissions: []
      }
    });

    expect(html).not.toMatch(/id="perm_scores.view"[\s\S]*?checked/);
    expect(html).not.toMatch(/id="perm_scores.edit"[\s\S]*?checked/);
    expect(html).not.toMatch(/id="perm_admin.users"[\s\S]*?checked/);
  });

  test('renders empty field values when roleName/description are empty', async () => {
    const html = await renderEditRole({
      formData: {
        _id: 'role-empty',
        roleName: '',
        description: '',
        permissions: []
      }
    });

    expect(html).toMatch(/id="roleName"[^>]*name="roleName"[^>]*placeholder="roleName"[^>]*autocomplete="off"[^>]*value=""/);
    expect(html).toMatch(/id="description"[^>]*name="description"[^>]*placeholder="description"[^>]*autocomplete="off"[^>]*value=""/);
    expect(html).toContain('action="/admin/editRole/role-empty"');
  });

  test('renders no permission checkboxes when permissions list is empty', async () => {
    const html = await renderEditRole({ permissions: [] });

    expect(html).toContain('Permissions');
    expect(html).not.toContain('class="form-check-input"');
    expect(html).not.toContain('name="permissions"');
  });
});
