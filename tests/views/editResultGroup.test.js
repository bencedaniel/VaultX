import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/resultGroup/editResultGroup.ejs');

function renderEditResultGroup(overrides = {}) {
  const baseData = {
    formData: {
      _id: 'rg-1',
      category: { _id: 'cat-1' },
      calcTemplate: { _id: 'calc-1' },
      round1First: { _id: 'r1-1' },
      round1Second: { _id: 'r1-2' },
      round2First: { _id: 'r2-1' }
    },
    categories: [
      { _id: 'cat-1', CategoryDispName: 'Junior Individual' },
      { _id: 'cat-2', CategoryDispName: 'Senior Squad' }
    ],
    resultCalcs: [
      { _id: 'calc-1', round1FirstP: 30, round1SecondP: 40, round2FirstP: 30 },
      { _id: 'calc-2', round1FirstP: 50, round1SecondP: 20, round2FirstP: 30 }
    ],
    timetablePartsRound1: [
      {
        _id: 'r1-1',
        Name: 'Compulsory',
        dailytimetable: { DayName: 'Friday' }
      },
      {
        _id: 'r1-2',
        Name: 'Freestyle',
        dailytimetable: { DayName: 'Saturday' }
      }
    ],
    timetablePartsRound2: [
      {
        _id: 'r2-1',
        Name: 'Final',
        dailytimetable: { DayName: 'Sunday' }
      }
    ],
    ...overrides
  };

  return ejs.renderFile(templatePath, baseData, { rmWhitespace: true });
}

describe('views/resultGroup/editResultGroup.ejs', () => {
  test('renders edit form skeleton with id-based action and Save changes button', async () => {
    const html = await renderEditResultGroup({ formData: { _id: 'rg-77' } });
    expect(html).toContain('action="/result/groups/edit/rg-77"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('Edit result group template');
    expect(html).toContain('>Save changes<');
  });

  test('renders category and calc template lists from source arrays', async () => {
    const html = await renderEditResultGroup();

    expect(html).toContain('Junior Individual');
    expect(html).toContain('Senior Squad');
    expect(html).toContain('30%, 40%, 30%');
    expect(html).toContain('50%, 20%, 30%');
  });

  test('renders timetable program options and Empty entries', async () => {
    const html = await renderEditResultGroup();

    expect(html).toContain('Friday -- Compulsory');
    expect(html).toContain('Saturday -- Freestyle');
    expect(html).toContain('Sunday -- Final');

    const emptyCount = (html.match(/>Empty<\/li>/g) || []).length;
    expect(emptyCount).toBe(3);
  });

  test('prefills visible inputs and hidden ids when formData uses nested objects', async () => {
    const html = await renderEditResultGroup();

    expect(html).toContain('value="Junior Individual"');
    expect(html).toContain('value="30%, 40%, 30%"');
    expect(html).toContain('value="Friday -- Compulsory"');
    expect(html).toContain('value="Saturday -- Freestyle"');
    expect(html).toContain('value="Sunday -- Final"');

    expect(html).toMatch(/name="category"[\s\S]*?value="\[object Object\]"/);
    expect(html).toMatch(/name="calcTemplate"[\s\S]*?value="calc-1"/);
    expect(html).toMatch(/name="round1First"[\s\S]*?value="r1-1"/);
    expect(html).toMatch(/name="round1Second"[\s\S]*?value="r1-2"/);
    expect(html).toMatch(/name="round2First"[\s\S]*?value="r2-1"/);
  });

  test('accepts plain string ids in hidden values', async () => {
    const html = await renderEditResultGroup({
      formData: {
        _id: 'rg-2',
        category: 'cat-2',
        calcTemplate: 'calc-2',
        round1First: 'r1-2',
        round1Second: 'r1-1',
        round2First: 'r2-1'
      }
    });

    expect(html).toMatch(/name="category"[\s\S]*?value="cat-2"/);
    expect(html).toMatch(/name="calcTemplate"[\s\S]*?value="calc-2"/);
    expect(html).toMatch(/name="round1First"[\s\S]*?value="r1-2"/);
    expect(html).toMatch(/name="round1Second"[\s\S]*?value="r1-1"/);
    expect(html).toMatch(/name="round2First"[\s\S]*?value="r2-1"/);
  });

  test('falls back to empty values when formData is missing', async () => {
    const html = await renderEditResultGroup({ formData: null });

    expect(html).toContain('action="/result/groups/edit/"');
    expect(html).toMatch(/name="category"[\s\S]*?value=""/);
    expect(html).toMatch(/name="calcTemplate"[\s\S]*?value=""/);
    expect(html).toMatch(/name="round1First"[\s\S]*?value=""/);
    expect(html).toMatch(/name="round1Second"[\s\S]*?value=""/);
    expect(html).toMatch(/name="round2First"[\s\S]*?value=""/);
  });
});
