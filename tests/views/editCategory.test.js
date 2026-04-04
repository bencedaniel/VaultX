import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/category/editCategory.ejs');

function renderEditCategory(overrides = {}) {
  const data = {
    formData: {
      _id: 'cat-1',
      CategoryDispName: 'Junior Female Individual',
      Type: 'Individual',
      Sex: 'Female',
      ReqComp: true,
      ReqFreeTest: true,
      ReqTechnicalTest: false,
      Agegroup: 'Junior',
      Star: 2,
      Horse: { A1: 40.5, A2: 30.25, A3: 29.25 },
      Free: { R: 1.2, D: 2.3, M: 3.4, E: 4.5, NumberOfMaxExercises: 10 },
      Artistic: { CH: 20, C1: 20, C2: 20, C3: 20, C4: 20 },
      TechArtistic: { CH: 25, T1: 25, T2: 25, T3: 25, TechDivider: 2 }
    },
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/category/editCategory.ejs', () => {
  test('renders form action, title and submit button', async () => {
    const html = await renderEditCategory();

    expect(html).toContain('Edit category');
    expect(html).toContain('action="/category/edit/cat-1"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Edit category<');
  });

  test('renders base field prefills and selected options', async () => {
    const html = await renderEditCategory();

    expect(html).toContain('id="CategoryDispName"');
    expect(html).toContain('value="Junior Female Individual"');

    expect(html).toMatch(/<option value="Individual"\s+selected>Individual<\/option>/);
    expect(html).toMatch(/<option value="Female"\s+selected>Female<\/option>/);
    expect(html).toMatch(/<option value="Junior"\s+selected>Junior<\/option>/);
    expect(html).toContain('id="Star"');
    expect(html).toContain('value="2"');
  });

  test('renders required test checkboxes according to formData', async () => {
    const html = await renderEditCategory();

    expect(html).toMatch(/id="ReqComp"[^>]*checked/);
    expect(html).toMatch(/id="ReqFreeTest"[^>]*checked/);
    expect(html).not.toMatch(/id="ReqTechnicalTest"[^>]*checked/);
  });

  test('renders all score blocks and values from formData', async () => {
    const html = await renderEditCategory();

    expect(html).toContain('id="HorseBlock"');
    expect(html).toContain('id="FreeBlock"');
    expect(html).toContain('id="ArtisticBlock"');
    expect(html).toContain('id="TechArtisticBlock"');

    expect(html).toContain('id="Horse_A1"');
    expect(html).toContain('value="40.5"');
    expect(html).toContain('id="Free_NumberOfMaxExercises"');
    expect(html).toContain('value="10"');
    expect(html).toContain('id="Artistic_C4"');
    expect(html).toContain('value="20"');
    expect(html).toContain('id="TechArtistic_TechDivider"');
    expect(html).toContain('value="2"');
  });

  test('uses numeric defaults for score fields when nested score data missing', async () => {
    const html = await renderEditCategory({
      formData: {
        _id: 'cat-2',
        CategoryDispName: 'Default Values Category',
        Type: 'Squad',
        Sex: 'Mixed',
        ReqComp: false,
        ReqFreeTest: false,
        ReqTechnicalTest: false,
        Agegroup: 'Senior',
        Star: 1
      }
    });

    expect(html).toContain('id="Horse_A1" name="Horse[A1]"');
    expect(html).toContain('value="0"');
    expect(html).toContain('id="Free_R" name="Free[R]"');
    expect(html).toContain('id="Artistic_CH" name="Artistic[CH]"');
    expect(html).toContain('id="TechArtistic_CH" name="TechArtistic[CH]"');
  });

  test('renders disabled score inputs initially', async () => {
    const html = await renderEditCategory();

    const disabledCount = (html.match(/disabled>/g) || []).length;
    expect(disabledCount).toBeGreaterThan(5);
  });

  test('includes type/sex and required tests block toggle script logic', async () => {
    const html = await renderEditCategory();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");
    expect(html).toContain("const reqFreeTestCheckbox = document.getElementById('ReqFreeTest');");
    expect(html).toContain("const reqTechnicalTestCheckbox = document.getElementById('ReqTechnicalTest');");
    expect(html).toContain("const freeTestBlock = document.getElementById('FreeBlock');");
    expect(html).toContain("const artisticBlockElement = document.getElementById('ArtisticBlock');");
    expect(html).toContain("const techArtisticBlockElement = document.getElementById('TechArtisticBlock');");
    expect(html).toContain("const horseBlock = document.getElementById('HorseBlock');");

    expect(html).toContain('function toggleBlock(checkbox, block) {');
    expect(html).toContain("block.style.display = 'block';");
    expect(html).toContain("block.style.display = 'none';");
    expect(html).toContain("block.querySelectorAll('input').forEach(input => input.disabled = false);");
    expect(html).toContain("block.querySelectorAll('input').forEach(input => input.disabled = true);");

    expect(html).toContain('function toggleTypeSex() {');
    expect(html).toContain("if (selectedType !== 'Individual' && selectedType !== '') {");
    expect(html).toContain("sexSelect.value = 'Mixed';");
    expect(html).toMatch(/sexSelect\.value\s*=\s*'';[\s\S]*?}/);
  });

  test('includes change listeners and initial toggles in script', async () => {
    const html = await renderEditCategory();

    expect(html).toContain("typeSelect.addEventListener('change', toggleTypeSex);");
    expect(html).toContain("reqFreeTestCheckbox.addEventListener('change', function() {");
    expect(html).toContain("toggleBlock(reqFreeTestCheckbox, freeTestBlock,true);");
    expect(html).toContain("toggleBlock(reqFreeTestCheckbox, artisticBlockElement,true);");
    expect(html).toContain("reqTechnicalTestCheckbox.addEventListener('change', function() {");
    expect(html).toContain("toggleBlock(reqTechnicalTestCheckbox, techArtisticBlockElement,true);");

    expect(html).toContain('toggleBlock(reqFreeTestCheckbox, freeTestBlock);');
    expect(html).toContain('toggleBlock(reqFreeTestCheckbox, artisticBlockElement);');
    expect(html).toContain('toggleBlock(reqTechnicalTestCheckbox, techArtisticBlockElement);');
    expect(html).toContain("horseBlock.querySelectorAll('input').forEach(input => input.disabled = false);");
  });

  test('renders safe fallback when formData missing', async () => {
    const html = await renderEditCategory({ formData: undefined });

    expect(html).toContain('action="/category/edit/"');
    expect(html).toMatch(/id="CategoryDispName"[^>]*name="CategoryDispName"[^>]*placeholder="Category name"[^>]*value=""/);
    expect(html).toMatch(/id="Star"[^>]*name="Star"[^>]*placeholder="Star Level"[^>]*value="1"/);
    expect(html).not.toMatch(/id="ReqComp"[^>]*checked/);
    expect(html).not.toMatch(/id="ReqFreeTest"[^>]*checked/);
    expect(html).not.toMatch(/id="ReqTechnicalTest"[^>]*checked/);
  });
});
