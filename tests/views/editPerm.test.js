import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/editPerm.ejs');

function renderEditPerm(overrides = {}) {
  const defaultFormData = {
    _id: 'perm-1',
    name: 'admin.users.read',
    displayName: 'Admin Users Read',
    attachedURL: [
      { url: '/admin/users', parent: '/admin' },
      { url: '/admin/users/new', parent: '/admin/users' }
    ]
  };
  const data = {
    formData: overrides.formData === undefined ? defaultFormData : overrides.formData,
    ...overrides
  };

  // fallback: ha formData nincs, legyen legalább üres object, hogy a template ne dobjon hibát
  if (!data.formData) data.formData = {};
  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/editPerm.ejs', () => {
  test('renders edit permission form action and title', async () => {
    const html = await renderEditPerm();

    expect(html).toContain('Edit Permission');
    expect(html).toContain('action="/admin/editPermission/perm-1"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Edit<');
  });

  test('renders name field as disabled and displayName as editable', async () => {
    const html = await renderEditPerm();

    expect(html).toContain('id="name"');
    expect(html).toContain('name="name"');
    expect(html).toContain('value="admin.users.read"');
    expect(html).toContain('disabled');

    expect(html).toContain('id="displayName"');
    expect(html).toContain('name="displayName"');
    expect(html).toContain('value="Admin Users Read"');
  });

  test('renders attached URL section and add button', async () => {
    const html = await renderEditPerm();

    expect(html).toContain('Attached URLs');
    expect(html).toContain('id="urlList"');
    expect(html).toContain('onclick="addUrlInput()"');
    expect(html).toContain('+ Add URL');
  });

  test('includes reindex function and indexed attachedURL naming pattern', async () => {
    const html = await renderEditPerm();

    expect(html).toContain('function reindexUrlInputs() {');
    expect(html).toContain('wrapper.dataset.index = idx;');
    expect(html).toContain('if (urlInput) urlInput.name = `attachedURL[${idx}][url]`;');
    expect(html).toContain('if (parentInput) parentInput.name = `attachedURL[${idx}][parent]`;');
  });

  test('includes add/remove input builder logic and temporary names before reindex', async () => {
    const html = await renderEditPerm();

    expect(html).toContain('function addUrlInput(value = \'\', parentvalue = \'\') {');
    expect(html).toContain('input.name = `attachedURL[][url]`;');
    expect(html).toContain('parentinput.name = `attachedURL[][parent]`;');
    expect(html).toContain("btn.textContent = 'Remove';");
    expect(html).toContain('wrapper.remove();');
    expect(html).toContain('reindexUrlInputs();');
  });

  test('initializes existing attachedURL items from server-provided data', async () => {
    const html = await renderEditPerm();

    expect(html).toContain('(function initAttachedURLs() {');
    expect(html).toContain('const existing = [{"url":"/admin/users","parent":"/admin"},{"url":"/admin/users/new","parent":"/admin/users"}]');
    expect(html).toContain('existing.forEach(u => addUrlInput(u.url || \'\', u.parent || \'\'));');
  });

  test('falls back to empty values when formData is missing', async () => {
    const html = await renderEditPerm({ formData: undefined });

    expect(html).toMatch(/id="name"\s+name="name"\s+placeholder="name"\s+autocomplete="off"\s+value=""\s+disabled/);
    expect(html).toMatch(/id="displayName"\s+name="displayName"\s+placeholder="displayName"\s+autocomplete="off"\s+value=""/);
    expect(html).toContain('const existing = []');
  });
});
