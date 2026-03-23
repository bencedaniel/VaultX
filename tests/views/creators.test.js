import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/creators.ejs');

function renderCreators(overrides = {}) {
  return ejs.renderFile(templatePath, { ...overrides }, { rmWhitespace: true });
}

describe('views/creators.ejs', () => {
  test('renders main section title and container classes', async () => {
    const html = await renderCreators();

    expect(html).toContain('Core and Support Team');
    expect(html).toContain('container py-5');
    expect(html).toContain('bg-primary bg-opacity-10');
    expect(html).toContain('rounded border-2 border-black border');
  });

  test('renders team-member style block', async () => {
    const html = await renderCreators();

    expect(html).toContain('.team-member {');
    expect(html).toContain('text-align: center;');
    expect(html).toContain('.team-member .circle {');
    expect(html).toContain('border-radius: 50%;');
  });

  test('renders all three team member names and role descriptions', async () => {
    const html = await renderCreators();

    expect(html).toContain('Dániel Bence');
    expect(html).toContain('Developer, with 5 years scoring office and vaulting event experience');

    expect(html).toContain('András Bence-Kiss');
    expect(html).toContain('Lvl 4 Steward');

    expect(html).toContain('Krisztina Bence-Kiss');
    expect(html).toContain('Lvl 3 Judge');
  });

  test('renders team member images and alt attributes', async () => {
    const html = await renderCreators();

    expect(html).toContain('src="/static/daniel.jpg"');
    expect(html).toContain('alt="Dániel Bence"');

    expect(html).toContain('src="/static/andras.jpg"');
    expect(html).toContain('alt="András Bence-Kiss"');

    expect(html).toContain('src="/static/krisztina.jpg"');
    expect(html).toContain('alt="Krisztina Bence-Kiss"');
  });

  test('renders expected member card structure classes', async () => {
    const html = await renderCreators();

    const memberCount = (html.match(/class="col-md-4 team-member"/g) || []).length;
    const circleCount = (html.match(/class="circle z-1"/g) || []).length;

    expect(memberCount).toBe(3);
    expect(circleCount).toBe(3);
    expect(html).toContain('class="row justify-content-center"');
    expect(html).toContain('class="img-fluid h-100 w-100 object-fit-cover"');
  });
});
