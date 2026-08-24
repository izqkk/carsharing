/**
 * The reference dictionary. Every other locale is type-checked against this
 * shape, so adding a key here without adding it everywhere fails the build.
 *
 * `{placeholders}` in curly braces are substituted at call time.
 */
export const en = {
  actions: {
    save: 'Save',
    saving: 'Saving…',
    saved: 'Saved!',
    cancel: 'Cancel',
    delete: 'Delete',
    add: 'Add',
    reset: 'Reset',
    confirm: 'OK'
  },

  auth: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    createAccount: 'Create a new account',
    loading: 'Loading…',
    name: 'Name',
    namePlaceholder: 'Your name',
    calendarColour: 'Colour in the calendar',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    haveAccount: 'Already have an account?',
    noAccount: "Don't have an account yet?"
  },

  nav: {
    calendar: 'Calendar',
    profile: 'Profile',
    newBooking: 'New booking'
  },

  calendar: {
    free: 'Free',
    noBookings: 'No bookings',
    recurringSuffix: '(recurring)',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    jumpToToday: 'Jump to today',
    offline: 'Offline'
  },

  booking: {
    newTitle: 'Book the car',
    editTitle: 'Edit booking',
    submit: 'Book the car',
    submitEdit: 'Save changes',
    when: 'When?',
    whatFor: 'What for?',
    from: 'From',
    to: 'To',
    allDay: 'All day',
    timeRange: '{start} – {end}',
    titlePlaceholder: 'Or type your own title…',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    confirmDelete: 'Delete this booking?',
    presets: {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      allDay: 'All day'
    },
    errors: {
      saveFailed: 'The booking could not be saved. Please try again.',
      saveTimeout: 'Saving failed (timed out or no connection). Please try again.',
      deleteFailed: 'Deleting failed. Please try again.',
      deleteTimeout: 'Deleting failed (timed out or no connection). Please try again.'
    }
  },

  recurring: {
    title: 'Recurring bookings',
    empty: 'No recurring bookings',
    emptyCta: 'Create the first one',
    newTitle: 'New recurring booking',
    editTitle: 'Edit recurring booking',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Choir practice',
    repetition: 'Repeats',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    weekdays: 'Weekdays',
    daysOfMonth: 'Day(s) of the month',
    everyDay: 'Every day',
    onDaysOfMonth: 'On day {days} of the month',
    from: 'From',
    to: 'To',
    validFrom: 'Valid from',
    validUntil: 'Valid until (optional)',
    active: 'Active',
    inactive: 'Inactive',
    create: 'Create booking',
    confirmDelete: 'Delete this recurring booking?'
  },

  profile: {
    title: 'Profile',
    unknownUser: 'Unknown',
    changePhoto: 'Change profile picture',
    uploadingPhoto: 'Uploading picture…',
    name: 'Name',
    calendarColour: 'Colour in the calendar',
    quickTitles: 'Quick titles',
    quickTitlePlaceholder: 'New title…',
    language: 'Language',
    recurringLink: 'Recurring bookings',
    connection: 'Connection',
    online: 'Online',
    offline: 'Offline',
    syncNow: 'Sync now',
    pendingSync: {
      one: '{count} change waiting to sync',
      other: '{count} changes waiting to sync'
    },
    signOut: 'Sign out'
  },

  errors: {
    missingConfig:
      'This app is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then rebuild.'
  }
}

/**
 * The shape every other locale must match. Defined here (not in the barrel)
 * so `de.ts` can import it without the two files importing each other.
 */
export type Dictionary = typeof en
