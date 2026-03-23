import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/editUser.ejs');

function renderEditUser(overrides = {}) {
  const data = {
    formData: {
      _id: 'user-1',
      username: 'john.doe',
      fullname: 'John Doe',
      feiid: 'FEI-12345',
      active: true,
      role: 'role-2'
    },
    roleList: [
      { _id: 'role-1', roleName: 'Viewer' },
      { _id: 'role-2', roleName: 'Scoring Office' },
      { _id: 'role-3', roleName: 'Admin' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/editUser.ejs', () => {
  test('renders edit form action and submit button', async () => {
    const html = await renderEditUser();

    expect(html).toContain('Edit user');
    expect(html).toContain('action="/admin/editUser/user-1"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Update<');
  });

  test('renders prefilled user fields except password', async () => {
    const html = await renderEditUser();

    expect(html).toContain('id="username"');
    expect(html).toContain('name="username"');
    expect(html).toContain('value="john.doe"');

    expect(html).toContain('id="fullname"');
    expect(html).toContain('name="fullname"');
    expect(html).toContain('value="John Doe"');

    expect(html).toContain('id="feiid"');
    expect(html).toContain('name="feiid"');
    expect(html).toContain('value="FEI-12345"');

    expect(html).toContain('id="password"');
    expect(html).toContain('name="password"');
    expect(html).toContain('type="password"');
    expect(html).toContain('value=""');
    expect(html).toContain('Password (Leave blank if not changing)');
  });

  test('selects active status when formData.active is true', async () => {
    const html = await renderEditUser();

    expect(html).toMatch(/<option value="true"\s+selected>Active<\/option>/);
    expect(html).not.toMatch(/<option value="false"\s+selected>Inactive<\/option>/);
  });

  test('selects inactive status when formData.active is false', async () => {
    const html = await renderEditUser({
      formData: {
        _id: 'user-2',
        username: 'jane.doe',
        fullname: 'Jane Doe',
        feiid: 'FEI-888',
        active: false,
        role: 'role-1'
      }
    });

    expect(html).toMatch(/<option value="false"\s+selected>Inactive<\/option>/);
    expect(html).not.toMatch(/<option value="true"\s+selected>Active<\/option>/);
  });

  test('renders role options and selects matching role', async () => {
    const html = await renderEditUser();

    expect(html).toContain('id="role"');
    expect(html).toContain('name="role"');

    expect(html).toContain('<option value="role-1" >Viewer</option>');
    expect(html).toContain('<option value="role-2" selected>Scoring Office</option>');
    expect(html).toContain('<option value="role-3" >Admin</option>');
  });

  test('renders no selected role when formData role does not match roleList', async () => {
    const html = await renderEditUser({
      formData: {
        _id: 'user-3',
        username: 'nomatch',
        fullname: 'No Match',
        feiid: 'FEI-000',
        active: true,
        role: 'role-x'
      }
    });

    expect(html).not.toContain('value="role-1" selected');
    expect(html).not.toContain('value="role-2" selected');
    expect(html).not.toContain('value="role-3" selected');
  });

  test('renders fallback empty values when formData missing', async () => {
    const html = await renderEditUser({ formData: undefined });

    expect(html).toContain('action="/admin/editUser/"');
    expect(html).toMatch(/id="username"[^>]*name="username"[^>]*placeholder="Username"[^>]*autocomplete="off"[^>]*value=""/);
    expect(html).toMatch(/id="fullname"[^>]*name="fullname"[^>]*placeholder="Fullname"[^>]*autocomplete="off"[^>]*value=""/);
    expect(html).toMatch(/id="feiid"[^>]*name="feiid"[^>]*placeholder="feiid"[^>]*autocomplete="off"[^>]*value=""/);
  });

  test('renders role select without options when roleList is empty', async () => {
    const html = await renderEditUser({ roleList: [] });

    expect(html).toContain('id="role" name="role"');
    expect(html).not.toContain('<option value="role-1"');
    expect(html).not.toContain('<option value="role-2"');
    expect(html).not.toContain('<option value="role-3"');
  });
});
