# Course Quality Admin Workflow

Golfers Nation now supports a build-time course quality layer without changing the runtime provider contract.

## Source inputs

- Base discovery/search catalog:
  - `data/course-import/**/*.json`
- Public enrichment:
  - `data/course-enrichment/**/*.json`
- Manual admin overrides:
  - `data/course-admin/course-overrides.json`

## Build outputs

The course build now generates:

- `data/course/manifest.json`
- `data/course/discovery-index.json`
- `data/course/detail-shards/*.json`
- `data/course/reconciliation-report.json`

The same files are copied into `dist/data/course/`.

## Manual override format

`data/course-admin/course-overrides.json` accepts rows keyed by canonical course id.

Minimal example:

```json
{
  "courseId": "torrey-pines-golf-course-la-jolla-ca",
  "reviewStatus": "approved",
  "reviewNotes": "Verified slope and tee naming.",
  "address": "11480 N Torrey Pines Rd",
  "metadata": {
    "qualityIssues": ["address-corrected"]
  }
}
```

Override rows are applied after enrichment, so manual corrections win over imported public data.

## Reconciliation report

`data/course/reconciliation-report.json` is the admin-facing quality snapshot.

It includes:

- override counts
- unmatched override rows
- review queue counts by priority
- top review queues for:
  - high priority
  - medium priority
  - low-priority sample

Priority is driven by:

- missing coordinates
- lower confidence matches
- fallback tee/hole data
- missing rating/slope

## Backend-ready mapping

The following backend record helpers are available in `src/services/backend-models.js`:

- `toBackendCourseOverrideRecord(...)`
- `toBackendCourseReconciliationRecord(...)`

Suggested table names are defined in `src/config.js`:

- `course_overrides`
- `course_reconciliation_queue`

These helpers are not wired into live Supabase writes yet. They exist so a backend/admin review layer can be added without redesigning the course schema again.
