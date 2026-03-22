import fs from 'fs';
import path from 'path';

const routerFilePath = path.resolve(process.cwd(), 'routes/routes.js');

describe('routes source', () => {
  let source;

  beforeAll(() => {
    source = fs.readFileSync(routerFilePath, 'utf8');
  });

  test('defines all expected route declarations', () => {
    const expectedRouteSnippets = [
      'router.get("/robots.txt"',
      'router.get("/", async (req, res) => {',
      'router.get("/dashboard", VerifyNoerror, Verify, dashboardController.getDashboard)',
      'router.post(',
      '"/login"',
      'router.get("/login", CheckLoggedIn, loginController.getLoginPage)',
      'router.get("/profile/:id", Verify, UserIDValidator, profileController.getProfileEditForm)',
      'router.post("/profile/:id", Verify, UserIDValidator, profileController.updateProfile)',
      "router.get('/creators', StoreUserWithoutValidation, creatorsController.getCreatorsPage)",
      "router.get('/logout', Verify, auth.Logout)",
    ];

    expectedRouteSnippets.forEach((snippet) => {
      expect(source).toContain(snippet);
    });
  });

  test('contains robots.txt response behavior', () => {
    expect(source).toContain("res.type('text/plain');");
    expect(source).toContain("res.sendFile(path.join(__dirname, '../static/robots.txt'));\n");
  });

  test('contains dashboard redirect from root route', () => {
    expect(source).toContain('res.redirect("/dashboard");');
  });

  test('contains login validator chain and validate middleware', () => {
    expect(source).toContain('check("username")');
    expect(source).toContain('.not()');
    expect(source).toContain('.isEmpty()');
    expect(source).toContain('check("password").not().isEmpty()');
    expect(source).toContain('Validate,');
    expect(source).toContain('auth.Login');
  });
});
