import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/ssTemp/editScoreSheet.ejs');

function renderEditScoreSheet(overrides = {}) {
  const data = {
    formData: {
      _id: 'sheet-1',
      TestType: ['compulsory', 'free test'],
      CategoryId: [{ _id: 'cat-2' }],
      numberOfJudges: 6,
      typeOfScores: 'artistic',
      bgImage: 'https://cdn.example.com/current-bg.png',
      outputFieldList: [
        { name: 'Total', contentid: 'total', position: { x: 20, y: 30 }, width: 70 }
      ],
      inputFieldList: [
        { name: 'Judge 1', id: 'j1', preDefValue: '', position: { x: 40, y: 50 }, width: 90 }
      ]
    },
    categorys: [
      { _id: 'cat-1', CategoryDispName: 'Individual' },
      { _id: 'cat-2', CategoryDispName: 'Squad' }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/ssTemp/editScoreSheet.ejs', () => {
  test('renders edit form action with template id and submit label', async () => {
    const html = await renderEditScoreSheet();

    expect(html).toContain('action="/scoresheets/edit/sheet-1"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('enctype="multipart/form-data"');
    expect(html).toContain('Edit Template');
    expect(html).toContain('>Edit template<');
  });

  test('renders confirm/prompt modals and control elements', async () => {
    const html = await renderEditScoreSheet();

    expect(html).toContain('id="confirmModal"');
    expect(html).toContain('id="confirmMessage"');
    expect(html).toContain('id="confirmCancel"');
    expect(html).toContain('id="confirmOk"');

    expect(html).toContain('id="promptModal"');
    expect(html).toContain('id="promptMessage"');
    expect(html).toContain('id="promptInput"');
    expect(html).toContain('id="promptCancel"');
    expect(html).toContain('id="promptOk"');
  });

  test('checks TestType values from array and keeps others unchecked', async () => {
    const html = await renderEditScoreSheet();

    expect(html).toMatch(/<input[^>]*id="test_compulsory"[^>]*checked/);
    expect(html).toMatch(/<input[^>]*id="test_freestyle"[^>]*checked/);
    expect(html).not.toMatch(/<input[^>]*id="test_technical"[^>]*checked/);
  });

  test('supports TestType as single string', async () => {
    const html = await renderEditScoreSheet({
      formData: {
        _id: 'sheet-2',
        TestType: 'technical test',
        CategoryId: [],
        numberOfJudges: 2,
        typeOfScores: 'technical',
        bgImage: '',
        outputFieldList: [],
        inputFieldList: []
      }
    });

    expect(html).toMatch(/<input[^>]*id="test_technical"[^>]*checked/);
    expect(html).not.toMatch(/<input[^>]*id="test_compulsory"[^>]*checked/);
    expect(html).not.toMatch(/<input[^>]*id="test_freestyle"[^>]*checked/);
  });

  test('selects categories from CategoryId object array', async () => {
    const html = await renderEditScoreSheet();

    expect(html).toContain('id="cat_cat-1"');
    expect(html).toContain('id="cat_cat-2"');
    expect(html).toMatch(/value="cat-2"[\s\S]*?checked/);
  });

  test('selects categories from legacy Category string id array', async () => {
    const html = await renderEditScoreSheet({
      formData: {
        _id: 'sheet-3',
        TestType: [],
        Category: ['cat-1'],
        numberOfJudges: 1,
        typeOfScores: 'horse',
        bgImage: '',
        outputFieldList: [],
        inputFieldList: []
      }
    });

    expect(html).toMatch(/value="cat-1"[\s\S]*?checked/);
    expect(html).not.toMatch(/value="cat-2"[\s\S]*?checked/);
  });

  test('renders numberOfJudges and typeOfScores selected options', async () => {
    const html = await renderEditScoreSheet();

    expect(html).toMatch(/<option value="6"\s+selected>/);
    expect(html).toMatch(/<option value="artistic"\s+selected>/);
  });

  test('renders current image label and image source from formData.bgImage', async () => {
    const html = await renderEditScoreSheet();

    expect(html).toContain('Current image:');
    expect(html).toContain('id="currentImageLabel">https://cdn.example.com/current-bg.png</span>');
    expect(html).toContain('id="bgImage" src="https://cdn.example.com/current-bg.png"');
    expect(html).toContain('name="bgImage" id="bgImageUrl" value="https://cdn.example.com/current-bg.png"');
  });

  test('renders image label fallback when bgImage missing', async () => {
    const html = await renderEditScoreSheet({
      formData: {
        _id: 'sheet-4',
        TestType: [],
        CategoryId: [],
        numberOfJudges: 4,
        typeOfScores: 'compulsory',
        outputFieldList: [],
        inputFieldList: []
      }
    });

    expect(html).toContain('id="currentImageLabel">none</span>');
    expect(html).toContain('name="bgImage" id="bgImageUrl" value=""');
  });

  test('includes editor controls, hidden JSON outputs and script state init', async () => {
    const html = await renderEditScoreSheet();

    expect(html).toContain('id="fieldType"');
    expect(html).toContain('id="fieldName"');
    expect(html).toContain('id="fieldIdOrContent"');
    expect(html).toContain('id="fieldWidth"');
    expect(html).toContain('id="addFieldBtn"');
    expect(html).toContain('id="clearAllBtn"');
    expect(html).toContain('id="outputFieldListJson"');
    expect(html).toContain('id="inputFieldListJson"');

    expect(html).toContain('const outputFields = [{"name":"Total"');
    expect(html).toContain('const inputFields  = [{"name":"Judge 1"');
    expect(html).toContain("const currentImageLabel = document.getElementById('currentImageLabel');");
  });

  test('includes upload preview, current label updates and canvas helper functions', async () => {
    const html = await renderEditScoreSheet();

    expect(html).toContain("bgImageFile.addEventListener('change', async (e) => {");
    expect(html).toContain("currentImageLabel.textContent = '(new file selected)';");
    expect(html).toContain("document.addEventListener('DOMContentLoaded', () => {");
    expect(html).toContain('currentImageLabel.textContent = bgImageUrl.value;');

    expect(html).toContain('function showConfirm(message) {');
    expect(html).toContain('function showPrompt(message, defaultValue = \'\') {');
    expect(html).toContain('function renderAllFields() {');
    expect(html).toContain('function createOverlayElement(field, kind, idx) {');
    expect(html).toContain('function updateTooltip(kind, field, x, y, w) {');
    expect(html).toContain('function placeByPercent(el, pos) {');
    expect(html).toContain('function clamp(v, min, max) {');
    expect(html).toContain('function syncHiddenJson() {');
  });

  test('includes add, clear, right-click width and double-click delete event flows', async () => {
    const html = await renderEditScoreSheet();

    expect(html).toContain("addFieldBtn.addEventListener('click', () => {");
    expect(html).toContain("clearAllBtn.addEventListener('click', async () => {");
    expect(html).toContain("el.addEventListener('contextmenu', async (ev) => {");
    expect(html).toContain("el.addEventListener('dblclick', async (ev) => {");
    expect(html).toContain("const confirmed = await showConfirm('Biztos törlöd az összes mezőt?');");
    expect(html).toContain('outputJsonInp.value = JSON.stringify(outputFields);');
    expect(html).toContain('inputJsonInp.value  = JSON.stringify(inputFields);');
  });
});
