import path from 'path';
import ejs from 'ejs';
import { BACKUP_CONTAINER } from '../../config/env';

const layoutPath = path.resolve(process.cwd(), 'views/layouts/layout.ejs');

function renderLayout(overrides = {}) {
  const data = {
    noindex: false,
    rolePermissons: [],
    user: { _id: 'user1', username: 'tester' },
    parent: '/dashboard',
    formData: null,
    successMessage: null,
    failMessage: null,
    body: '<div>Inner content</div>',
    alerts: [],

    selectedEvent: {
      EventName: 'Test Event',
      EventLocation: 'Budapest',
      EventDirectorName: 'Director',
      EventDirectorContact: 'director@example.com',
      AssignedOfficials: []
    },
    backup_container: false,
    test: false,
    timeout: 10,
    version: '1.0.0',
    ...overrides
  };

  return ejs.renderFile(layoutPath, data, { rmWhitespace: true });
}

describe('views/layouts/layout.ejs', () => {
  test('renders noindex meta tags when noindex is true', async () => {
    const html = await renderLayout({ noindex: true });

    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).toContain('name="googlebot" content="noindex, nofollow"');
  });

  test('does not render noindex meta tags when noindex is false', async () => {
    const html = await renderLayout({ noindex: false });

    expect(html).not.toContain('name="robots" content="noindex, nofollow"');
    expect(html).not.toContain('name="googlebot" content="noindex, nofollow"');
  });

  test('renders admin and user navigation for privileged users', async () => {
    const html = await renderLayout({
      rolePermissons: ['admin_dashboard', 'dashboard_access'],
      user: { _id: 'abc123', username: 'alice' }
    });

    expect(html).toContain('href="/admin/dashboard"');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/profile/abc123"');
    expect(html).toMatch(/>\s*alice\s*</);
    expect(html).toContain('href="/logout"');
    expect(html).toContain('id="alertButton"');
  });

  test('hides authenticated navigation when permissions are empty', async () => {
    const html = await renderLayout({ rolePermissons: [], parent: '/back' });

    expect(html).not.toContain('href="/dashboard"');
    expect(html).not.toContain('href="/profile/');
    expect(html).not.toContain('href="/logout"');
    expect(html).not.toContain('id="alertButton"');
  });

  test('renders back link with :did placeholder replaced from formData', async () => {
    const html = await renderLayout({
      parent: '/dailytimetable/dayparts/:did',
      formData: { dailytimetable: { _id: 'dt-1' } }
    });

    expect(html).toContain('href="/dailytimetable/dayparts/dt-1"');
  });

  test('renders back link with :pid placeholder replaced from formData', async () => {
    const html = await renderLayout({
      parent: '/result/details/:pid',
      formData: { parent: 'parent-42' }
    });

    expect(html).toContain('href="/result/details/parent-42"');
  });

  test('renders regular back link when parent has no placeholders', async () => {
    const html = await renderLayout({ parent: '/simple/back' });

    expect(html).toContain('href="/simple/back"');
  });

  test('renders success and fail toasts when messages are present', async () => {
    const html = await renderLayout({
      successMessage: 'Saved successfully',
      failMessage: 'Something failed'
    });

    expect(html).toContain('id="formSuccessToast"');
    expect(html).toContain('Saved successfully');
    expect(html).toContain('id="formFailToast"');
    expect(html).toContain('Something failed');
  });

  test('renders active alerts allowed by permissions and computes counter in script', async () => {
    const html = await renderLayout({
      rolePermissons: ['perm_alert'],
      alerts: [
        {
          active: true,
          permission: 'perm_alert',
          style: 'warning',
          title: 'Visible Alert',
          description: 'Pay attention',
          reappear: '5'
        },
        {
          active: true,
          permission: 'other_perm',
          style: 'danger',
          title: 'Hidden Alert',
          description: 'Should be hidden',
          reappear: '3'
        }
      ]
    });

    expect(html).toContain('Visible Alert');
    expect(html).not.toContain('Hidden Alert');
    expect(html).toContain('const alertCounter = 1;');
  });

  test('renders test DB indicator only when test flag is true', async () => {
    const htmlWithFlag = await renderLayout({ test: true, rolePermissons: ['any_perm'] });
    const htmlWithoutFlag = await renderLayout({ test: false, rolePermissons: ['any_perm'] });

    expect(htmlWithFlag).toContain('TEST DB ACTIVE!');
    expect(htmlWithoutFlag).not.toContain('TEST DB ACTIVE!');
  });

  test('renders helpMessage in Hint modal when provided', async () => {
    const helpMessage = {
      HelpMessage: 'Ez egy súgó üzenet',
      style: 'info',
      url: '/test',
      active: true
    };
    const html = await renderLayout({ helpMessage });
    // Modal should contain the help message text and correct style
    expect(html).toContain('id="HintViewModal"');
    expect(html).toContain('Ez egy súgó üzenet');
    expect(html).toContain('bg-info');
    expect(html).toContain('border-info');
  });

  test('renders fallback Hint modal when no helpMessage is provided', async () => {
    const html = await renderLayout({ helpMessage: null });
    expect(html).toContain('id="HintViewModal"');
    // Should show the default/fallback text for missing helpMessage
    expect(html).toContain('No hint available for this page.');
  });
    test('renders backup container indicator when enabled', async () => {
    const html = await renderLayout({ backup_container: true });
    expect(html).toContain('text-success');
  });
});
