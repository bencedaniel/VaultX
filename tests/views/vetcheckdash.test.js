import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/entry/vetcheckdash.ejs');

function renderVetCheckDash(overrides = {}) {
  const data = {
    horses: [
      {
        _id: 'h1',
        Horsename: 'Apollo',
        feiid: 'FEI-111',
        Nationality: 'HUN',
        ResponsiblePersonName: 'John Rider',
        HeadNr: [{ armNumber: 'A-01' }],
        HorseStatus: 'Active',
        VetCheckStatus: [
          { status: 'failed', timestamp: '2026-03-20T08:00:00.000Z' },
          { status: 'passed', timestamp: '2026-03-20T09:00:00.000Z' }
        ],
        style: 'success'
      },
      {
        _id: 'h2',
        Horsename: 'Breeze',
        feiid: 'FEI-222',
        Nationality: 'AUT',
        ResponsiblePersonName: 'Anna Handler',
        HeadNr: [],
        HorseStatus: 'Pending',
        VetCheckStatus: [],
        style: 'warning'
      }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/entry/vetcheckdash.ejs', () => {
  test('renders header and search controls', async () => {
    const html = await renderVetCheckDash();

    expect(html).toContain('Vet check list');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="dropdownMenuButton"');
    expect(html).toContain('id="dropdownMenu"');
  });

  test('renders table headers and horse row values', async () => {
    const html = await renderVetCheckDash();

    expect(html).toContain('<th scope="col">Name</th>');
    expect(html).toContain('<th scope="col">FEI ID</th>');
    expect(html).toContain('<th scope="col">Nationality</th>');
    expect(html).toContain('<th scope="col">Responsible person</th>');
    expect(html).toMatch(/<th[^>]*>Head Nr<\/th>/);
    expect(html).toMatch(/<th[^>]*>Status<\/th>/);
    expect(html).toMatch(/<th[^>]*width\s*=\s*"?10%"?[^>]*>Vet check status<\/th>/);

    expect(html).toMatch(/>Apollo</);
    expect(html).toMatch(/>FEI-111</);
    expect(html).toMatch(/>HUN</);
    expect(html).toMatch(/>John Rider</);
    expect(html).toMatch(/>A-01</);
    expect(html).toMatch(/>Active</);

    expect(html).toMatch(/>Breeze</);
    expect(html).toMatch(/>FEI-222</);
    expect(html).toMatch(/>AUT</);
    expect(html).toMatch(/>Anna Handler</);
    expect(html).toMatch(/No head Nr/);
    expect(html).toMatch(/>Pending</);
  });

  test('selects latest vet status by timestamp and falls back to before', async () => {
    const html = await renderVetCheckDash();

    expect(html).toContain('id="vetStatus_h1"');
    expect(html).toMatch(/id="vetStatus_h1"[\s\S]*?<option value="passed" selected>Passed<\/option>/);

    expect(html).toContain('id="vetStatus_h2"');
    expect(html).toMatch(/id="vetStatus_h2"[\s\S]*?<option value="before" selected>Before<\/option>/);
  });

  test('renders all vet status options including To Be Followed label', async () => {
    const html = await renderVetCheckDash();

    expect(html).toContain('<option value="before"');
    expect(html).toContain('<option value="passed"');
    expect(html).toContain('<option value="failed"');
    expect(html).toContain('<option value="pending"');
    expect(html).toContain('<option value="holding"');
    expect(html).toContain('<option value="reinspection"');
    expect(html).toContain('<option value="withdrawn"');
    expect(html).toContain('<option value="ToBeFollowed"');
    expect(html).toContain('>To Be Followed<');
  });

  test('includes updateVetStatus script with POST fetch and success/error branches', async () => {
    const html = await renderVetCheckDash();

    expect(html).toContain('function updateVetStatus(horseId, newStatus) {');
    expect(html).toContain("fetch('/entry/updateVetStatus/' + horseId, {");
    expect(html).toContain("method: 'POST'");
    expect(html).toContain("'Content-Type': 'application/json'");
    expect(html).toContain('body: JSON.stringify({ status: newStatus })');
    expect(html).toContain("ShowSuccessToast('Vet status updated successfully');");
    expect(html).toContain("ShowErrorToast('Error updating vet status');");
    expect(html).toContain('window.location.reload();');
  });

  test('includes delete modal and delete script endpoint logic', async () => {
    const html = await renderVetCheckDash();

    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('id="deleteModalLabel"');
    expect(html).toContain('Delete horse');
    expect(html).toContain('id="confirmDeleteButton"');
    expect(html).toContain('data-deleteslug="horse"');

    expect(html).toContain("deleteModal?.addEventListener('show.bs.modal', event => {");
    expect(html).toContain("IdToDelete = button.getAttribute('data-horseid');");
    expect(html).toContain("fetch('/horse/delete/' + IdToDelete, {");
    expect(html).toContain("method: 'DELETE'");
  });

  test('renders empty tbody when horses list is empty', async () => {
    const html = await renderVetCheckDash({ horses: [] });

    expect(html).toContain('id="TableBody"');
    expect(html).not.toContain('id="vetStatus_');
  });
});
