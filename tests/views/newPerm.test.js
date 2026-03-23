import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/newPerm.ejs');

function renderNewPerm(overrides = {}) {
  const data = {
    formData: {
      name: 'admin.users.write',
      displayName: 'Admin Users Write',
      attachedURL: [
        { url: '/admin/users', parent: '/admin' },
        { url: '/admin/users/new', parent: '/admin/users' }
      ]
    },
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/newPerm.ejs', () => {
  test('renders add permission form action, title and submit button', async () => {
    const html = await renderNewPerm();

    expect(html).toContain('Add new Permission');
    expect(html).toContain('action="/admin/newPermission"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Add<');
  });

  test('renders name and displayName fields with prefilled values', async () => {
    const html = await renderNewPerm();

    expect(html).toContain('id="name"');
    expect(html).toContain('name="name"');
    expect(html).toContain('value="admin.users.write"');

    expect(html).toContain('id="displayName"');
    expect(html).toContain('name="displayName"');
    expect(html).toContain('value="Admin Users Write"');
  });

  test('renders attached URL section and add button', async () => {
    const html = await renderNewPerm();

    expect(html).toContain('Attached URLs');
    expect(html).toContain('id="urlList"');
    expect(html).toContain('onclick="addUrlInput()"');
    expect(html).toContain('+ Add URL');
    expect(html).toContain('Enter URL');
    expect(html).toContain('Enter Parent');
  });

  test('includes reindex logic and indexed input naming convention', async () => {
    const html = await renderNewPerm();

    expect(html).toContain('function reindexUrlInputs() {');
    expect(html).toContain('wrapper.dataset.index = idx;');
    expect(html).toContain('if (urlInput) urlInput.name = `attachedURL[${idx}][url]`;');
    expect(html).toContain('if (parentInput) parentInput.name = `attachedURL[${idx}][parent]`;');
  });

  test('includes addUrlInput builder and remove handler', async () => {
    const html = await renderNewPerm();

    expect(html).toContain('function addUrlInput(value = \'\', parentvalue = \'\') {');
    expect(html).toContain('input.name = `attachedURL[][url]`;');
    expect(html).toContain('parentinput.name = `attachedURL[][parent]`;');
    expect(html).toContain("btn.textContent = 'Remove';");
    expect(html).toContain('wrapper.remove();');
    expect(html).toContain('reindexUrlInputs();');
  });

  test('initializes attached URLs from server formData', async () => {
    const html = await renderNewPerm();

    expect(html).toContain('(function initAttachedURLs() {');
    expect(html).toContain('const existing = [{"url":"/admin/users","parent":"/admin"},{"url":"/admin/users/new","parent":"/admin/users"}]');
    expect(html).toContain('existing.forEach(u => addUrlInput(u.url || \'\', u.parent || \'\'));');
  });

  test('falls back to empty values and empty attachedURL array when formData missing', async () => {
    const html = await renderNewPerm({ formData: undefined });

    expect(html).toMatch(/id="name"\s+name="name"\s+placeholder="name"\s+autocomplete="off"\s+value=""/);
    expect(html).toMatch(/id="displayName"\s+name="displayName"\s+placeholder="displayName"\s+autocomplete="off"\s+value=""/);
    expect(html).toContain('const existing = []');
  });
});
