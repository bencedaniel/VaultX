const ejs = require('ejs');
const path = require('path');

describe('selfEdit.ejs – Edit Profile', () => {
  const viewPath = path.join(__dirname, '../../views/selfEdit.ejs');
  const render = async (formID = 'testid', formData = null) => {
    return await ejs.renderFile(viewPath, { formID, formData });
  };

  it('renders the main header and container', async () => {
    const html = await render();
    expect(html).toContain('Edit profile');
    expect(html).toContain('container my-4');
    expect(html).toContain('form');
  });

  it('renders the form action with formID', async () => {
    const html = await render('abc123');
    expect(html).toContain('action="/profile/abc123"');
  });

  it('renders the form action with noID fallback', async () => {
    const html = await render(null);
    expect(html).toContain('action="/profile/noID"');
  });

  it('renders all input fields with correct values', async () => {
    const formData = { username: 'user1', fullname: 'User One', feiid: '12345' };
    const html = await render('id1', formData);
    expect(html).toContain('value="user1"');
    expect(html).toContain('value="User One"');
    expect(html).toContain('value="12345"');
  });

  it('renders the change password checkbox and disables password by default', async () => {
    const html = await render();
    expect(html).toContain('id="changePasswordCheckbox"');
    expect(html).toContain('id="password"');
    expect(html).toContain('type="password"');
    expect(html).toContain('Password (Leave blank if not changing)');
    // JS disables password by default
    expect(html).toContain('document.getElementById("password").disabled = true;');
  });

  it('renders the Update button', async () => {
    const html = await render();
    expect(html).toContain('Update');
    expect(html).toContain('btn btn-primary');
  });

  it('renders correct classes for layout and styling', async () => {
    const html = await render();
    expect(html).toContain('border border-black');
    expect(html).toContain('rounded');
    expect(html).toContain('shadow');
    expect(html).toContain('bg-primary');
  });

  it('includes the password enable/disable JS logic', async () => {
    const html = await render();
    expect(html).toContain('document.addEventListener("DOMContentLoaded"');
    expect(html).toContain('changePasswordCheckbox');
    expect(html).toContain('password');
  });
});
