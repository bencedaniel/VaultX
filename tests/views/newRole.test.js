import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/newRole.ejs');

function renderNewRole(overrides = {}) {
  const data = {
    formData: {
      roleName: 'JudgeRole',
      description: 'Can score and view results',
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

describe('views/admin/newRole.ejs', () => {
  test('renders add role form action, title and submit button', async () => {
    const html = await renderNewRole();

    expect(html).toContain('Add new Role');
    expect(html).toContain('action="/admin/newRole"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Add<');
  });

  test('renders roleName and description with prefilled values', async () => {
    const html = await renderNewRole();

    expect(html).toContain('id="roleName"');
    expect(html).toContain('name="roleName"');
    expect(html).toContain('value="JudgeRole"');

    expect(html).toContain('id="description"');
    expect(html).toContain('name="description"');
    expect(html).toContain('value="Can score and view results"');
  });

  test('renders permissions section and all permission items', async () => {
    const html = await renderNewRole();

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

  test('checks permissions included in formData.permissions', async () => {
    const html = await renderNewRole();

    expect(html).toMatch(/id="perm_scores.view"[\s\S]*?checked/);
    expect(html).toMatch(/id="perm_scores.edit"[\s\S]*?checked/);
    expect(html).not.toMatch(/id="perm_admin.users"[\s\S]*?checked/);
  });

  test('renders no checked permissions when formData.permissions is empty', async () => {
    const html = await renderNewRole({
      formData: {
        roleName: 'EmptyRole',
        description: 'No perms yet',
        permissions: []
      }
    });

    expect(html).not.toMatch(/id="perm_scores.view"[\s\S]*?checked/);
    expect(html).not.toMatch(/id="perm_scores.edit"[\s\S]*?checked/);
    expect(html).not.toMatch(/id="perm_admin.users"[\s\S]*?checked/);
  });

  test('renders fallback empty values when formData missing', async () => {
    const html = await renderNewRole({ formData: undefined });

    expect(html).toMatch(/id="roleName"\s+name="roleName"\s+placeholder="roleName"\s+autocomplete="off"\s+value=""/);
    expect(html).toMatch(/id="description"\s+name="description"\s+placeholder="description"\s+autocomplete="off"\s+value=""/);
  });

  test('renders no permission checkboxes when permissions list is empty', async () => {
    const html = await renderNewRole({ permissions: [] });

    expect(html).toContain('Permissions');
    expect(html).not.toContain('class="form-check-input"');
    expect(html).not.toContain('name="permissions"');
  });
});
