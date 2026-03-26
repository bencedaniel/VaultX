import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/errorpage.ejs');

function renderErrorPage(overrides = {}) {
  const data = {
    errorCode: '500',
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/errorpage.ejs', () => {
  test('renders dynamic error code and base error message', async () => {
    const html = await renderErrorPage();

    expect(html).toContain('class="display-3 fw-bold text-danger mb-2"');
    expect(html).toContain('>500<');
  });

  test('renders back to home link with dashboard target', async () => {
    const html = await renderErrorPage();

    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('class="btn btn-outline-dark"');
    expect(html).toContain('Go to Dashboard');
  });

  test('renders custom error code values', async () => {
    const html404 = await renderErrorPage({ errorCode: '404' });
    const html401 = await renderErrorPage({ errorCode: '401' });

    expect(html404).toContain('>404<');
    expect(html401).toContain('>401<');
  });
});
