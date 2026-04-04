/**
 * Centralized message constants for the application
 * Used for success messages, error messages, and user-facing notifications
 */


export const MESSAGES = {
  // Authentication & Authorization Messages
  AUTH: {
    SESSION_EXPIRED: "Your session has expired or you are not authorized. Please log in to continue.",
    SESSION_LOGGED_OUT: "This session has been logged out.",
    INVALID_TOKEN: "Invalid or expired token.",
    USER_NOT_FOUND: "User not found",
    INVALID_CREDENTIALS: "Invalid username or password",
    USER_CREATED: "User created!",
    ACCOUNT_DEACTIVATED: "Your account has been deactivated. Please contact a system administrator.",
    USER_ROLE_NOT_FOUND: "User role not found.",
    ROLE_NOT_FOUND: "Role not found.",
    PERMISSION_DENIED: "You do not have permission to access this resource.",
    USER_ID_REQUIRED: "User ID is required.",
    USER_ALREADY_LOGGED_IN: "User already logged in"
  },

  // Success Messages
  SUCCESS: {
    // User Management
    USER_CREATED: "User created.",
    USER_MODIFIED: "User modified!",
    USER_INACTIVATED: "User inactivated.",
    PROFILE_UPDATED: "Profile updated!",
    
    // Admin - Cards
    CARD_ADDED: "Card added!",
    CARD_MODIFIED: "Card modified!",
    CARD_DELETED: "Card deleted.",
    
    // Admin - Permissions
    PERMISSION_CREATED: "Permission created.",
    PERMISSION_UPDATED: "Permission updated.",
    PERMISSION_DELETED: "Permission deleted.",
    
    // Admin - Roles
    ROLE_CREATED: "Role created.",
    ROLE_UPDATED: "Role updated.",
    ROLE_DELETED: "Role deleted.",
    
    // Alerts
    ALERT_CREATED: "Alert created!",
    ALERT_UPDATED: "Alert updated!",
    ALERT_DELETED: "Alert deleted",
    ALERTS_CREATED: "Alerts created!",
    
    // Help Messages
    HELP_MESSAGE_CREATED: "Help message created!",
    HELP_MESSAGE_UPDATED: "Help message updated!",
    HELP_MESSAGE_DELETED: "Help message deleted",
    // Categories
    CATEGORY_CREATED: "Category created!",
    CATEGORY_UPDATED: "Category updated!",
    CATEGORY_DELETED: "Category deleted",
    
    // Daily Timetable
    DAILY_TIMETABLE_CREATED: "Day created!",
    DAILY_TIMETABLE_UPDATED: "Day updated!",
    TIMETABLE_ELEMENT_CREATED: "Competition created!",
    TIMETABLE_ELEMENT_UPDATED: "Competition updated!",
    
    // Events
    EVENT_CREATED: "Event created!",
    EVENT_UPDATED: "Event updated!",
    EVENT_SELECTED: "Event selected!", // + event name appended
    
    // Entries
    ENTRY_CREATED: "Entry created!",
    ENTRY_UPDATED: "Entry updated!",
    
    // Horse
    HORSE_CREATED: "Horse created!",
    HORSE_UPDATED: "Horse updated!",
    
    // Lunger
    LUNGER_CREATED: "Lunger created!",
    LUNGER_UPDATED: "Lunger updated!",
    
    // Mapping
    MAPPING_CREATED: "Mapping created!",
    MAPPING_UPDATED: "Mapping updated!",
    MAPPING_DELETED: "Mapping deleted!",
    
    // Orders
    STARTING_ORDER_UPDATED: "Starting order updated.",
    CONFLICTS_CONFIRMED: "Conflicts confirmed. You can now create the starting order.",
    
    // Results
    RESULT_CALC_TEMPLATE_CREATED: "Result calculation template created.",
    RESULT_CALC_TEMPLATE_EDITED: "Result calculation template edited.",
    RESULT_GENERATOR_CREATED: "Result generator created.",
    RESULT_GENERATOR_EDITED: "Result generator edited.",
    RESULT_GENERATOR_STATUS_UPDATED: "Result generator status updated.",
    RESULT_GENERATOR_DELETED: "Result generator deleted.",
    RESULT_GROUP_CREATED: "Result group created.",
    RESULT_GROUP_EDITED: "Result group edited.",
    RESULT_GROUP_DELETED: "Result group deleted.",
    RESULT_GROUPS_GENERATED: "Result groups generated.",
    
    // Score Sheets
    SCORE_SHEET_TEMPLATE_CREATED: "Template created!",
    SCORE_SHEET_TEMPLATE_UPDATED: "Template updated!",
    SCORE_SHEET_SAVED: "Scoresheet saved!",
    SCORE_RECALCULATED: "Score recalculated",
    
    // Vaulter
    VAULTER_CREATED: "Vaulter created!",
    VAULTER_UPDATED: "Vaulter updated!",
    ARM_NUMBER_UPDATED: "Arm number updated!",
    
    // Cards, Permissions, Roles, Users (DELETE responses)
    CARD_DELETE_RESPONSE: "Card deleted.",
    PERMISSION_DELETE_RESPONSE: "Permission deleted.",
    ROLE_DELETE_RESPONSE: "Role deleted.",
    USER_DELETE_RESPONSE: "User deleted.",
    
    // Alert & Entry
    ALERT_DELETED: "Alert deleted",
    INCIDENT_DELETED: "Incident deleted",
    VET_STATUS_UPDATED: "Vet status updated",
    
    // Horse
    NOTE_DELETED: "Note deleted",
    NOTE_ADDED: "Note added!",
    NUMBERS_UPDATED: "Numbers updated!",
    
    // Responsible Person & Events
    RESPONSIBLE_PERSON_DELETED: "Person responsible deleted by ",
    RESPONSIBLE_PERSON_ADDED: "Person responsible added!",
    EVENT_DELETED: "Event deleted",
    
    // DailyTimeTable
    DAILY_TIMETABLE_DELETED: "Day deleted.",
    TIMETABLE_ELEMENT_DELETED: "Competition element deleted.",
    
    // Result Calc Template
    RESULT_CALC_TEMPLATE_DELETED: "Calculation template deleted.",
    
    // Entry
    ENTRY_DELETED: "Entry deleted",
    VAULTER_UPDATED: "Vaulter updated!",
    INCIDENT_ADDED: "Incident added!",
    
    // Judges
    JUDGE_INPUT_RECEIVED: "Judge input received!"
  },

  // Error/Failure Messages
  ERROR: {
    // Permissions & Not Found
    PERMISSION_NOT_FOUND: "Permission not found.",
    ROLE_NOT_FOUND: "Role not found.",
    CATEGORY_NOT_FOUND: "Category not found",
    DAILY_TIMETABLE_NOT_FOUND: "Day not found",
    TIMETABLE_ELEMENT_NOT_FOUND: "Competition element not found",
    PARENT_DAY_MISSING: "Parent day missing",
    VAULTER_NOT_FOUND: "Vaulter not found",
    SCORE_NOT_FOUND: "Score not found",
    RESULT_GROUP_NOT_FOUND: "Result group not found.",
    TEMPLATE_NOT_FOUND: "Template not found",
    PAGE_NOT_FOUND: "Page not found",
    NO_EVENT_SELECTED: "No event selected",
    
    // Timetable & Order
    NO_TIMETABLE_TODAY: "No competition for today",
    DRAWING_NOT_DONE: "Drawing not done yet for this competition",
    CONFLICTS_NOT_CHECKED: "Conflicts not checked yet for this competition",
    TIMETABLE_PART_NOT_FOUND: "Competition not found",
    TIMETABLE_PART_NOT_FOUND_FOR_THIS_DAY: "Competition not found for this day",
    NO_STARTING_ORDER: "No starting order set for this competition.",
    INVALID_TIMETABLE_PART: "Invalid competition.",
    TIMETABLE_PART_NOT_DEFINED: "Selected competition is not defined for this result group.",
    INVALID_ORDER_DATA: "Invalid order data. Please provide a valid entry ID and a new order number greater than 0.",
    
    // Scoring & Judges
    SCORE_ALREADY_SUBMITTED: "You have already submitted a score sheet for this entry in this competition",
    NOT_ASSIGNED_AS_JUDGE: "You are not assigned as a judge for this competition",
    NO_ROLE_MAPPING: "No scoresheet mapping found for your judge table in this competition",
    ENTRY_NOT_FOUND: "Entry not found",
    NO_SCORE_SHEET_TEMPLATE: "No score sheet template found for this configuration",
    
    // Validation
    PERCENTAGE_SUM_ERROR: "The sum of the percentages must be 100.",
    INVALID_CREATION_METHOD: "Invalid creation method selected.",
    COPY_METHOD_NOT_IMPLEMENTED: "Copy method not implemented yet."
  },

  // Validation Messages
  VALIDATION: {
    REQUIRED_FIELD: "This field is required",
    INVALID_FORMAT: "Invalid format",
    PERCENTAGE_SUM_ERROR: "The sum of the percentages must be 100."
  },
  HELP: {
    NO_HELP_AVAILABLE: "No help message available for this page."
  }


  
};
