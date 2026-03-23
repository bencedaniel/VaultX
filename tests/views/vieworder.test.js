import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/order/vieworder.ejs');

function makeEntry(overrides = {}) {
  return {
    _id: 'entry-1',
    teamName: '',
    vaulter: { Name: 'Solo Vaulter' },
    horse: { Horsename: 'Thunder' },
    lunger: { Name: 'Lunger One' },
    status: 'registered',
    ...overrides
  };
}

function renderViewOrder(overrides = {}) {
  const data = {
    formData: {
      _id: 'tt-part-1',
      Name: 'Morning Session',
      dailytimetable: { DayName: 'Friday' },
      StartingOrder: [
        { Entry: 'entry-1', Order: 2 },
        { Entry: 'entry-2', Order: 1 }
      ]
    },
    entries: [
      makeEntry({ _id: 'entry-1', teamName: 'Team Alpha' }),
      makeEntry({
        _id: 'entry-2',
        teamName: '',
        vaulter: { Name: 'Single Name' },
        horse: { Horsename: 'Blaze' },
        lunger: { Name: 'Lunger Two' },
        status: 'confirmed'
      }),
      makeEntry({
        _id: 'entry-3',
        teamName: '',
        vaulter: [{ Name: 'A' }, { Name: 'B' }],
        horse: { Horsename: 'Comet' },
        lunger: { Name: 'Lunger Three' },
        status: 'withdrawn'
      }),
      makeEntry({
        _id: 'entry-4',
        teamName: '',
        vaulter: null,
        horse: { Horsename: 'Nova' },
        lunger: { Name: 'Lunger Four' },
        status: 'cancelled'
      })
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/order/vieworder.ejs', () => {
  test('renders header, search controls and table headers', async () => {
    const html = await renderViewOrder();

    expect(html).toContain('Order editor : Friday');
    expect(html).toContain('Morning Session');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');

    expect(html).toContain('<th scope="col">Vaulters</th>');
    expect(html).toContain('<th scope="col">Horse</th>');
    expect(html).toContain('<th scope="col">Lunger</th>');
    expect(html).toContain('<th scope="col">Status</th>');
    expect(html).toContain('Order Nr.');
  });

  test('resolves vaulter display by priority: teamName, object, array, N/A', async () => {
    const html = await renderViewOrder();

    expect(html).toContain('Team Alpha');
    expect(html).toContain('Single Name');
    expect(html).toContain('A, B');
    expect(html).toContain('N/A');
  });

  test('renders horse, lunger, status columns and order number mapping', async () => {
    const html = await renderViewOrder();

    expect(html).toContain('Thunder');
    expect(html).toContain('Blaze');
    expect(html).toContain('Lunger One');
    expect(html).toContain('Lunger Two');

    expect(html).toContain('registered');
    expect(html).toContain('confirmed');
    expect(html).toContain('withdrawn');
    expect(html).toContain('cancelled');

    // StartingOrder matches entry-1 => 2 and entry-2 => 1; others keep 0
    expect(html).toMatch(/<td>\s*2\s*<\/td>/);
    expect(html).toMatch(/<td>\s*1\s*<\/td>/);
    expect(html).toMatch(/<td>\s*0\s*<\/td>/);
  });

  test('renders delete modal and delete button metadata', async () => {
    const html = await renderViewOrder();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="horse"');
    expect(html).toContain('data-beforeurl="/admin"');
  });

  test('includes update/delete handlers and overwrite endpoint wiring', async () => {
    const html = await renderViewOrder();

    expect(html).toContain("function updateVetStatus(horseId, newStatus)");
    expect(html).toContain("fetch('/entry/updateVetStatus/' + horseId");
    expect(html).toContain("fetch('/horse/delete/' + IdToDelete");

    expect(html).toContain("function ElementSaved(id)");
    expect(html).toContain("fetch('/order/overwrite/tt-part-1'");
    expect(html).toContain("body: JSON.stringify({ newOrder: document.getElementById('input_'+id).value, id: id })");
  });

  test('includes unsaved-changes beforeunload warning and toast helper', async () => {
    const html = await renderViewOrder();

    expect(html).toMatch(/let\s+formChanged\s*=\s*0;/);
    expect(html).toMatch(/window\.addEventListener\(['"]beforeunload['"],\s*\(event\)\s*=>\s*{/);
    expect(html).toMatch(/event\.returnValue\s*=/);

    expect(html).toMatch(/function\s+ShowSuccessToast\s*\(/);
    // toastContainer is not present in static HTML, only dynamically in JS
    expect(html).toMatch(/id\s*=\s*['"]formSuccessToast['"]/);
  });
});
