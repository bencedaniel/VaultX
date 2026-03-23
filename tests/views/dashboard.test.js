import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/dashboard.ejs');

function renderDashboard(overrides = {}) {
  const data = {
    cardsFromDB: [
      {
        perm: 'admin.users',
        style: 'primary',
        title: 'Users',
        text: 'Manage users',
        label: ['Open Users', 'New User'],
        href: ['/admin/users', '/admin/users/new']
      },
      {
        perm: 'event.manage',
        style: 'success',
        title: 'Events',
        text: 'Manage events',
        label: ['Open Events'],
        href: ['/event']
      },
      {
        perm: 'scores.view',
        style: 'warning',
        title: 'Scores',
        text: 'View scores',
        label: ['Open Scores'],
        href: ['/scores']
      }
    ],
    rolePermissons: ['admin.users', 'scores.view'],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/dashboard.ejs', () => {
  test('renders dashboard header', async () => {
    const html = await renderDashboard();

    expect(html).toContain('VaultX Dashboard');
    expect(html).toContain('container my-4');
  });

  test('renders only cards allowed by rolePermissons', async () => {
    const html = await renderDashboard();

    expect(html).toContain('Users');
    expect(html).toContain('Manage users');
    expect(html).toContain('Scores');
    expect(html).toContain('View scores');

    expect(html).not.toContain('Events');
    expect(html).not.toContain('Manage events');
  });

  test('renders multiple action buttons from label/href arrays', async () => {
    const html = await renderDashboard();

    expect(html).toContain('href="/admin/users"');
    expect(html).toContain('>Open Users<');
    expect(html).toContain('href="/admin/users/new"');
    expect(html).toContain('>New User<');
  });

  test('applies style class to card container and button outline', async () => {
    const html = await renderDashboard();

    expect(html).toContain('bg-primary bg-opacity-10');
    expect(html).toContain('btn btn-outline-primary w-100 mb-3');
    expect(html).toContain('bg-warning bg-opacity-10');
    expect(html).toContain('btn btn-outline-warning w-100 mb-3');
  });

  test('renders no cards when rolePermissons is missing (defaults to empty array)', async () => {
    const html = await renderDashboard({ rolePermissons: undefined });

    expect(html).not.toContain('Users');
    expect(html).not.toContain('Events');
    expect(html).not.toContain('Scores');
  });

  test('renders no cards when rolePermissons is not an array', async () => {
    const html = await renderDashboard({ rolePermissons: 'admin.users' });

    expect(html).not.toContain('Users');
    expect(html).not.toContain('Manage users');
  });

  test('renders cards when rolePermissons contains all required permissions', async () => {
    const html = await renderDashboard({
      rolePermissons: ['admin.users', 'event.manage', 'scores.view']
    });

    expect(html).toContain('Users');
    expect(html).toContain('Events');
    expect(html).toContain('Scores');
    expect(html).toContain('href="/event"');
  });
});
