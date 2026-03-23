const ejs = require('ejs');
const path = require('path');

describe('dashboard.ejs – Result Group Management', () => {
  const viewPath = path.join(__dirname, '../../views/resultGroup/dashboard.ejs');
  const render = async (resultGroups = []) => {
    return await ejs.renderFile(viewPath, { resultGroups });
  };

  it('renders the main header and container', async () => {
    const html = await render();
    expect(html).toContain('Result Group Management');
    expect(html).toContain('container my-4');
  });

  it('renders the Create New Result Group and Generate buttons', async () => {
    const html = await render();
    expect(html).toContain('href="/result/groups/new"');
    expect(html).toContain('Create New Result Group');
    expect(html).toContain('Generate Result Groups');
    expect(html).toContain('data-bs-target="#genModal"');
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
    expect(html).toContain('Category: Vaulting');
    expect(html).toContain('Round 1 -- 80%');
    expect(html).toContain('Round 2 -- 20%');
    expect(html).toContain('50% -- First program:');
    expect(html).toContain('30% -- Second program:');
    expect(html).toContain('20% -- First program:');
    expect(html).toContain('Monday - R1F-Name');
    expect(html).toContain('Tuesday - R1S-Name');
    expect(html).toContain('Wednesday - R2F-Name');
    // Edit and delete buttons
    expect(html).toContain('href="/result/groups/edit/g1"');
    expect(html).toContain('data-horseid="g1"');
  });

  it('renders empty table body if no resultGroups', async () => {
    const html = await render([]);
    expect(html).toContain('<tbody');
  });

  it('renders the delete modal with correct content', async () => {
    const html = await render();
    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('Delete result group');
    expect(html).toContain('Are you sure you want to delete this result group?');
    expect(html).toContain('id="confirmDeleteButton"');
  });

  it('renders the generate modal with correct content', async () => {
    const html = await render();
    expect(html).toContain('id="genModal"');
    expect(html).toContain('Are you sure you want to generate result groups?');
    expect(html).toContain('id="confirmGenButton"');
  });

  it('includes the updateGenerator and modal JS logic', async () => {
    const html = await render();
    expect(html).toContain('function updateGenerator(groupId, newStatus)');
    expect(html).toContain("fetch('/result/group/status/'");
    expect(html).toContain('ShowSuccessToast');
    expect(html).toContain('ShowErrorToast');
    expect(html).toContain('DOMContentLoaded');
    expect(html).toContain('deleteModal');
    expect(html).toContain('confirmDeleteButton');
    expect(html).toContain('genModal');
    expect(html).toContain('confirmGenButton');
    expect(html).toContain("fetch('/result/groups/generate'");
  });

  it('renders correct classes for layout and styling', async () => {
    const html = await render();
    expect(html).toMatch(/border border-black/);
    expect(html).toMatch(/table-bordered/);
    expect(html).toMatch(/shadow-sm/);
    expect(html).toMatch(/bg-secondary/);
    // expect(html).toMatch(/bg-primary/); // A template nem tartalmazza ezt az osztályt
  });
});
