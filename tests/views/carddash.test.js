import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/admin/carddash.ejs');

function renderCardDash(overrides = {}) {
  const data = {
    cards: [
      {
        _id: 'c1',
        dashtype: 'admin',
        title: 'User Management',
        text: 'Manage users and roles',
        perm: 'admin.users',
        priority: 1
      },
      {
        _id: 'c2',
        dashtype: 'dashboard',
        title: 'Scoring',
        text: 'Open scoring views',
        perm: 'scoring.view',
        priority: 2
      }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/admin/carddash.ejs', () => {
  test('renders page header, search controls and create button', async () => {
    const html = await renderCardDash();

    expect(html).toContain('Card Management');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');
    expect(html).toContain('href="/admin/newCard"');
    expect(html).toContain('Create New Card');
  });

  test('renders table headers and card rows from cards array', async () => {
    const html = await renderCardDash();

    expect(html).toContain('id="TableBody"');
    expect(html).toContain('id="userTableBody"');

    expect(html).toContain('<th scope="col">Type</th>');
    expect(html).toContain('<th scope="col">Title</th>');
    expect(html).toContain('<th scope="col">Text</th>');
    expect(html).toContain('<th scope="col">Permission</th>');
    expect(html).toContain('<th scope="col">Priority</th>');

    expect(html).toContain('>admin<');
    expect(html).toContain('>User Management<');
    expect(html).toContain('>Manage users and roles<');
    expect(html).toContain('>admin.users<');
    expect(html).toContain('>1<');

    expect(html).toContain('>dashboard<');
    expect(html).toContain('>Scoring<');
    expect(html).toContain('>Open scoring views<');
    expect(html).toContain('>scoring.view<');
    expect(html).toContain('>2<');
  });

  test('renders edit and delete actions with card id bindings', async () => {
    const html = await renderCardDash();

    expect(html).toContain('href="/admin/editCard/c1"');
    expect(html).toContain('href="/admin/editCard/c2"');
    expect(html).toContain('data-cardid="c1"');
    expect(html).toContain('data-cardid="c2"');
    expect(html).toContain('aria-label="Edit card"');
    expect(html).toContain('aria-label="Delete card"');
  });

  test('renders delete modal and confirm button metadata', async () => {
    const html = await renderCardDash();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('Delete card');
    expect(html).toContain('id="deleteConfirmationText"');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="card"');
    expect(html).toContain('data-beforeurl="/admin"');
  });

  test('includes delete flow script with modal show and DELETE fetch call', async () => {
    const html = await renderCardDash();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");
    expect(html).toContain('let IdToDelete = null;');
    expect(html).toContain("const deleteModal = document.getElementById('deleteModal');");
    expect(html).toContain("const confirmDeleteButton = document.getElementById('confirmDeleteButton');");

    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal', event => {");
    expect(html).toContain("IdToDelete = button.getAttribute('data-cardid');");

    expect(html).toContain("confirmDeleteButton?.addEventListener('click', () => {");
    expect(html).toContain("fetch('/admin/deleteCard/' + IdToDelete, {");
    expect(html).toContain("method: 'DELETE'");
    expect(html).toContain('window.location.reload();');
  });

  test('renders empty tbody when cards list is empty', async () => {
    const html = await renderCardDash({ cards: [] });

    expect(html).toContain('id="userTableBody"');
    expect(html).not.toContain('href="/admin/editCard/');
    expect(html).not.toContain('data-cardid=');
  });
});
