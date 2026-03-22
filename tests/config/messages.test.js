import { MESSAGES } from '../../config/messages.js';

describe('config/messages', () => {
  test('exports top-level message groups', () => {
    expect(MESSAGES).toBeDefined();
    expect(MESSAGES.AUTH).toBeDefined();
    expect(MESSAGES.SUCCESS).toBeDefined();
    expect(MESSAGES.ERROR).toBeDefined();
    expect(MESSAGES.VALIDATION).toBeDefined();
  });

  test('contains key auth and validation messages', () => {
    expect(MESSAGES.AUTH.INVALID_CREDENTIALS).toBe('Invalid username or password');
    expect(MESSAGES.AUTH.PERMISSION_DENIED).toBe('You do not have permission to access this resource.');
    expect(MESSAGES.VALIDATION.REQUIRED_FIELD).toBe('This field is required');
    expect(MESSAGES.VALIDATION.PERCENTAGE_SUM_ERROR).toBe('The sum of the percentages must be 100%.');
  });

  test('contains representative success and error keys used by controllers', () => {
    expect(MESSAGES.SUCCESS.EVENT_CREATED).toBe('Event created successfully!');
    expect(MESSAGES.SUCCESS.SCORE_SHEET_SAVED).toBe('Score sheet saved successfully!');
    expect(MESSAGES.SUCCESS.USER_DELETE_RESPONSE).toBe('User deleted.');

    expect(MESSAGES.ERROR.ENTRY_NOT_FOUND).toBe('Entry not found');
    expect(MESSAGES.ERROR.NO_EVENT_SELECTED).toBe('No event selected');
    expect(MESSAGES.ERROR.PERCENTAGE_SUM_ERROR).toBe('The sum of the percentages must be 100%.');
  });

  test('all leaf message values are strings', () => {
    const groups = [MESSAGES.AUTH, MESSAGES.SUCCESS, MESSAGES.ERROR, MESSAGES.VALIDATION];

    for (const group of groups) {
      for (const value of Object.values(group)) {
        expect(typeof value).toBe('string');
      }
    }
  });
});
