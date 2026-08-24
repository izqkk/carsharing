# Contributing

Thanks for taking a look. This is a small, deliberately narrow project — a
booking calendar for one shared car — so the most useful contributions are
bug fixes, translations, and accessibility improvements.

## Before you start

Please open an issue first for anything larger than a fix. Features that
would turn this into fleet management (multiple vehicles, approval workflows,
billing, mileage logs) are out of scope by design; see *Known limitations* in
the README for what is deliberately missing.

## Setting up

```bash
git clone https://github.com/izqkk/carsharing.git
cd carsharing
npm install
cp .env.example .env   # point it at a throwaway Supabase project
npm run dev
```

npm 12 blocks dependency install scripts by default. `package.json` carries an
`allowScripts` entry for esbuild (the one dependency that needs one, for its
native binary). If a dependency bump makes `npm install` report skipped
scripts, review them and run `npm install-scripts approve esbuild`.

You need your own Supabase project to run the app end to end — create a free
one and run `supabase/schema.sql` in its SQL Editor. The test suite does not
need a database.

## Before you open a pull request

All four of these run in CI and must pass:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run lint:fix` handles the formatting rules automatically.

## House style

- **TypeScript, `<script setup>`, Composition API.** Follow the surrounding
  code rather than introducing a second way of doing things.
- **English** for code, comments, commit messages and documentation. The UI is
  translated; the source is not.
- **Comments explain *why*.** The code already says what it does. A comment
  earns its place by recording a constraint, a trade-off, or a bug that a
  future reader would otherwise reintroduce.
- **No new dependencies** without saying in the issue why the platform or an
  existing dependency cannot do it.

## Translations

`src/i18n/dictionaries/en.ts` is the reference dictionary. Every other locale
is typed against it, so a missing key fails `npm run typecheck` — that is
intentional, and it means you cannot ship a half-translated language by
accident.

To add one:

1. Add the code to `LOCALES` in `src/i18n/locales.ts`.
2. Create `src/i18n/dictionaries/<code>.ts` typed as `Dictionary`.
3. Register it in the `dictionaries` and `dateFnsLocales` maps in
   `src/i18n/index.ts`, and add a label in `LocaleSwitcher.vue`.
4. Seed `DEFAULTS` in `src/lib/quick-titles.ts`.

Weekday names, date formats and plural categories come from `Intl` and
date-fns — do not hand-write them.

## Touching the schema

`supabase/schema.sql` must stay **idempotent**: people re-run it after every
update. Use `IF NOT EXISTS`, drop policies before creating them, and guard
`ALTER PUBLICATION`.

Keep the access shape intact — everyone signed in may read every booking, and
may write only their own rows. Loosening a write policy hands every user the
ability to delete other people's bookings, and that will not be merged.

## Reporting a security issue

Please use GitHub's **Security → Report a vulnerability** rather than a public
issue.
