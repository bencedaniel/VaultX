import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/ssTemp/newScoreSheet.ejs');

function renderNewScoreSheet(overrides = {}) {
  const data = {
    formData: {
      TestType: ['compulsory', 'technical test'],
      CategoryId: [{ _id: 'cat-2' }],
      numberOfJudges: 4,
      typeOfScores: 'technical',
      bgImage: 'https://cdn.example.com/bg.png',
      outputFieldList: [
        { name: 'Total', contentid: 'totalScore', position: { x: 25, y: 30 }, width: 80 }
      ],
      inputFieldList: [
        { name: 'Judge 1', id: 'judge1', preDefValue: '', position: { x: 50, y: 50 }, width: 100 }
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

describe('views/ssTemp/newScoreSheet.ejs', () => {
  test('renders create form, modals and submit button', async () => {
    const html = await renderNewScoreSheet();

    expect(html).toContain('action="/scoresheets/create"');
    expect(html).toContain('enctype="multipart/form-data"');
    expect(html).toContain('id="confirmModal"');
    expect(html).toContain('id="promptModal"');
    expect(html).toContain('>New template<');
    expect(html).toContain('New template');
  });

  test('checks TestType values when formData.TestType is an array', async () => {
    const html = await renderNewScoreSheet();

    expect(html).toMatch(/<input[^>]*id="test_compulsory"[^>]*checked/);
    expect(html).toMatch(/<input[^>]*id="test_technical"[^>]*checked/);
    expect(html).not.toMatch(/<input[^>]*id="test_freestyle"[^>]*checked/);
  });

  test('checks TestType when formData.TestType is a string', async () => {
    const html = await renderNewScoreSheet({
      formData: {
        TestType: 'free test',
        CategoryId: [],
        numberOfJudges: 2,
        typeOfScores: 'horse',
        bgImage: '',
        outputFieldList: [],
        inputFieldList: []
      }
    });

    expect(html).toMatch(/<input[^>]*id="test_freestyle"[^>]*checked/);
    expect(html).not.toMatch(/<input[^>]*id="test_compulsory"[^>]*checked/);
    expect(html).not.toMatch(/<input[^>]*id="test_technical"[^>]*checked/);
  });

  test('renders category checkbox selection and select prefills', async () => {
    const html = await renderNewScoreSheet();

    expect(html).toContain('id="cat_cat-1"');
    expect(html).toContain('id="cat_cat-2"');
    expect(html).toMatch(/value="cat-2"[\s\S]*?checked/);

    expect(html).toMatch(/<option value="4"\s+selected>/);
    expect(html).toMatch(/<option value="technical"\s+selected>/);
  });

  test('renders background upload controls and prefilled image values', async () => {
    const html = await renderNewScoreSheet();

    expect(html).toContain('id="bgImageFile"');
    expect(html).toContain('name="bgImage" id="bgImageUrl" value="https://cdn.example.com/bg.png"');
    expect(html).toContain('id="bgImage" src="https://cdn.example.com/bg.png"');
    expect(html).toContain('id="imageStageWrapper"');
  });

  test('renders hidden JSON outputs and editor controls', async () => {
    const html = await renderNewScoreSheet();

    expect(html).toContain('id="fieldType"');
    expect(html).toContain('id="fieldName"');
    expect(html).toContain('id="fieldIdOrContent"');
    expect(html).toContain('id="fieldWidth"');
    expect(html).toContain('id="addFieldBtn"');
    expect(html).toContain('id="clearAllBtn"');
    expect(html).toContain('name="outputFieldList" id="outputFieldListJson"');
    expect(html).toContain('name="inputFieldList" id="inputFieldListJson"');
  });

  test('includes modal helper and editor script functions', async () => {
    const html = await renderNewScoreSheet();

    expect(html).toContain('function showConfirm(message) {');
    expect(html).toContain('function showPrompt(message, defaultValue = \'\') {');
    expect(html).toContain('const outputFields = [{"name":"Total"');
    expect(html).toContain('const inputFields  = [{"name":"Judge 1"');
    expect(html).toContain('bgImageFile.addEventListener(\'change\'');
    expect(html).toContain('document.addEventListener(\'DOMContentLoaded\', () => {');
    expect(html).toContain('renderAllFields();');
    expect(html).toContain('syncHiddenJson();');
  });

  test('includes add, clear, drag, delete and width-adjust logic in script', async () => {
    const html = await renderNewScoreSheet();

    expect(html).toContain('addFieldBtn.addEventListener(\'click\', () => {');
    expect(html).toContain('clearAllBtn.addEventListener(\'click\', async () => {');
    expect(html).toContain('function createOverlayElement(field, kind, idx) {');
    expect(html).toContain('el.addEventListener(\'contextmenu\', async (ev) => {');
    expect(html).toContain('el.addEventListener(\'dblclick\', async (ev) => {');
    expect(html).toContain('function updateTooltip(kind, field, x, y, w) {');
    expect(html).toContain('function clamp(v, min, max) {');
    expect(html).toContain('outputJsonInp.value = JSON.stringify(outputFields);');
    expect(html).toContain('inputJsonInp.value  = JSON.stringify(inputFields);');
  });

  test('renders without preselected values when formData is missing', async () => {
    const html = await renderNewScoreSheet({ formData: undefined });

    expect(html).toContain('name="bgImage" id="bgImageUrl" value=""');
    expect(html).toContain('id="bgImage" src=""');
    expect(html).not.toMatch(/id="test_compulsory"[\s\S]*?checked/);
    expect(html).not.toMatch(/id="test_freestyle"[\s\S]*?checked/);
    expect(html).not.toMatch(/id="test_technical"[\s\S]*?checked/);
  });
});
