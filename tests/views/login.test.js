import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/login.ejs');

function renderLogin(overrides = {}) {
  const data = {
    failMessage: undefined,
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/login.ejs', () => {
  test('renders login form with expected action and required fields', async () => {
    const html = await renderLogin();

    expect(html).toContain('action="/login"');
    expect(html).toContain('method="post"');

    expect(html).toContain('id="username"');
    expect(html).toContain('name="username"');
    expect(html).toContain('type="text"');
    expect(html).toContain('required');

    expect(html).toContain('id="password"');
    expect(html).toContain('name="password"');
    expect(html).toContain('type="password"');

    expect(html).toContain('>Login<');
  });

  test('renders static branding and layout classes', async () => {
    const html = await renderLogin();

    expect(html).toContain('src="/static/VaultXLogo.png"');
    expect(html).toContain('class="card shadow my-5 bg-dark bg-opacity-75"');
    expect(html).toContain('container my-5');
  });

  test('does not render fail toast when failMessage is missing', async () => {
    const html = await renderLogin({ failMessage: undefined });

    expect(html).not.toContain('id="formFailToast"');
    expect(html).not.toContain('class="toast align-items-center text-white bg-danger border-0 show"');
  });

  test('renders fail toast with message when failMessage is provided', async () => {
    const html = await renderLogin({ failMessage: 'Invalid username or password' });

    expect(html).toContain('id="formFailToast"');
    expect(html).toContain('class="toast align-items-center text-white bg-danger border-0 show"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain('aria-atomic="true"');
    expect(html).toContain('Invalid username or password');
    expect(html).toContain('data-bs-dismiss="toast"');
  });
});
