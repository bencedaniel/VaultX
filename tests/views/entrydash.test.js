import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/entry/entrydash.ejs');

function makeEntry(overrides = {}) {
  return {
    _id: 'entry-1',
    teamName: '',
    vaulter: { Name: 'Solo Vaulter' },
    horse: { Horsename: 'Thunder' },
    lunger: { Name: 'Lunger One' },
    category: { CategoryDispName: 'Senior Individual' },
    status: 'registered',
    ...overrides
  };
}

function renderEntryDash(overrides = {}) {
  const data = {
    entrys: [
      makeEntry({
        _id: 'entry-1',
        teamName: 'Team Alpha',
        vaulter: { Name: 'Ignored' },
        category: { CategoryDispName: 'Team Cat' }
      }),
      makeEntry({
        _id: 'entry-2',
        teamName: '',
        vaulter: { Name: 'Single Name' },
        horse: { Horsename: 'Blaze' },
        lunger: { Name: 'Lunger Two' },
        category: { CategoryDispName: 'Single Cat' },
        status: 'confirmed'
      }),
      makeEntry({
        _id: 'entry-3',
        teamName: '',
        vaulter: [{ Name: 'A' }, { Name: 'B' }],
        horse: { Horsename: 'Comet' },
        lunger: { Name: 'Lunger Three' },
        category: { CategoryDispName: 'Pair Cat' },
        status: 'withdrawn'
      }),
      makeEntry({
        _id: 'entry-4',
        teamName: '',
        vaulter: null,
        horse: { Horsename: 'Nova' },
        lunger: { Name: 'Lunger Four' },
        category: { CategoryDispName: 'Fallback Cat' },
        status: 'cancelled'
      })
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/entry/entrydash.ejs', () => {
  test('renders page header, search controls and create entry link', async () => {
    const html = await renderEntryDash();

    expect(html).toContain('Entry manager');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');
    expect(html).toContain('href="/entry/new"');
    expect(html).toContain('Create new entry');
  });

  test('renders table headers', async () => {
    const html = await renderEntryDash();

    expect(html).toContain('<th scope="col">Vaulter</th>');
    expect(html).toContain('<th scope="col">Horse</th>');
    expect(html).toContain('<th scope="col">Lunger</th>');
    expect(html).toContain('<th scope="col">Category</th>');
    expect(html).toContain('<th scope="col">Status</th>');
  });

  test('resolves vaulter display by priority: teamName, object, array, N/A', async () => {
    const html = await renderEntryDash();

    expect(html).toContain('Team Alpha');
    expect(html).toContain('Single Name');
    expect(html).toContain('A, B');
    expect(html).toContain('N/A');
  });

  test('renders horse, lunger, category and status values', async () => {
    const html = await renderEntryDash();

    expect(html).toContain('Thunder');
    expect(html).toContain('Blaze');
    expect(html).toContain('Lunger One');
    expect(html).toContain('Lunger Two');

    expect(html).toContain('Team Cat');
    expect(html).toContain('Single Cat');
    expect(html).toContain('Pair Cat');
    expect(html).toContain('Fallback Cat');

    expect(html).toContain('registered');
    expect(html).toContain('confirmed');
    expect(html).toContain('withdrawn');
    expect(html).toContain('cancelled');
  });

  test('renders edit and delete controls for each entry row', async () => {
    const html = await renderEntryDash();

    expect(html).toContain('href="/entry/edit/entry-1"');
    expect(html).toContain('href="/entry/edit/entry-2"');

    expect(html).toContain('data-bs-target="#deleteModal"');
    expect(html).toContain('data-entryid="entry-1"');
    expect(html).toContain('data-entryid="entry-2"');
    expect(html).toContain('aria-label="Delete entry"');
  });

  test('renders delete modal and confirm button metadata', async () => {
    const html = await renderEntryDash();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('Delete entry');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="entry"');
    expect(html).toContain('data-beforeurl="/admin"');
  });

  test('includes delete flow script with entry delete endpoint', async () => {
    const html = await renderEntryDash();

    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal'");
    expect(html).toContain("button.getAttribute('data-entryid')");
    expect(html).toContain("fetch('/entry/delete/' + IdToDelete");
    expect(html).toContain('window.location.reload();');
  });

  test('renders no table rows when entry list is empty', async () => {
    const html = await renderEntryDash({ entrys: [] });

    expect(html).not.toContain('/entry/edit/');
    expect(html).not.toContain('data-entryid="');
  });
});
