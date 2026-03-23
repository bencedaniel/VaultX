import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/order/editorder.ejs');

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

function renderEditOrder(overrides = {}) {
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

describe('views/order/editorder.ejs', () => {
  test('renders header, search controls and restart session button', async () => {
    const html = await renderEditOrder();

    expect(html).toContain('Order editor : Friday');
    expect(html).toContain('Morning Session');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');
    expect(html).toContain('onclick="forceRefresh()"');
    expect(html).toContain('Restart session');
  });

  test('resolves vaulter display by priority: teamName, object, array, N/A', async () => {
    const html = await renderEditOrder();

    expect(html).toContain('Team Alpha');
    expect(html).toContain('Single Name');
    expect(html).toContain('A, B');
    expect(html).toContain('N/A');
  });

  test('renders order input and save button per row with expected ids', async () => {
    const html = await renderEditOrder();

    expect(html).toContain('id="input_entry-1"');
    expect(html).toContain('id="button_entry-1"');
    expect(html).toContain('class="form-control OrderInput');
    expect(html).toContain('class="btn btn-secondary m-2 w-75 SaveButtons"');

    expect(html).toContain("onchange=\"markFormAsChanged('entry-1')\"");
    expect(html).toContain("onclick=\"markFormAsChanged('entry-1')\"");
    expect(html).toContain("onclick=\"ElementSaved('entry-1')\"");
    expect(html).toContain('disabled>Saved</button>');
  });

  test('maps existing order numbers and uses No Order fallback when missing', async () => {
    const html = await renderEditOrder();

    // entry-1 and entry-2 mapped from StartingOrder, others fallback to No Order
    expect(html).toContain('value="2"');
    expect(html).toContain('value="1"');
    expect(html).toContain('value="No Order"');
  });

  test('renders table columns for horse, lunger and status', async () => {
    const html = await renderEditOrder();

    expect(html).toContain('Thunder');
    expect(html).toContain('Blaze');
    expect(html).toContain('Lunger One');
    expect(html).toContain('Lunger Two');
    expect(html).toContain('registered');
    expect(html).toContain('confirmed');
    expect(html).toContain('withdrawn');
    expect(html).toContain('cancelled');
  });

  test('includes delete modal and delete endpoint wiring', async () => {
    const html = await renderEditOrder();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="horse"');
    expect(html).toContain('data-beforeurl="/admin"');

    expect(html).toContain("fetch('/horse/delete/' + IdToDelete");
    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal'");
    expect(html).toContain("button.getAttribute('data-horseid')");
  });

  test('includes focus/click select behavior for OrderInput fields', async () => {
    const html = await renderEditOrder();

    expect(html).toContain("const orderInputs = document.querySelectorAll('.OrderInput');");
    expect(html).toContain("input.addEventListener('focus', () => input.select())");
    expect(html).toContain("input.addEventListener('click', () => input.select())");
  });

  test('includes beforeunload warning, mark/save workflow and overwrite endpoint', async () => {
    const html = await renderEditOrder();

    expect(html).toContain('let formChanged = 0;');
    expect(html).toContain("window.addEventListener('beforeunload', (event) => {");
    expect(html).toContain('event.returnValue =');

    expect(html).toContain('function markFormAsChanged(id)');
    expect(html).toContain("button.innerHTML='Save';");
    expect(html).toContain("button.classList.add('btn-success')");

    expect(html).toContain('function forceRefresh()');
    expect(html).toContain('window.location.reload();');

    expect(html).toContain('function ElementSaved(id)');
    expect(html).toContain("button.innerHTML='Saved';");
    expect(html).toContain("fetch('/order/overwrite/tt-part-1'");
    expect(html).toContain("body: JSON.stringify({ newOrder: document.getElementById('input_'+id).value, id: id })");
  });

  test('includes update vet status endpoint helper', async () => {
    const html = await renderEditOrder();

    expect(html).toContain('function updateVetStatus(horseId, newStatus)');
    expect(html).toContain("fetch('/entry/updateVetStatus/' + horseId");
  });
});
