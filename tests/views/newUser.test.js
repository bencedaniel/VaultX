import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/newUser.ejs');

function renderNewUser(overrides = {}) {
  const data = {
    formData: {
      username: 'new.user',
      fullname: 'New User',
      password: 'secret123',
      feiid: 'FEI-777',
      role: 'role-2'
    },
    roleList: [
      { _id: 'role-1', roleName: 'Viewer' },
      { _id: 'role-2', roleName: 'Judge' },
      { _id: 'role-3', roleName: 'Admin' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/newUser.ejs', () => {
  test('renders add user form action, title and submit button', async () => {
    const html = await renderNewUser();

    expect(html).toContain('Add new user');
    expect(html).toContain('action="/admin/newUser"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Add<');
  });

  test('renders prefilled user input fields', async () => {
    const html = await renderNewUser();

    expect(html).toContain('id="username"');
    expect(html).toContain('name="username"');
    expect(html).toContain('value="new.user"');

    expect(html).toContain('id="fullname"');
    expect(html).toContain('name="fullname"');
    expect(html).toContain('value="New User"');

    expect(html).toContain('id="password"');
    expect(html).toContain('name="password"');
    expect(html).toContain('type="password"');
    expect(html).toContain('value="secret123"');

    expect(html).toContain('id="feiid"');
    expect(html).toContain('name="feiid"');
    expect(html).toContain('value="FEI-777"');
  });

  test('renders role select options and selects matching role from formData', async () => {
    const html = await renderNewUser();

    expect(html).toContain('id="role"');
    expect(html).toContain('name="role"');

    expect(html).toContain('<option value="role-1" >Viewer</option>');
    expect(html).toContain('<option value="role-2" selected>Judge</option>');
    expect(html).toContain('<option value="role-3" >Admin</option>');
  });

  test('renders no selected role when formData role does not match any option', async () => {
    const html = await renderNewUser({
      formData: {
        username: 'nomatch',
        fullname: 'No Match',
        password: '',
        feiid: '',
        role: 'missing-role'
      }
    });

    expect(html).not.toContain('value="role-1" selected');
    expect(html).not.toContain('value="role-2" selected');
    expect(html).not.toContain('value="role-3" selected');
  });

  test('renders fallback empty values when formData is missing', async () => {
    const html = await renderNewUser({ formData: undefined });

    expect(html).toMatch(/id="username"\s+name="username"\s+placeholder="Username"\s+autocomplete="off"\s+value=""/);
    expect(html).toMatch(/id="fullname"\s+name="fullname"\s+placeholder="Fullname"\s+autocomplete="off"\s+value=""/);
    expect(html).toMatch(/id="password"\s+name="password"\s+placeholder="Password"\s+autocomplete="off"\s+value=""/);
    expect(html).toMatch(/id="feiid"\s+name="feiid"\s+placeholder="feiid"\s+autocomplete="off"\s+value=""/);
  });

  test('renders role select without options when roleList is empty', async () => {
    const html = await renderNewUser({ roleList: [] });

    expect(html).toContain('id="role" name="role"');
    expect(html).not.toContain('<option value="role-1"');
    expect(html).not.toContain('<option value="role-2"');
    expect(html).not.toContain('<option value="role-3"');
  });
});
