import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/admindash.ejs');

function renderAdminDash(overrides = {}) {
  const data = {
    cardsFromDB: [
      {
        perm: 'admin.users',
        style: 'primary',
        title: 'Users',
        text: 'Manage users',
        label: ['User list', 'Create user'],
        href: ['/admin/users', '/admin/new-user']
      },
      {
        perm: 'admin.roles',
        style: 'warning',
        title: 'Roles',
        text: 'Manage roles',
        label: ['Role list'],
        href: ['/admin/roles']
      },
      {
        perm: 'admin.permissions',
        style: 'success',
        title: 'Permissions',
        text: 'Manage permissions',
        label: ['Permission list'],
        href: ['/admin/permissions']
      }
    ],
    rolePermissons: ['admin.users', 'admin.permissions'],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/admindash.ejs', () => {
  test('renders admin dashboard header', async () => {
    const html = await renderAdminDash();

    expect(html).toContain('VaultX Admin Dashboard');
    expect(html).toContain('container my-4');
  });

  test('renders only cards that are allowed by rolePermissons', async () => {
    const html = await renderAdminDash();

    expect(html).toContain('Users');
    expect(html).toContain('Manage users');
    expect(html).toContain('Permissions');
    expect(html).toContain('Manage permissions');

    expect(html).not.toContain('Roles');
    expect(html).not.toContain('Manage roles');
  });

  test('renders multiple links for a card from label and href arrays', async () => {
    const html = await renderAdminDash();

    expect(html).toContain('href="/admin/users"');
    expect(html).toContain('>User list<');
    expect(html).toContain('href="/admin/new-user"');
    expect(html).toContain('>Create user<');
  });

  test('applies dynamic style classes for card and button', async () => {
    const html = await renderAdminDash();

    expect(html).toContain('bg-primary bg-opacity-10');
    expect(html).toContain('btn btn-outline-primary w-100 mb-3');
    expect(html).toContain('bg-success bg-opacity-10');
    expect(html).toContain('btn btn-outline-success w-100 mb-3');
  });

  test('renders no cards when rolePermissons is missing', async () => {
    const html = await renderAdminDash({ rolePermissons: undefined });

    expect(html).not.toContain('Users');
    expect(html).not.toContain('Roles');
    expect(html).not.toContain('Permissions');
  });

  test('renders no cards when rolePermissons is not an array', async () => {
    const html = await renderAdminDash({ rolePermissons: 'admin.users' });

    expect(html).not.toContain('Users');
    expect(html).not.toContain('Manage users');
  });

  test('renders all cards when all permissions are present', async () => {
    const html = await renderAdminDash({
      rolePermissons: ['admin.users', 'admin.roles', 'admin.permissions']
    });

    expect(html).toContain('Users');
    expect(html).toContain('Roles');
    expect(html).toContain('Permissions');
    expect(html).toContain('href="/admin/roles"');
  });
});
