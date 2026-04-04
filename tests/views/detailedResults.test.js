import path from 'path';
import ejs from 'ejs';

const templatePath = path.resolve(process.cwd(), 'views/results/detailedResults.ejs');

function buildResult(overrides = {}) {
  return {
    entry: {
      teamName: '',
      vaulter: { Name: 'Solo Vaulter' },
      horse: { Horsename: 'Thunder' },
      lunger: { Name: 'Lunger One' }
    },
    scoresheets: [
      { table: 'A', scoreId: { totalScoreBE: 7.1 } },
      { table: 'B', scoreId: { totalScoreBE: 7.2 } },
      { table: 'C', scoreId: { totalScoreBE: 7.3 } },
      { table: 'D', scoreId: { totalScoreBE: 7.4 } }
    ],
    firstTotalScore: 7.25,
    secondTotalScore: 7.35,
    round1TotalScore: 7.3,
    round2TotalScore: 7.4,
    TotalScore: 7.333,
    ...overrides
  };
}

function renderDetailedResults(overrides = {}) {
  const data = {
    title: 'Detailed Results',
    pointDetailsLevel: 1,
    resultGroup: { _id: 'group-1' },
    param: 'R1',
    results: [buildResult()],
    ...overrides
  };

  return ejs.renderFile(templatePath, data, { rmWhitespace: true });
}

describe('views/results/detailedResults.ejs', () => {
  test('renders title, table headers and rank numbering', async () => {
    const html = await renderDetailedResults({
      results: [buildResult(), buildResult({ TotalScore: 7.111 })]
    });

    expect(html).toContain('<h3 class="text-center">Detailed Results</h3>');
    expect(html).toContain('<th scope="col">Name</th>');
    expect(html).toContain('<th scope="col">Horse</th>');
    expect(html).toContain('<th scope="col">Lunger</th>');
    expect(html).toContain('<th scope="col">Total</th>');
    expect(html).toContain('<th scope="col">Rank</th>');
    expect(html).toContain('<td>1</td>');
    expect(html).toContain('<td>2</td>');
  });

  test('renders upper level link to total view when pointDetailsLevel is 2', async () => {
    const html = await renderDetailedResults({ pointDetailsLevel: 2 });

    expect(html).toContain('href="/result/detailed/group-1/total"');
    expect(html).toContain('Upper result level');
  });

  test('renders upper level link to R1 when pointDetailsLevel is 1 and param includes 1', async () => {
    const html = await renderDetailedResults({ pointDetailsLevel: 1, param: 'R1' });

    expect(html).toContain('href="/result/detailed/group-1/R1"');
  });

  test('renders upper level link to R2 when pointDetailsLevel is 1 and param does not include 1', async () => {
    const html = await renderDetailedResults({ pointDetailsLevel: 1, param: 'R2' });

    expect(html).toContain('href="/result/detailed/group-1/R2"');
  });

  test('renders fallback back link to /result on top level', async () => {
    const html = await renderDetailedResults({ pointDetailsLevel: 3 });

    expect(html).toContain('href="/result"');
    expect(html).toContain('btn btn-outline-primary');
  });

  test('resolves name field by priority: teamName, then vaulter object, then vaulter array, then N/A', async () => {
    const html = await renderDetailedResults({
      results: [
        buildResult({ entry: { teamName: 'Team Alpha', vaulter: { Name: 'Ignored' }, horse: { Horsename: 'H1' }, lunger: { Name: 'L1' } } }),
        buildResult({ entry: { teamName: '', vaulter: { Name: 'Single Name' }, horse: { Horsename: 'H2' }, lunger: { Name: 'L2' } } }),
        buildResult({ entry: { teamName: '', vaulter: [{ Name: 'A' }, { Name: 'B' }], horse: { Horsename: 'H3' }, lunger: { Name: 'L3' } } }),
        buildResult({ entry: { teamName: '', vaulter: null, horse: null, lunger: null } })
      ]
    });

    expect(html).toContain('Team Alpha');
    expect(html).toContain('Single Name');
    expect(html).toContain('A, B');
    expect(html).toContain('N/A');
  });

  test('renders point details tables for level 1, 2 and 3 branches', async () => {
    const htmlLevel1 = await renderDetailedResults({ pointDetailsLevel: 1 });
    const htmlLevel2 = await renderDetailedResults({ pointDetailsLevel: 2 });
    const htmlLevel3 = await renderDetailedResults({ pointDetailsLevel: 3 });

    expect(htmlLevel1).toContain('A:');
    expect(htmlLevel1).toContain('B:');

    expect(htmlLevel2).toContain('href="/result/detailed/group-1/R1F"');
    expect(htmlLevel2).toContain('href="/result/detailed/group-1/R1S"');

    expect(htmlLevel3).toContain('href="/result/detailed/group-1/R1"');
    expect(htmlLevel3).toContain('href="/result/detailed/group-1/R2"');
  });

  test('contains client-side rounding script for .totalScore cells', async () => {
    const html = await renderDetailedResults();

    expect(html).toContain("document.querySelectorAll('.totalScore')");
    expect(html).toContain('excelRound(Number(c.innerHTML),3)');
  });
});
