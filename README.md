# Powerjacked

A single-file fitness tracker. Weigh-ins with optional body composition, nutrition totals,
a training log built around an editable program, estimated one-rep maxes per exercise,
InBody check-ins, Zone 2 and rehab adherence, and a dashboard that ties them together.

Live at <https://pinedasanabria1911.github.io/powerjacked/>.

## Design constraints

The whole app is one `index.html` with no build step, no framework, and no dependencies.
Nothing is fetched from a CDN. That is deliberate: there is no lockfile to rot, no package
to update, and no service that can sleep, expire, or change its free tier. Editing the file
and pushing is the entire deployment process.

## Building

`index.html` at the repo root is **generated**. Do not edit it by hand; edit `src/app.html`
and rebuild.

```bash
node src/build.js     # writes index.html and manifest.json at the repo root
node src/mkicon.js    # regenerates the PNG icons, only needed if the icon changes
node src/test.js      # parses the built page and exercises the Cal AI text parser
```

| File | Role |
|---|---|
| `src/app.html` | the real source: markup, styles and logic, with a `// <<<SEED>>>` marker |
| `src/build.js` | emits the production page, and a demo copy to `src/dist/demo.html` |
| `src/seed.demo.js` | synthetic dataset used by the demo build only |
| `src/seed.base.js` | raw generated series that `gen.js` reshapes |
| `src/gen.js` | regenerates `seed.demo.js` against the current program |
| `src/mkicon.js` | draws the home-screen icons as PNGs, no image library |
| `src/test.js` | syntax check plus parser cases |

Node is the only requirement, and only to build. The page itself has no dependencies.

## Where the data lives

The app ships with a program and a goal but no measurements. Everything you log is stored
in a **separate private repository** as a single `data.json`, written through the GitHub
contents API. That repo is the record; the browser holds a cache.

Consequences worth knowing:

- Every save is a commit, so the history is a free, versioned backup of every day.
- Clearing the browser, losing the phone, or having iOS evict site storage costs you
  nothing but the need to paste the token again.
- Two devices editing while offline merge per record rather than overwriting. Records are
  keyed by date, so nothing another device wrote is dropped.

## Setup on a new device

1. Create a fine-grained personal access token at
   <https://github.com/settings/personal-access-tokens>, scoped to the private data
   repository only, with **Contents: read and write**, and an expiry you are happy with.
2. Open the app, go to **Setup → Sync**, enter the GitHub user and the private repo name
   (`powerjacked-data`), paste the token, and press **Connect**.
3. On iOS, use Share → Add to Home Screen so it opens full screen with its own icon.

The token is kept in that browser's local storage under its own key, is excluded from every
export, and is only ever sent to `api.github.com`. **Forget token** removes it from the
device.

## Session types

The session picker carries the program's own days plus one fixture that is not lifting and
is not editable in the program:

- **Z2, Zone 2 cardio.** Minutes, average HR and max HR. No sets, no exercises.

Mobility (**MOB**) is retired from the picker. Entries already logged still display and export.

Average and max HR sit on a lifting session too, next to the Zone 2 minutes you ride after
weights, so a bike block logged either way records the same three numbers. Cardio and
mobility days do not count toward the weekly session floor, which is about lifting; the
dashboard tile reports them beside it. They export as `cardio.csv` and `mobility.csv`.

## Program

The gym program is the Phase A hypertrophy plan: pre-Houston, upper body, two 9 kg dumbbells,
a chair and a bed, no leg loading. It is three sessions, **HA** (push), **HB** (pull) and **HC**
(shoulders and arms), rotated three times a week. Load is fixed, so every exercise has step 0
and the progression note reads *add a set* once all sets reach the top of the rep range.
Harder variations (4 s lowering, pause reps, partials) are a judgement call the app does not
track. Edit it in Setup → Program like any program.

The old Full Body A/B/C program, the band program and the separate hypertrophy copy are
retired. Logged workouts are never rewritten: history keeps its original day codes and
exercise names, so past lifts still feed the estimated 1RMs and exports. A device that saved
under the old program takes the new one once on load. Mobility is no longer offered when
logging, but mobility already logged still reads and exports as mobility.

## Supersets

An exercise can be paired with the one above it, and a run of paired exercises is one
superset, numbered `1a`, `1b`, `1c` in the log and in the training CSV.

- **In Setup → Program**, the pairing is part of the program: every session logged from
  then on starts with it.
- **In the session logger**, the pairing is that session's own. It is saved with the
  workout, the program keeps whatever it had, and the block is marked *this session only*
  while it differs from the program.

## Estimated 1RM

Every exercise in the logger has a **1RM** button, and **Maxes** lists one estimate per
exercise grouped by main muscle group, strongest first. Both read the same four windows:
the last session with that exercise, all history, 3 months, 6 months.

The estimate is Epley, `1RM = w · (1 + reps/30)`, taken from the best set in the window and
inverted to give the load each rep count should take. Sets past 12 reps are ignored, since
that is past where the formula holds. Sets typed into the open session count before they
are saved, so the number moves while you train. It is an estimate, not a tested max.

## Exports

- **Tier 1, check-in summary.** Markdown or JSON: weight trend, volume against the targets
  your own program implies, top lift changes versus the previous run of the same session,
  nutrition averages, and flags.
- **Tier 2, full history.** One CSV per table plus the program, bundled into a ZIP written
  in-page with no library. Some sandboxed viewers refuse `.zip`, so there is also a
  single-Markdown fallback containing the same tables.

## Calorie target

Maintenance is measured, not predicted: mean intake over the window, corrected by what the
7-day weight average actually did, at 7700 kcal per kg. The target is maintenance plus the
phase rate. Under 14 days of paired weight and nutrition data it falls back to a fixed
number and says so.
