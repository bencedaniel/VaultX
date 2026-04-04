import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/roledash.ejs');

function renderRoleDash(overrides = {}) {
  const data = {
    roles: [
      {
        _id: 'r1',
        roleName: 'Scoring Office',
        permissions: ['scores.view', 'scores.edit'],
        description: 'Handles scoring operations'
      },
      {
        _id: 'r2',
        roleName: 'Viewer',
        permissions: 'results.view',
        description: 'Read-only role'
      }
    ],
    rolenumlist: [
      { roleID: 'r1', count: 4 }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/roledash.ejs', () => {
  test('renders header, search area and create role button', async () => {
    const html = await renderRoleDash();

    expect(html).toContain('Role manager');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');
    expect(html).toContain('href="/admin/newRole"');
    expect(html).toContain('Create new role');
  });

  test('renders table headers and role rows', async () => {
    const html = await renderRoleDash();

    expect(html).toContain('id="TableBody"');
    expect(html).toContain('id="userTableBody"');

    expect(html).toContain('<th scope="col">Name</th>');
    expect(html).toContain('<th scope="col">Permissions</th>');
    expect(html).toContain('<th scope="col">Description</th>');
    expect(html).toContain('<th scope="col">Number of users</th>');

    expect(html).toContain('>Scoring Office<');
    expect(html).toContain('>Handles scoring operations<');
    expect(html).toContain('>Viewer<');
    expect(html).toContain('>Read-only role<');
  });

  test('renders permissions as joined string for array and raw value for non-array', async () => {
    const html = await renderRoleDash();

    expect(html).toContain('scores.view, scores.edit');
    expect(html).toMatch(/>\s*results\.view\s*</);
  });

  test('renders user count from rolenumlist with fallback to zero', async () => {
    const html = await renderRoleDash();

    expect(html).toMatch(/>\s*4\s*</);
    expect(html).toMatch(/<td>\s*0\s*<\/td>/);
  });

  test('renders edit and delete actions with role id bindings', async () => {
    const html = await renderRoleDash();

    expect(html).toContain('href="/admin/editRole/r1"');
    expect(html).toContain('href="/admin/editRole/r2"');
    expect(html).toContain('data-roleid="r1"');
    expect(html).toContain('data-roleid="r2"');
    expect(html).toContain('aria-label="Edit role"');
    expect(html).toContain('aria-label="Delete role"');
  });

  test('renders delete modal and confirm button metadata', async () => {
    const html = await renderRoleDash();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('Delete role');
    expect(html).toContain('id="deleteConfirmationText"');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="role"');
    expect(html).toContain('data-beforeurl="/admin"');
  });

  test('includes delete script with show.bs.modal binding and DELETE endpoint', async () => {
    const html = await renderRoleDash();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");
    expect(html).toContain('let IdToDelete = null;');
    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal', event => {");
    expect(html).toContain("IdToDelete = button.getAttribute('data-roleid');");

    expect(html).toContain("confirmDeleteButton?.addEventListener('click', () => {");
    expect(html).toContain("fetch('/admin/deleteRole/' + IdToDelete, {");
    expect(html).toContain("method: 'DELETE'");
    expect(html).toContain('window.location.reload();');
  });

  test('renders empty tbody when roles list is empty', async () => {
    const html = await renderRoleDash({ roles: [], rolenumlist: [] });

    expect(html).toContain('id="userTableBody"');
    expect(html).not.toContain('href="/admin/editRole/');
    expect(html).not.toContain('data-roleid=');
  });
});
