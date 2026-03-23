const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

describe('dashboard.ejs – Result generator Management', () => {
  const viewPath = path.join(__dirname, '../../views/resultGen/dashboard.ejs');
  const render = async (generators = []) => {
    return await ejs.renderFile(viewPath, { generators });
  };

  it('renders the main header and container', async () => {
    const html = await render();
    expect(html).toContain('Result generator Management');
    expect(html).toContain('container my-4');
  });

  it('renders the search input and dropdown', async () => {
    const html = await render();
    expect(html).toContain('type="search"');
    expect(html).toContain('dropdown-menu');
    expect(html).toContain('Select column');
  });

  it('renders the Create New Result Calc button', async () => {
    const html = await render();
    expect(html).toContain('href="/result/generator/new"');
    expect(html).toContain('Create New Result Calc');
  });

  it('renders table headers correctly', async () => {
    const html = await render();
    expect(html).toContain('Category');
    expect(html).toContain('Calc template');
    expect(html).toContain('Status');
  });

  it('renders generator rows with correct data', async () => {
    const generators = [
      {
        _id: 'abc123',
        category: { CategoryDispName: 'Vaulting' },
        calcSchemaTemplate: {
          round1FirstP: 50,
          round1SecondP: 30,
          round2FirstP: 20
        },
        active: true
      },
      {
        _id: 'def456',
        category: { CategoryDispName: 'Dressage' },
        calcSchemaTemplate: {
          round1FirstP: 60,
          round1SecondP: 25,
          round2FirstP: 15
        },
        active: false
      }
    ];
    const html = await render(generators);
    expect(html).toContain('Vaulting');
    expect(html).toContain('R1F: 50%');
    expect(html).toContain('R1S: 30%');
    expect(html).toContain('R2F: 20%');
    expect(html).toContain('Dressage');
    expect(html).toContain('R1F: 60%');
    expect(html).toContain('R1S: 25%');
    expect(html).toContain('R2F: 15%');
    // Status select
    expect(html).toContain('status-abc123');
    expect(html).toContain('status-def456');
    expect(html).toContain('option value="true" selected');
    expect(html).toContain('option value="false" selected');
    // Edit and delete buttons
    expect(html).toContain('href="/result/generator/edit/abc123"');
    expect(html).toContain('href="/result/generator/edit/def456"');
    expect(html).toContain('data-horseid="abc123"');
    expect(html).toContain('data-horseid="def456"');
  });

  it('renders empty table body if no generators', async () => {
    const html = await render([]);
    // Should not throw, table body should be present
    expect(html).toContain('<tbody');
  });

  it('renders the delete modal with correct content', async () => {
    const html = await render();
    expect(html).toContain('id="deleteModal"');
    expect(html).toContain('Delete result generator');
    expect(html).toContain('Are you sure you want to delete this result generator?');
    expect(html).toContain('id="confirmDeleteButton"');
  });

  it('includes the updateGenerator and delete JS logic', async () => {
    const html = await render();
    expect(html).toContain('function updateGenerator(generatorId, newStatus)');
    expect(html).toContain("fetch('/result/generator/status/'");
    expect(html).toContain('ShowSuccessToast');
    expect(html).toContain('ShowErrorToast');
    expect(html).toContain('DOMContentLoaded');
    expect(html).toContain('deleteModal');
    expect(html).toContain('confirmDeleteButton');
    expect(html).toContain("fetch('/result/generator/delete/'");
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
});
