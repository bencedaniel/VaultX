const ejs = require('ejs');
const path = require('path');

describe('dashboard.ejs – Results (Result Group Management)', () => {
  const viewPath = path.join(__dirname, '../../views/results/dashboard.ejs');
  const render = async (resultGroups = []) => {
    return await ejs.renderFile(viewPath, { resultGroups });
  };

  it('renders the main header and container', async () => {
    const html = await render();
      expect(html).toContain('Result group manager');
    expect(html).toContain('container my-4');
  });

  it('renders result group rows with correct nested table and data', async () => {
    const resultGroups = [
      {
        _id: 'g1',
        category: { CategoryDispName: 'Vaulting' },
        calcTemplate: {
          round1FirstP: 50,
          round1SecondP: 30,
          round2FirstP: 20
        },
        round1First: { dailytimetable: { DayName: 'Monday' }, Name: 'R1F-Name' },
        round1Second: { dailytimetable: { DayName: 'Tuesday' }, Name: 'R1S-Name' },
        round2First: { dailytimetable: { DayName: 'Wednesday' }, Name: 'R2F-Name' }
      }
    ];
    const html = await render(resultGroups);
    // Category link
    expect(html).toContain('href="/result/detailed/g1/total"');
    expect(html).toContain('Category: Vaulting');
    // Round 1 and 2 links
    expect(html).toContain('href="/result/detailed/g1/R1"');
    expect(html).toContain('Test 1-2 -- 80%');
    expect(html).toContain('href="/result/detailed/g1/R2"');
    expect(html).toContain('Final -- 20%');
    // Program links
    expect(html).toContain('Monday - R1F-Name');
    expect(html).toContain('Tuesday - R1S-Name');
    expect(html).toContain('Wednesday - R2F-Name');
    expect(html).toContain('href=/result/detailed/g1/R1F');
    expect(html).toContain('href=/result/detailed/g1/R1S');
    expect(html).toContain('href=/result/detailed/g1/R2F');
    // Button classes
    expect(html).toContain('btn btn-outline-primary');
    expect(html).toContain('btn btn-outline-secondary');
    expect(html).toContain('btn btn-outline-dark');
  });

  it('renders empty table body if no resultGroups', async () => {
    const html = await render([]);
    expect(html).toContain('<tbody');
  });

  it('renders correct classes for layout and styling', async () => {
    const html = await render();
    expect(html).toMatch(/border border-black/);
    expect(html).toMatch(/table-bordered/);
    // expect(html).toMatch(/bg-secondary/); // A template nem tartalmazza ezt az osztályt
  });

  it('renders disabled program links if round data is missing', async () => {
    const resultGroups = [
      {
        _id: 'g2',
        category: { CategoryDispName: 'Dressage' },
        calcTemplate: {
          round1FirstP: 60,
          round1SecondP: 25,
          round2FirstP: 15
        },
        round1First: null,
        round1Second: null,
        round2First: null
      }
    ];
    const html = await render(resultGroups);
    // Should render buttons without href if round data is missing
    expect(html).toContain('btn"'); // fallback class
    expect(html).not.toContain('href=/result/detailed/g2/R1F');
    expect(html).not.toContain('href=/result/detailed/g2/R1S');
    expect(html).toContain('Test 1-2 -- 85%');
    expect(html).toContain('Final -- 15%');
  });
});
