import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/permdash.ejs');

function renderPermDash(overrides = {}) {
  const data = {
    permissions: [
      {
        _id: 'p1',
        name: 'admin.users',
        displayName: 'Admin Users',
        attachedURL: [
          { url: '/admin/users', parent: '/admin' },
          { url: '/admin/users/new', parent: '/admin/users' }
        ]
      },
      {
        _id: 'p2',
        name: 'event.manage',
        displayName: 'Event Manage',
        attachedURL: { url: '/event', parent: '/' }
      },
      {
        _id: 'p3',
        name: 'test.zero',
        displayName: 'Test Zero',
        attachedURL: { url: '/zero', parent: '/' }
      }
    ],
    rolepermNumList: [
      { permID: 'p1', Rolecount: 2, Cardcount: 1, Alertcount: 3 },
      { permID: 'p3', Rolecount: 0, Cardcount: 0, Alertcount: 0 }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/permdash.ejs', () => {
  test('renders header, search controls and create button', async () => {
    const html = await renderPermDash();

    expect(html).toContain('Permission manager');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');
    expect(html).toContain('href="/admin/newPermission"');
    expect(html).toContain('Create new permission');
  });

  test('renders table headers and permission rows', async () => {
    const html = await renderPermDash();

    expect(html).toContain('id="TableBody"');
    expect(html).toContain('id="userTableBody"');

    expect(html).toContain('<th scope="col">Name</th>');
    expect(html).toContain('<th scope="col">Display name</th>');
    expect(html).toContain('<th scope="col">URL attached</th>');
    expect(html).toContain('<th scope="col">Roles attached</th>');
    expect(html).toContain('<th scope="col">Cards attached</th>');
    expect(html).toContain('<th scope="col">Alerts attached</th>');

    expect(html).toContain('>admin.users<');
    expect(html).toContain('>Admin Users<');
    expect(html).toContain('>event.manage<');
    expect(html).toContain('>Event Manage<');
  });

  test('renders attachedURL correctly for both array and object forms', async () => {
    const html = await renderPermDash();

    expect(html).toMatch(/\/admin\/users, \/admin\/users\/new/);
    expect(html).toMatch(/>event\.manage</);
    expect(html).toMatch(/>\s*\/event\s*</);
  });

  test('renders Rolecount/Cardcount/Alertcount with fallback to zero', async () => {
    const html = await renderPermDash();

    expect(html).toMatch(/>\s*2\s*</);
    expect(html).toMatch(/>\s*1\s*</);
    expect(html).toMatch(/>\s*3\s*</);

    expect(html).toContain('>event.manage<');
    // Ellenőrizzük, hogy a Test Zero sorban minden count 0 (whitespace-insensitive, bármilyen tag sorrenddel, hiányzó vagy meglévő </td> tagekkel is működik)
    // Elfogadjuk a <td>0</td> vagy <td>0 mintát is, háromszor egymás után
    const zeroRowRegex = /<tr>[\s\S]*?>\s*<td>test.zero<\/td>[\s\S]*?<td>Test Zero<\/td>[\s\S]*?<td>[^<]*<\/td>[\s\S]*?(<td>\s*0\s*(<\/td>)?){3}[\s\S]*?<\/tr>/i;
    expect(html.replace(/\n/g, '')).toMatch(zeroRowRegex);
  });

  test('renders edit/delete actions with permission ids', async () => {
    const html = await renderPermDash();

    expect(html).toContain('href="/admin/editPermission/p1"');
    expect(html).toContain('href="/admin/editPermission/p2"');
    expect(html).toContain('data-roleid="p1"');
    expect(html).toContain('data-roleid="p2"');
    expect(html).toContain('aria-label="Edit permission"');
    expect(html).toContain('aria-label="Delete permission"');
  });

  test('renders delete modal and confirm button metadata', async () => {
    const html = await renderPermDash();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('Delete permission');
    expect(html).toContain('id="deleteConfirmationText"');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="permission"');
    expect(html).toContain('data-beforeurl="/admin"');
  });

  test('includes modal delete script using data-roleid and DELETE endpoint', async () => {
    const html = await renderPermDash();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");
    expect(html).toContain('let IdToDelete = null;');
    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal', event => {");
    expect(html).toContain("IdToDelete = button.getAttribute('data-roleid');");

    expect(html).toContain("confirmDeleteButton?.addEventListener('click', () => {");
    expect(html).toContain("fetch('/admin/deletePermission/' + IdToDelete, {");
    expect(html).toContain("method: 'DELETE'");
    expect(html).toContain('window.location.reload();');
  });

  test('renders empty tbody when permissions list is empty', async () => {
    const html = await renderPermDash({ permissions: [], rolepermNumList: [] });

    expect(html).toContain('id="userTableBody"');
    expect(html).not.toContain('href="/admin/editPermission/');
    expect(html).not.toContain('data-roleid=');
  });
});
