import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/newCard.ejs');

function renderNewCard(overrides = {}) {
  const data = {
    formData: null,
    permissionList: [
      { name: 'admin_dashboard', displayName: 'Admin Dashboard' },
      { name: 'manage_users', displayName: 'Manage Users' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/newCard.ejs', () => {
  test('renders base form, title and submit button', async () => {
    const html = await renderNewCard();

    expect(html).toContain('action="/admin/newCard"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('Add new Dashboard Card');
    expect(html).toContain('>Add Card<');
  });

  test('renders dashboard type dropdown options and hidden field', async () => {
    const html = await renderNewCard();

    expect(html).toContain('Dashboard type');
    expect(html).toContain('val="user">User</li>');
    expect(html).toContain('val="admin">Admin</li>');
    expect(html).toMatch(/name="dashtype"[\s\S]*?value=""/);
  });

  test('prefills dashboard type display and hidden value for user', async () => {
    const html = await renderNewCard({ formData: { dashtype: 'user' } });

    expect(html).toContain('placeholder="Dashboard type"');
    expect(html).toContain('value="User"');
    expect(html).toMatch(/name="dashtype"[\s\S]*?value="user"/);
  });

  test('prefills dashboard type display and hidden value for admin', async () => {
    const html = await renderNewCard({ formData: { dashtype: 'admin' } });

    expect(html).toContain('value="Admin"');
    expect(html).toMatch(/name="dashtype"[\s\S]*?value="admin"/);
  });

  test('renders and prefills priority, title and text fields', async () => {
    const html = await renderNewCard({
      formData: {
        priority: 7,
        title: 'Card title',
        text: 'Card text'
      }
    });

    expect(html).toContain('id="priority"');
    expect(html).toContain('max="100"');
    expect(html).toContain('min="1"');
    expect(html).toContain('value="7"');

    expect(html).toContain('id="title"');
    expect(html).toContain('value="Card title"');

    expect(html).toContain('id="text"');
    expect(html).toContain('value="Card text"');
  });

  test('renders style dropdown options and maps hidden style to display text', async () => {
    const html = await renderNewCard({ formData: { style: 'warning' } });

    expect(html).toContain('val="primary">Primary</li>');
    expect(html).toContain('val="secondary">Secondary</li>');
    expect(html).toContain('val="success">Success</li>');
    expect(html).toContain('val="danger">Danger</li>');
    expect(html).toContain('val="warning">Warning</li>');
    expect(html).toContain('val="info">Info</li>');
    expect(html).toContain('val="dark">Dark</li>');

    expect(html).toContain('value="Warning"');
    expect(html).toMatch(/name="style"[\s\S]*?value="warning"/);
  });

  test('renders permission dropdown from permissionList and preselects display value', async () => {
    const html = await renderNewCard({
      formData: { perm: 'manage_users' },
      permissionList: [
        { name: 'admin_dashboard', displayName: 'Admin Dashboard' },
        { name: 'manage_users', displayName: 'Manage Users' },
        { name: 'manage_roles', displayName: 'Manage Roles' }
      ]
    });

    expect(html).toContain('Admin Dashboard');
    expect(html).toContain('Manage Users');
    expect(html).toContain('Manage Roles');
    expect(html).toContain('value="Manage Users"');
    expect(html).toMatch(/name="perm"[\s\S]*?value="manage_users"/);
  });

  test('includes links container and addLinkInput helper script', async () => {
    const html = await renderNewCard();

    expect(html).toContain('id="linkList"');
    expect(html).toContain('onclick="addLinkInput()"');
    expect(html).toContain('function addLinkInput(href = \'\', label = \'\')');
    expect(html).toContain("hrefInput.name = 'href[]';");
    expect(html).toContain("labelInput.name = 'label[]';");
    expect(html).toContain("btn.textContent = 'Remove';");
  });

  test('renders link preload loop when formData.label is present', async () => {
    const html = await renderNewCard({
      formData: {
        label: ['Docs', 'Support'],
        href: ['/docs', '/support']
      }
    });

    expect(html).toContain('addLinkInput("/docs", "Docs")');
    expect(html).toContain('addLinkInput("/support", "Support")');
  });
});
