import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/judges/judgeinput.ejs');

function renderJudgeInput(overrides = {}) {
  return ejs.renderFile(templatePath, { ...overrides }, { rmWhitespace: true });
}

describe('views/judges/judgeinput.ejs', () => {
  test('renders full page shell with bootstrap cdn assets', async () => {
    const html = await renderJudgeInput();

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html lang="hu">');
    expect(html).toContain('bootstrap@5.3.2/dist/css/bootstrap.min.css');
    expect(html).toContain('bootstrap-icons@1.11.1/font/bootstrap-icons.css');
    expect(html).toContain('bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js');
  });

  test('renders main judges form and submit action', async () => {
    const html = await renderJudgeInput();

    expect(html).toContain('Input for Judges');
    expect(html).toContain('action="/judges"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Create Judges table<');
  });

  test('renders tab navigation and tab panes', async () => {
    const html = await renderJudgeInput();

    expect(html).toContain('id="tab-judges"');
    expect(html).toContain('id="tab-days"');
    expect(html).toContain('id="tab-cats"');

    expect(html).toContain('id="pane-judges"');
    expect(html).toContain('id="pane-days"');
    expect(html).toContain('id="pane-cats"');

    expect(html).toContain('id="JudgeInputs"');
    expect(html).toContain('id="addJudgeBtn"');
    expect(html).toContain('id="NumDays"');
  });

  test('renders edit category modal structure and save button', async () => {
    const html = await renderJudgeInput();

    expect(html).toContain('id="editCategoryModal"');
    expect(html).toContain('id="editCategoryModalLabel"');
    expect(html).toContain('id="modalCategoryId"');
    expect(html).toContain('id="modalDayNumber"');
    expect(html).toContain('id="modalCategoryName"');
    expect(html).toContain('id="modalCategoryTime"');
    expect(html).toContain('id="modalConflictedJudges"');
    expect(html).toContain('id="saveCategoryBtn"');
  });

  test('contains judge and category dynamic script building blocks', async () => {
    const html = await renderJudgeInput();

    expect(html).toContain('let categoryCounter = 0;');
    expect(html).toContain('const categories = {};');
    expect(html).toContain("document.getElementById('addJudgeBtn').addEventListener('click'");
    expect(html).toContain("document.getElementById('NumDays').addEventListener('change'");

    expect(html).toContain('function addInputFieldtoJudgeContainer(inputContainer) {');
    expect(html).toContain('function addCategoryInputs(numDays) {');
    expect(html).toContain('function addCategoryRow(dayNumber) {');
    expect(html).toContain('function openEditModal(categoryId, dayNumber) {');
    expect(html).toContain('function updateConflictedJudgesInModal() {');
  });

  test('contains modal save flow and initialization calls', async () => {
    const html = await renderJudgeInput();

    expect(html).toContain("document.getElementById('saveCategoryBtn').addEventListener('click', function() {");
    expect(html).toContain('categoryConflictsInput.value = JSON.stringify(conflictedJudges);');
    expect(html).toContain("bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();");

    expect(html).toContain('// Initialize');
    expect(html).toContain("addInputFieldtoJudgeContainer(document.getElementById('JudgeInputs'));" );
    expect(html).toContain('addCategoryInputs(1);');
  });

  test('contains expected generated field name patterns for category payload', async () => {
    const html = await renderJudgeInput();

    expect(html).toContain('name="Day${dayNumber}[Categories][${categoryId.split(\'_\')[categoryId.split(\'_\').length - 1]}][name]"');
    expect(html).toContain('name="Day${dayNumber}[Categories][${categoryId.split(\'_\')[categoryId.split(\'_\').length - 1]}][time]"');
    expect(html).toContain('name="Day${dayNumber}[Categories][${categoryId.split(\'_\')[categoryId.split(\'_\').length - 1]}][conflicts]"');
  });
});
