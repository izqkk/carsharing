import type { Dictionary } from './en'

export const de: Dictionary = {
  actions: {
    save: 'Speichern',
    saving: 'Speichern…',
    saved: 'Gespeichert!',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    add: 'Hinzufügen',
    reset: 'Zurücksetzen',
    confirm: 'OK'
  },

  auth: {
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    createAccount: 'Neues Konto erstellen',
    loading: 'Laden…',
    name: 'Name',
    namePlaceholder: 'Dein Name',
    calendarColour: 'Farbe im Kalender',
    email: 'E-Mail',
    emailPlaceholder: 'name@beispiel.de',
    password: 'Passwort',
    haveAccount: 'Bereits ein Konto?',
    noAccount: 'Noch kein Konto?'
  },

  nav: {
    calendar: 'Kalender',
    profile: 'Profil',
    newBooking: 'Neue Buchung'
  },

  calendar: {
    free: 'Frei',
    noBookings: 'Keine Buchungen',
    recurringSuffix: '(wiederkehrend)',
    previousWeek: 'Vorherige Woche',
    nextWeek: 'Nächste Woche',
    jumpToToday: 'Zu heute springen',
    offline: 'Offline'
  },

  booking: {
    newTitle: 'Auto buchen',
    editTitle: 'Buchung bearbeiten',
    submit: 'Auto buchen',
    submitEdit: 'Änderungen speichern',
    when: 'Wann?',
    whatFor: 'Wofür?',
    from: 'Von',
    to: 'Bis',
    allDay: 'Ganztägig',
    timeRange: '{start} – {end} Uhr',
    titlePlaceholder: 'Oder eigenen Titel eingeben…',
    previousDay: 'Vorheriger Tag',
    nextDay: 'Nächster Tag',
    confirmDelete: 'Buchung wirklich löschen?',
    presets: {
      morning: 'Vormittag',
      afternoon: 'Nachmittag',
      evening: 'Abend',
      allDay: 'Ganztägig'
    },
    errors: {
      saveFailed: 'Buchung konnte nicht gespeichert werden. Bitte erneut versuchen.',
      saveTimeout:
        'Speichern fehlgeschlagen (Zeitüberschreitung oder keine Verbindung). Bitte erneut versuchen.',
      deleteFailed: 'Löschen fehlgeschlagen. Bitte erneut versuchen.',
      deleteTimeout:
        'Löschen fehlgeschlagen (Zeitüberschreitung oder keine Verbindung). Bitte erneut versuchen.'
    }
  },

  recurring: {
    title: 'Wiederkehrende Buchungen',
    empty: 'Keine wiederkehrenden Buchungen',
    emptyCta: 'Erste Buchung erstellen',
    newTitle: 'Neue wiederkehrende Buchung',
    editTitle: 'Wiederkehrende Buchung bearbeiten',
    titleLabel: 'Titel',
    titlePlaceholder: 'z. B. Chorprobe',
    repetition: 'Wiederholung',
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    weekdays: 'Wochentage',
    daysOfMonth: 'Tag(e) im Monat',
    everyDay: 'Jeden Tag',
    onDaysOfMonth: 'Am {days}. des Monats',
    from: 'Von',
    to: 'Bis',
    validFrom: 'Gültig ab',
    validUntil: 'Gültig bis (optional)',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    create: 'Buchung erstellen',
    confirmDelete: 'Wiederkehrende Buchung wirklich löschen?'
  },

  profile: {
    title: 'Profil',
    unknownUser: 'Unbekannt',
    changePhoto: 'Profilbild ändern',
    uploadingPhoto: 'Bild wird hochgeladen…',
    name: 'Name',
    calendarColour: 'Farbe im Kalender',
    quickTitles: 'Schnell-Titel',
    quickTitlePlaceholder: 'Neuer Titel…',
    language: 'Sprache',
    recurringLink: 'Wiederkehrende Buchungen',
    connection: 'Verbindung',
    online: 'Online',
    offline: 'Offline',
    syncNow: 'Jetzt synchronisieren',
    pendingSync: {
      one: '{count} Änderung wartet auf Synchronisierung',
      other: '{count} Änderungen warten auf Synchronisierung'
    },
    signOut: 'Abmelden'
  },

  errors: {
    missingConfig:
      'Diese App ist noch nicht konfiguriert. Setze VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY und baue neu.'
  }
}
