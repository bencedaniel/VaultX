import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/order/checkconflicts.ejs');

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

function renderCheckConflicts(overrides = {}) {
  const data = {
    formData: {
      _id: 'tt-part-1',
      Name: 'Morning Session',
      dailytimetable: { DayName: 'Friday' }
    },
    PreGeneratedOrder: [
      { Entry: 'entry-1', Order: 2 },
      { Entry: 'entry-2', Order: 1 }
    ],
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

describe('views/order/checkconflicts.ejs', () => {
  test('renders header, search controls, confirm conflicts link and restart button', async () => {
    const html = await renderCheckConflicts();

    expect(html).toContain('Order editor (Conflicts) : Friday');
    expect(html).toContain('Morning Session');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');

    expect(html).toContain('href="/order/confirmConflicts/tt-part-1"');
    expect(html).toContain('Confirm conflicts');
    expect(html).toContain('onclick="forceRefresh()"');
    expect(html).toContain('Restart session');
  });

  test('resolves vaulter display by priority: teamName, object, array, N/A', async () => {
    const html = await renderCheckConflicts();

    expect(html).toContain('Team Alpha');
    expect(html).toContain('Single Name');
    expect(html).toContain('A, B');
    expect(html).toContain('N/A');
  });

  test('renders disabled order inputs and regenerate buttons per row', async () => {
    const html = await renderCheckConflicts();

    expect(html).toContain('id="input_entry-1" value="2" disabled');
    expect(html).toContain('id="input_entry-2" value="1" disabled');
    expect(html).toContain('id="button_entry-1" onclick="ElementReNew(\'entry-1\')" >Re-generate</button>');
    expect(html).toContain('class="btn btn-primary m-2 w-75 SaveButtons"');
  });

  test('maps order from PreGeneratedOrder and keeps default 0 when not found', async () => {
    const html = await renderCheckConflicts();

    expect(html).toContain('value="2"');
    expect(html).toContain('value="1"');
    expect(html).toContain('value="0"');
  });

  test('renders delete modal and delete endpoint wiring', async () => {
    const html = await renderCheckConflicts();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="horse"');
    expect(html).toContain('data-beforeurl="/admin"');

    expect(html).toContain("fetch('/horse/delete/' + IdToDelete");
    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal'");
    expect(html).toContain("button.getAttribute('data-horseid')");
  });

  test('includes regenerate flow script with getNewOrder endpoint and toast', async () => {
    const html = await renderCheckConflicts();

    expect(html).toContain('function ElementReNew(id)');
    expect(html).toContain("fetch('/order/getNewOrder/tt-part-1'");
    expect(html).toContain("body: JSON.stringify({ oldNumber: document.getElementById('input_'+id).value, id: id })");
    expect(html).toContain("document.getElementById('input_'+id).value = data.newOrder;");
    expect(html).toContain("ShowSuccessToast('Starting order re-generated successfully!')");
  });

  test('includes beforeunload warning, forceRefresh and success toast helper', async () => {
    const html = await renderCheckConflicts();

    expect(html).toContain('let formChanged = 0;');
    expect(html).toContain("window.addEventListener('beforeunload', (event) => {");
    expect(html).toContain('event.returnValue =');

    expect(html).toContain('function forceRefresh()');
    expect(html).toContain('window.location.reload();');

    expect(html).toContain('function ShowSuccessToast(message)');
    expect(html).toContain('id="formSuccessToast"');
  });

  test('includes update vet status helper endpoint', async () => {
    const html = await renderCheckConflicts();

    expect(html).toContain('function updateVetStatus(horseId, newStatus)');
    expect(html).toContain("fetch('/entry/updateVetStatus/' + horseId");
  });
});
