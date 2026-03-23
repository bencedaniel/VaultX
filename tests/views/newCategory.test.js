import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/category/newCategory.ejs');

function renderNewCategory(overrides = {}) {
  const data = {
    formData: {
      _id: 'new-cat-1',
      CategoryDispName: 'New Junior Individual',
      Type: 'Individual',
      Sex: 'Female',
      ReqComp: true,
      ReqFreeTest: false,
      ReqTechnicalTest: true,
      Agegroup: 'Junior',
      Star: 3,
      Horse: { A1: 33.3, A2: 33.3, A3: 33.4 },
      Free: { R: 1, D: 2, M: 3, E: 4, NumberOfMaxExercises: 12 },
      Artistic: { CH: 25, C1: 20, C2: 20, C3: 20, C4: 15 },
      TechArtistic: { CH: 20, T1: 20, T2: 20, T3: 20, TechDivider: 2 }
    },
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/category/newCategory.ejs', () => {
  test('renders current title, action and submit label', async () => {
    const html = await renderNewCategory();

    expect(html).toContain('Edit Category');
    expect(html).toContain('action="/category/edit/new-cat-1"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('>Edit Category<');
  });

  test('renders base field prefills and selected options', async () => {
    const html = await renderNewCategory();

    expect(html).toContain('id="CategoryDispName"');
    expect(html).toContain('value="New Junior Individual"');

    expect(html).toMatch(/<option value="Individual"\s+selected>Individual<\/option>/);
    expect(html).toMatch(/<option value="Female"\s+selected>Female<\/option>/);
    expect(html).toMatch(/<option value="Junior"\s+selected>Junior<\/option>/);
    expect(html).toContain('id="Star"');
    expect(html).toContain('value="3"');
  });

  test('renders required test checkbox branches', async () => {
    const html = await renderNewCategory();

    expect(html).toMatch(/id="ReqComp"[^>]*checked/);
    expect(html).not.toMatch(/id="ReqFreeTest"[^>]*checked/);
    expect(html).toMatch(/id="ReqFreeTest"[^>]*>/);
    expect(html).toMatch(/id="ReqTechnicalTest"[^>]*checked/);
  });

  test('renders score blocks and values from formData', async () => {
    const html = await renderNewCategory();

    expect(html).toContain('id="HorseBlock"');
    expect(html).toContain('id="FreeBlock"');
    expect(html).toContain('id="ArtisticBlock"');
    expect(html).toContain('id="TechArtisticBlock"');

    expect(html).toContain('id="Horse_A1"');
    expect(html).toContain('value="33.3"');
    expect(html).toContain('id="Free_NumberOfMaxExercises"');
    expect(html).toContain('value="12"');
    expect(html).toContain('id="TechArtistic_TechDivider"');
    expect(html).toContain('value="2"');
  });

  test('uses zero defaults when nested score data missing', async () => {
    const html = await renderNewCategory({
      formData: {
        _id: 'new-cat-2',
        CategoryDispName: 'Defaults',
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

  test('includes DOMContentLoaded toggle script and listeners', async () => {
    const html = await renderNewCategory();

    expect(html).toContain("document.addEventListener('DOMContentLoaded', function() {");
    expect(html).toContain("const reqFreeTestCheckbox = document.getElementById('ReqFreeTest');");
    expect(html).toContain("const reqTechnicalTestCheckbox = document.getElementById('ReqTechnicalTest');");
    expect(html).toContain("const freeTestBlock = document.getElementById('FreeBlock');");
    expect(html).toContain("const artisticBlockElement = document.getElementById('ArtisticBlock');");
    expect(html).toContain("const techArtisticBlockElement = document.getElementById('TechArtisticBlock');");
    expect(html).toContain("const horseBlock = document.getElementById('HorseBlock');");

    expect(html).toContain('function toggleBlock(checkbox, block) {');
    expect(html).toContain('function toggleTypeSex() {');
    expect(html).toContain("typeSelect.addEventListener('change', toggleTypeSex);");
    expect(html).toContain("reqFreeTestCheckbox.addEventListener('change', function() {");
    expect(html).toContain("reqTechnicalTestCheckbox.addEventListener('change', function() {");
    expect(html).toContain('toggleBlock(reqFreeTestCheckbox, freeTestBlock);');
    expect(html).toContain('toggleBlock(reqFreeTestCheckbox, artisticBlockElement);');
    expect(html).toContain('toggleBlock(reqTechnicalTestCheckbox, techArtisticBlockElement);');
    expect(html).toContain("horseBlock.querySelectorAll('input').forEach(input => input.disabled = false);");
  });

  test('renders safe fallback when formData missing', async () => {
    const html = await renderNewCategory({ formData: undefined });

    expect(html).toMatch(/action="\/category\/edit\/"/);
    expect(html).toMatch(/id="CategoryDispName"[^>]*name="CategoryDispName"[^>]*placeholder="Category Name"[^>]*value=""/);
    expect(html).toMatch(/id="Star"[^>]*name="Star"[^>]*placeholder="Star Level"[^>]*value="1"/);
    expect(html).not.toMatch(/id="ReqComp"[^>]*checked/);
    expect(html).not.toMatch(/id="ReqFreeTest"[^>]*checked/);
    expect(html).not.toMatch(/id="ReqTechnicalTest"[^>]*checked/);
  });
});
