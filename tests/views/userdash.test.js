import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/userdash.ejs');

function renderUserDash(overrides = {}) {
  const data = {
    users: [
      {
        _id: 'u1',
        username: 'active.user',
        fullname: 'Active User',
        feiid: 'FEI-101',
        active: true,
        role: { roleName: 'Admin' }
      },
      {
        _id: 'u2',
        username: 'inactive.user',
        fullname: 'Inactive User',
        feiid: 'FEI-202',
        active: false,
        role: { roleName: 'Viewer' }
      }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/userdash.ejs', () => {
  test('renders header, search controls and create user button', async () => {
    const html = await renderUserDash();

    expect(html).toContain('User manager');
    expect(html).toContain('id="TableBody"');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');
    expect(html).toContain('href="/admin/newUser"');
    expect(html).toContain('Create new user');
  });

  test('renders table headers and user rows', async () => {
    const html = await renderUserDash();

    expect(html).toContain('id="userTableBody"');
    expect(html).toContain('<th scope="col">Username</th>');
    expect(html).toContain('<th scope="col">Full name</th>');
    expect(html).toContain('<th scope="col">FEI ID</th>');
    expect(html).toContain('<th scope="col">Status</th>');
    expect(html).toContain('<th scope="col">Role</th>');

    expect(html).toContain('>active.user<');
    expect(html).toContain('>Active User<');
    expect(html).toContain('>FEI-101<');
    expect(html).toContain('>Admin<');

    expect(html).toContain('>inactive.user<');
    expect(html).toContain('>Inactive User<');
    expect(html).toContain('>FEI-202<');
    expect(html).toContain('>Viewer<');
  });

  test('renders status text from active boolean', async () => {
    const html = await renderUserDash();

    expect(html).toContain('>Active<');
    expect(html).toContain('>Inactive<');
  });

  test('renders edit link for every user', async () => {
    const html = await renderUserDash();

    expect(html).toContain('href="/admin/editUser/u1"');
    expect(html).toContain('href="/admin/editUser/u2"');
  });

  test('renders deactivate button only for active users', async () => {
    const html = await renderUserDash();

    expect(html).toContain('data-userid="u1"');
    expect(html).not.toContain('data-userid="u2"');
  });

  test('renders deactivate modal and confirm button metadata', async () => {
    const html = await renderUserDash();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('Deactivate user');
    expect(html).toContain('id="deleteConfirmationText"');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="User"');
    expect(html).toContain('data-beforeurl="/admin"');
    expect(html).toContain('>Deactivate<');
  });

  test('includes modal delete script using data-userid and DELETE endpoint', async () => {
    const html = await renderUserDash();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");
    expect(html).toContain('let IdToDelete = null;');
    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal', event => {");
    expect(html).toContain("IdToDelete = button.getAttribute('data-userid');");

    expect(html).toContain("confirmDeleteButton?.addEventListener('click', () => {");
    expect(html).toContain("fetch('/admin/deleteUser/' + IdToDelete, {");
    expect(html).toContain("method: 'DELETE'");
    expect(html).toContain('window.location.reload();');
  });

  test('renders empty tbody when users list is empty', async () => {
    const html = await renderUserDash({ users: [] });

    expect(html).toContain('id="userTableBody"');
    expect(html).not.toContain('href="/admin/editUser/');
    expect(html).not.toContain('data-userid=');
  });
});
