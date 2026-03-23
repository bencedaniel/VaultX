import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/editCard.ejs');

function renderEditCard(overrides = {}) {
  const data = {
    formData: {
      _id: 'card-1',
      dashtype: 'user',
      priority: 10,
      style: 'warning',
      perm: 'manage_users',
      title: 'Card title',
      text: 'Card text',
      href: ['/docs', '/support'],
      label: ['Docs', 'Support']
    },
    permissionList: [
      { name: 'admin_dashboard', displayName: 'Admin Dashboard' },
      { name: 'manage_users', displayName: 'Manage Users' },
      { name: 'manage_roles', displayName: 'Manage Roles' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/editCard.ejs', () => {
  test('renders edit form action with card id and submit/preview buttons', async () => {
    const html = await renderEditCard({ formData: { _id: 'card-99' } });

    expect(html).toContain('action="/admin/editCard/card-99"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('Edit Dashboard Card');
    expect(html).toContain('onclick="showCardPopup()"');
    expect(html).toContain('>Preview<');
    expect(html).toContain('>Edit Card<');
  });

  test('renders dashboard type dropdown and maps hidden value to display text', async () => {
    const htmlUser = await renderEditCard({ formData: { _id: 'c1', dashtype: 'user' } });
    const htmlAdmin = await renderEditCard({ formData: { _id: 'c2', dashtype: 'admin' } });

    expect(htmlUser).toContain('value="User"');
    expect(htmlUser).toMatch(/name="dashtype"[\s\S]*?value="user"/);

    expect(htmlAdmin).toContain('value="Admin"');
    expect(htmlAdmin).toMatch(/name="dashtype"[\s\S]*?value="admin"/);

    expect(htmlUser).toContain('val="user">User</li>');
    expect(htmlUser).toContain('val="admin">Admin</li>');
  });

  test('renders style dropdown and selected style display mapping', async () => {
    const html = await renderEditCard({ formData: { _id: 'c3', style: 'danger' } });

    expect(html).toContain('value="Danger"');
    expect(html).toMatch(/name="style"[\s\S]*?value="danger"/);

    expect(html).toContain('val="primary">Primary</li>');
    expect(html).toContain('val="secondary">Secondary</li>');
    expect(html).toContain('val="success">Success</li>');
    expect(html).toContain('val="danger">Danger</li>');
    expect(html).toContain('val="warning">Warning</li>');
    expect(html).toContain('val="info">Info</li>');
    expect(html).toContain('val="dark">Dark</li>');
  });

  test('renders permission dropdown and preselects permission display', async () => {
    const html = await renderEditCard({
      formData: { _id: 'c4', perm: 'manage_roles' },
      permissionList: [
        { name: 'admin_dashboard', displayName: 'Admin Dashboard' },
        { name: 'manage_roles', displayName: 'Manage Roles' }
      ]
    });

    expect(html).toContain('Admin Dashboard');
    expect(html).toContain('Manage Roles');
    expect(html).toContain('value="Manage Roles"');
    expect(html).toMatch(/name="perm"[\s\S]*?value="manage_roles"/);
  });

  test('renders and prefills priority/title/text fields', async () => {
    const html = await renderEditCard({
      formData: {
        _id: 'c5',
        priority: 7,
        title: 'Preview title',
        text: 'Preview text'
      }
    });

    expect(html).toContain('id="priority"');
    expect(html).toContain('max="100"');
    expect(html).toContain('min="1"');
    expect(html).toContain('value="7"');

    expect(html).toContain('id="title"');
    expect(html).toContain('value="Preview title"');

    expect(html).toContain('id="text"');
    expect(html).toContain('value="Preview text"');
  });

  test('renders link list block and addLinkInput helper with EJS preload calls', async () => {
    const html = await renderEditCard({
      formData: {
        _id: 'c6',
        href: ['/a', '/b'],
        label: ['A', 'B']
      }
    });

    expect(html).toContain('id="linkList"');
    expect(html).toContain('onclick="addLinkInput()"');
    expect(html).toContain('function addLinkInput(href = \'\', label = \'\')');
    expect(html).toContain("hrefInput.name = 'href[]';");
    expect(html).toContain("labelInput.name = 'label[]';");
    expect(html).toContain("btn.textContent = 'Remove';");

    expect(html).toContain('addLinkInput("/a", "A")');
    expect(html).toContain('addLinkInput("/b", "B")');
  });

  test('renders preview modal and preview script internals', async () => {
    const html = await renderEditCard();

    expect(html).toContain('id="CardViewModal"');
    expect(html).toContain('id="CardViewModalLabel"');
    expect(html).toContain('id="CardDiv"');
    expect(html).toContain('function showCardPopup()');
    expect(html).toContain("const modal = new bootstrap.Modal(document.getElementById('CardViewModal'))");
    expect(html).toContain("const style = document.getElementById('style').value;");
    expect(html).toContain("const title = document.getElementById('title').value;");
    expect(html).toContain("const text = document.getElementById('text').value;");
    expect(html).toContain('btn-outline-${style}');
    expect(html).toContain('id="CardTitle"');
    expect(html).toContain('id="CardText"');
    expect(html).toContain('id="ButtonDiv"');
  });
});
