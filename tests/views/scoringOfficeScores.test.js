const ejs = require('ejs');
const path = require('path');

describe('scores.ejs – Scoring Office (Score Sheet manager)', () => {
  const viewPath = path.join(__dirname, '../../views/scoringOffice/scores.ejs');
  const render = async (scores = []) => {
    return await ejs.renderFile(viewPath, { scores });
  };

  it('renders the main header and container', async () => {
    const html = await render();
    expect(html).toContain('Scoresheet manager');
    expect(html).toContain('container my-4');
  });

  it('renders the search input, dropdown, and create button', async () => {
    const html = await render();
    expect(html).toContain('type="search"');
    expect(html).toContain('dropdown-menu');
    expect(html).toContain('Select column');
    expect(html).toContain('href="/scoring/office/scoresheet/new"');
    expect(html).toContain('Create new scoresheet');
  });

  it('renders table headers correctly', async () => {
    const html = await render();
    expect(html).toContain('Program name');
    expect(html).toContain('Vaulters / Team name');
    expect(html).toContain('Category');
    expect(html).toContain('Scoresheets');
    expect(html).toContain('Total');
  });

  it('renders score rows with correct data and edit buttons', async () => {
    const scores = [
      {
        _id: 's1',
        timetablepart: { Name: 'Program 1' },
        entry: {
          teamName: 'Team Alpha',
          vaulter: 'Alice, Bob',
          category: { CategoryDispName: 'Cat1' }
        },
        scoresheets: [
          { scoreId: 'ss1', table: 'A' },
          { scoreId: 'ss2', table: 'B' }
        ],
        TotalScore: 9.876
      },
      {
        _id: 's2',
        timetablepart: { Name: 'Program 2' },
        entry: {
          vaulter: 'Charlie',
          category: { CategoryDispName: 'Cat2' }
        },
        scoresheets: [
          { scoreId: 'ss3', table: 'A' }
        ],
        TotalScore: 8.123
      }
    ];
    const html = await render(scores);
    // Program names
    expect(html).toContain('Program 1');
    expect(html).toContain('Program 2');
    // Team/vaulter names
    expect(html).toMatch(/Team Alpha/);
    expect(html).toMatch(/Alice\s*[<,]\s*Bob/);
    expect(html).toMatch(/Charlie/);
    // Categories
    expect(html).toContain('Cat1');
    expect(html).toContain('Cat2');
    // Edit buttons
    expect(html).toContain('href="/scoring/office/scoresheet/edit/ss1"');
    expect(html).toContain('href="/scoring/office/scoresheet/edit/ss2"');
    expect(html).toContain('href="/scoring/office/scoresheet/edit/ss3"');
    expect(html).toContain('Edit A');
    expect(html).toContain('Edit B');
    // Recalc button
    expect(html).toContain('data-bs-target="#recalcModal"');
    expect(html).toContain('data-scoreid="s1"');
    expect(html).toContain('data-scoreid="s2"');
  });

  it('renders empty table body if no scores', async () => {
    const html = await render([]);
    expect(html).toContain('<tbody');
  });

  it('renders correct classes for layout and styling', async () => {
    const html = await render();
    expect(html).toContain('border border-black');
    expect(html).toContain('table-striped');
    expect(html).toContain('table-hover');
    expect(html).toContain('table-bordered');
    expect(html).toContain('shadow-sm');
    expect(html).toContain('bg-secondary');
  });

  it('renders the recalc modal and JS logic', async () => {
    const html = await render();
    expect(html).toContain('id="recalcModal"');
    expect(html).toContain('Recalculate score');
    expect(html).toContain('id="confirmRecalcButton"');
    expect(html).toContain('DOMContentLoaded');
    expect(html).toContain("fetch('/scoring/office/scores/recalculate/'");
  });
});
