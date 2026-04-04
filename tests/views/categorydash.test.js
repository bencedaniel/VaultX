import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/category/categorydash.ejs');

function renderCategoryDash(overrides = {}) {
  const data = {
    categorys: [
      {
        _id: 'cat-1',
        CategoryDispName: 'Junior Female',
        Type: 'Compulsory',
        Sex: 'Female',
        Agegroup: 'Junior',
        Star: '1*'
      },
      {
        _id: 'cat-2',
        CategoryDispName: 'Senior Mixed',
        Type: 'Free Test',
        Sex: 'Mixed',
        Agegroup: 'Senior',
        Star: '2*'
      }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/category/categorydash.ejs', () => {
  test('renders header, search controls and create button', async () => {
    const html = await renderCategoryDash();

    expect(html).toContain('Category manager');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');
    expect(html).toContain('href="/category/new"');
    expect(html).toContain('Create new category');
  });

  test('renders table headers and category rows', async () => {
    const html = await renderCategoryDash();

    expect(html).toContain('id="TableBody"');
    expect(html).toContain('<th scope="col">Name</th>');
    expect(html).toContain('<th scope="col">Type</th>');
    expect(html).toContain('<th scope="col">Gender</th>');
    expect(html).toContain('<th scope="col">Age group</th>');
    expect(html).toContain('<th scope="col">Star</th>');

    expect(html).toContain('>Junior Female<');
    expect(html).toContain('>Compulsory<');
    expect(html).toContain('>Female<');
    expect(html).toContain('>Junior<');
    expect(html).toContain('>1*<');

    expect(html).toContain('>Senior Mixed<');
    expect(html).toContain('>Free Test<');
    expect(html).toContain('>Mixed<');
    expect(html).toContain('>Senior<');
    expect(html).toContain('>2*<');
  });

  test('renders edit links for categories', async () => {
    const html = await renderCategoryDash();

    expect(html).toContain('href="/category/edit/cat-1"');
    expect(html).toContain('href="/category/edit/cat-2"');
  });

  test('renders delete modal and confirm button metadata', async () => {
    const html = await renderCategoryDash();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('Delete category');
    expect(html).toContain('id="deleteConfirmationText"');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="category"');
    expect(html).toContain('data-beforeurl="/admin"');
  });

  test('includes delete script with data-categoryid and DELETE endpoint', async () => {
    const html = await renderCategoryDash();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");
    expect(html).toContain('let IdToDelete = null;');
    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal', event => {");
    expect(html).toContain("IdToDelete = button.getAttribute('data-categoryid');");

    expect(html).toContain("confirmDeleteButton?.addEventListener('click', () => {");
    expect(html).toContain("fetch('/category/delete/' + IdToDelete, {");
    expect(html).toContain("method: 'DELETE'");
    expect(html).toContain('window.location.reload();');
  });

  test('renders empty tbody when category list is empty', async () => {
    const html = await renderCategoryDash({ categorys: [] });

    expect(html).toContain('id="TableBody"');
    expect(html).not.toContain('href="/category/edit/');
  });
});
