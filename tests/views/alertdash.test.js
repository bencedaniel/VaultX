import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/alert/alertdash.ejs');

function renderAlertDash(overrides = {}) {
  const data = {
    alerts: [
      {
        _id: 'a1',
        title: 'System Alert',
        description: 'Important maintenance window',
        permission: 'admin.users',
        active: true,
        reappear: 10,
        style: 'danger'
      },
      {
        _id: 'a2',
        title: 'Info Alert',
        description: 'General information',
        permission: 'event.manage',
        active: false,
        reappear: 30,
        style: 'info'
      }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/alert/alertdash.ejs', () => {
  test('renders header, search controls and top action buttons', async () => {
    const html = await renderAlertDash();

    expect(html).toContain('Alert Management');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');

    expect(html).toContain('href="/alerts/new"');
    expect(html).toContain('Create New Alert');
    expect(html).toContain('href="/alerts/checkEvent"');
    expect(html).toContain('Check Event checklist');
  });

  test('renders table headers and alert rows', async () => {
    const html = await renderAlertDash();

    expect(html).toContain('id="TableBody"');
    expect(html).toContain('<th scope="col">Title</th>');
    expect(html).toContain('<th scope="col">Description</th>');
    expect(html).toContain('<th scope="col">Required Permission</th>');
    expect(html).toContain('<th scope="col">Status</th>');
    expect(html).toContain('<th scope="col">Reappear time (Minutes)</th>');

    expect(html).toContain('>System Alert<');
    expect(html).toContain('>Important maintenance window<');
    expect(html).toContain('>admin.users<');
    expect(html).toContain('>10<');

    expect(html).toContain('>Info Alert<');
    expect(html).toContain('>General information<');
    expect(html).toContain('>event.manage<');
    expect(html).toContain('>30<');
  });

  test('renders status text for both active and inactive branches', async () => {
    const html = await renderAlertDash();

    expect(html).toMatch(/>\s*Active\s*</);
    expect(html).toMatch(/>\s*Inactive\s*</);
  });

  test('applies style-based text classes to row cells', async () => {
    const html = await renderAlertDash();

    expect(html).toContain('class="text-danger"');
    expect(html).toContain('class="text-info"');
  });

  test('renders edit and delete actions with alert ids', async () => {
    const html = await renderAlertDash();

    expect(html).toContain('href="/alerts/edit/a1"');
    expect(html).toContain('href="/alerts/edit/a2"');

    expect(html).toContain('data-alertid="a1"');
    expect(html).toContain('data-alertid="a2"');
    expect(html).toContain('aria-label="Edit alert"');
    expect(html).toContain('aria-label="Delete alert"');
  });

  test('renders delete modal and confirm button metadata', async () => {
    const html = await renderAlertDash();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('Delete alert');
    expect(html).toContain('id="deleteConfirmationText"');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="alert"');
    expect(html).toContain('data-beforeurl="/admin"');
  });

  test('includes delete script with data-alertid and DELETE endpoint', async () => {
    const html = await renderAlertDash();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");
    expect(html).toContain('let IdToDelete = null;');
    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal', event => {");
    expect(html).toContain("IdToDelete = button.getAttribute('data-alertid');");

    expect(html).toContain("confirmDeleteButton?.addEventListener('click', () => {");
    expect(html).toContain("fetch('/alerts/delete/' + IdToDelete, {");
    expect(html).toContain("method: 'DELETE'");
    expect(html).toContain('window.location.reload();');
  });

  test('renders empty tbody when alerts list is empty', async () => {
    const html = await renderAlertDash({ alerts: [] });

    expect(html).toContain('id="TableBody"');
    expect(html).not.toContain('href="/alerts/edit/');
    expect(html).not.toContain('data-alertid=');
  });
});
