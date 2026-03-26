const mockMainRouter = { name: 'mainRouter' };
const mockAdminRouter = { name: 'adminRouter' };
const mockHorseRouter = { name: 'horseRouter' };
const mockVaulterRouter = { name: 'vaulterRouter' };
const mockLungerRouter = { name: 'lungerRouter' };
const mockEventRouter = { name: 'eventRouter' };
const mockCategoryRouter = { name: 'categoryRouter' };
const mockEntryRouter = { name: 'entryRouter' };
const mockJudgesRouter = { name: 'judgesRouter' };
const mockDailyTimetableRouter = { name: 'dailytimetableRouter' };
const mockAlertRouter = { name: 'alertRouter' };
const mockOrderRouter = { name: 'orderRouter' };
const mockSSTempRouter = { name: 'SSTempRouter' };
const mockScoringRouter = { name: 'scoringRouter' };
const mockMappingRouter = { name: 'mappingRouter' };
const mockResultRouter = { name: 'resultRouter' };
const mockHelpMessageRouter = { name: 'helpMessageRouter' };

jest.mock('../../routes/routes.js', () => ({
  __esModule: true,
  default: mockMainRouter
}));

jest.mock('../../routes/adminRouter.js', () => ({
  __esModule: true,
  default: mockAdminRouter
}));

jest.mock('../../routes/horseRouter.js', () => ({
  __esModule: true,
  default: mockHorseRouter
}));

jest.mock('../../routes/vaulterRouter.js', () => ({
  __esModule: true,
  default: mockVaulterRouter
}));

jest.mock('../../routes/lungerRouter.js', () => ({
  __esModule: true,
  default: mockLungerRouter
}));

jest.mock('../../routes/eventRouter.js', () => ({
  __esModule: true,
  default: mockEventRouter
}));

jest.mock('../../routes/categoryRouter.js', () => ({
  __esModule: true,
  default: mockCategoryRouter
}));

jest.mock('../../routes/entryRouter.js', () => ({
  __esModule: true,
  default: mockEntryRouter
}));

jest.mock('../../routes/judgesRouter.js', () => ({
  __esModule: true,
  default: mockJudgesRouter
}));

jest.mock('../../routes/DtimetableRouter.js', () => ({
  __esModule: true,
  default: mockDailyTimetableRouter
}));

jest.mock('../../routes/alertRouter.js', () => ({
  __esModule: true,
  default: mockAlertRouter
}));
jest.mock('../../routes/helpMessageRouter.js', () => ({
  __esModule: true,
  default: mockHelpMessageRouter
}));

jest.mock('../../routes/orderRouter.js', () => ({
  __esModule: true,
  default: mockOrderRouter
}));

jest.mock('../../routes/SSTempRouter.js', () => ({
  __esModule: true,
  default: mockSSTempRouter
}));

jest.mock('../../routes/scoringRouter.js', () => ({
  __esModule: true,
  default: mockScoringRouter
}));

jest.mock('../../routes/mappingRouter.js', () => ({
  __esModule: true,
  default: mockMappingRouter
}));

jest.mock('../../routes/resultRouter.js', () => ({
  __esModule: true,
  default: mockResultRouter
}));

let setupRoutes;

describe('routes/index setupRoutes', () => {
  beforeAll(async () => {
    ({ default: setupRoutes } = await import('../../routes/index.js'));
  });

  test('registers all route mounts in the expected order', () => {
    const app = { use: jest.fn() };

    setupRoutes(app);

    expect(app.use).toHaveBeenCalledTimes(17);
    expect(app.use.mock.calls).toEqual([
      ['/', mockMainRouter],
      ['/admin', mockAdminRouter],
      ['/horse', mockHorseRouter],
      ['/vaulter', mockVaulterRouter],
      ['/lunger', mockLungerRouter],
      ['/category', mockCategoryRouter],
      ['/admin/event', mockEventRouter],
      ['/entry', mockEntryRouter],
      ['/judges', mockJudgesRouter],
      ['/dailytimetable', mockDailyTimetableRouter],
      ['/alerts', mockAlertRouter],
      ['/order', mockOrderRouter],
      ['/helpmessages', mockHelpMessageRouter],
      ['/scoresheets', mockSSTempRouter],
      ['/scoring', mockScoringRouter],
      ['/mapping', mockMappingRouter],
      ['/result', mockResultRouter]
    ]);
  });
});
