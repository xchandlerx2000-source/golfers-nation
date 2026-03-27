// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source of truth: data/course-import/**/*.json, data/course-enrichment/**/*.json, and scripts/build-course-catalog.mjs

export const IMPORTED_US_COURSE_CATALOG_MANIFEST = {
  "version": 1,
  "assetVersion": "2f9b459450a3",
  "providerId": "imported-us-course-database",
  "providerLabel": "Imported U.S. course database",
  "generatedAt": "2026-03-27T01:11:28.160Z",
  "recordCount": 16284,
  "sourceCount": 4,
  "qualitySummary": {
    "readinessTiers": {
      "incomplete": 0,
      "discovery-ready": 0,
      "basic-round-ready": 16270,
      "rich-round-ready": 14
    },
    "confidenceTiers": {
      "low": 0,
      "medium": 8688,
      "high": 7596
    },
    "hasRealTeeData": 15,
    "hasRealHoleData": 15,
    "hasRealRatingSlope": 14
  },
  "reconciliationSummary": {
    "overriddenRecords": 5,
    "reviewedRecords": 5
  },
  "sources": [
    {
      "id": "public-us-golf-courses",
      "label": "Public U.S. golf course dataset",
      "sourceType": "public-open-data-import",
      "file": "data/course-import/public-us-golf-courses.json",
      "recordCount": 16295,
      "importedAt": "2026-03-25T22:43:12.896Z"
    },
    {
      "id": "public-us-golf-course-enrichment",
      "label": "Public U.S. golf course enrichment",
      "sourceType": "public-golf-enrichment",
      "file": "data/course-enrichment/us-golf-course-details.json",
      "recordCount": 17147,
      "importedAt": "2026-03-26T00:18:19.781Z"
    },
    {
      "id": "curated-scoring-detail-enrichment",
      "label": "Curated scoring detail enrichment",
      "sourceType": "scoring-detail-enrichment",
      "file": "src/services/course-scoring-enrichment.js",
      "recordCount": 15,
      "importedAt": null
    },
    {
      "id": "admin-course-overrides",
      "label": "Admin course overrides",
      "sourceType": "course-admin-override",
      "file": "data/course-admin/course-overrides.json",
      "recordCount": 5,
      "importedAt": "2026-03-25T00:00:00.000Z"
    }
  ],
  "nearbyIndexPath": "data/course/nearby-index.json",
  "discoveryIndexPath": "data/course/discovery-index.json",
  "detailShards": [
    {
      "key": "ak",
      "state": "AK",
      "recordCount": 24,
      "path": "data/course/detail-shards/ak.json"
    },
    {
      "key": "al",
      "state": "AL",
      "recordCount": 250,
      "path": "data/course/detail-shards/al.json"
    },
    {
      "key": "ar",
      "state": "AR",
      "recordCount": 195,
      "path": "data/course/detail-shards/ar.json"
    },
    {
      "key": "az",
      "state": "AZ",
      "recordCount": 327,
      "path": "data/course/detail-shards/az.json"
    },
    {
      "key": "ca",
      "state": "CA",
      "recordCount": 945,
      "path": "data/course/detail-shards/ca.json"
    },
    {
      "key": "co",
      "state": "CO",
      "recordCount": 255,
      "path": "data/course/detail-shards/co.json"
    },
    {
      "key": "ct",
      "state": "CT",
      "recordCount": 178,
      "path": "data/course/detail-shards/ct.json"
    },
    {
      "key": "dc",
      "state": "DC",
      "recordCount": 4,
      "path": "data/course/detail-shards/dc.json"
    },
    {
      "key": "de",
      "state": "DE",
      "recordCount": 44,
      "path": "data/course/detail-shards/de.json"
    },
    {
      "key": "fl",
      "state": "FL",
      "recordCount": 1080,
      "path": "data/course/detail-shards/fl.json"
    },
    {
      "key": "ga",
      "state": "GA",
      "recordCount": 415,
      "path": "data/course/detail-shards/ga.json"
    },
    {
      "key": "hi",
      "state": "HI",
      "recordCount": 78,
      "path": "data/course/detail-shards/hi.json"
    },
    {
      "key": "ia",
      "state": "IA",
      "recordCount": 413,
      "path": "data/course/detail-shards/ia.json"
    },
    {
      "key": "id",
      "state": "ID",
      "recordCount": 114,
      "path": "data/course/detail-shards/id.json"
    },
    {
      "key": "il",
      "state": "IL",
      "recordCount": 688,
      "path": "data/course/detail-shards/il.json"
    },
    {
      "key": "in",
      "state": "IN",
      "recordCount": 454,
      "path": "data/course/detail-shards/in.json"
    },
    {
      "key": "ks",
      "state": "KS",
      "recordCount": 259,
      "path": "data/course/detail-shards/ks.json"
    },
    {
      "key": "ky",
      "state": "KY",
      "recordCount": 290,
      "path": "data/course/detail-shards/ky.json"
    },
    {
      "key": "la",
      "state": "LA",
      "recordCount": 168,
      "path": "data/course/detail-shards/la.json"
    },
    {
      "key": "ma",
      "state": "MA",
      "recordCount": 379,
      "path": "data/course/detail-shards/ma.json"
    },
    {
      "key": "md",
      "state": "MD",
      "recordCount": 194,
      "path": "data/course/detail-shards/md.json"
    },
    {
      "key": "me",
      "state": "ME",
      "recordCount": 140,
      "path": "data/course/detail-shards/me.json"
    },
    {
      "key": "mi",
      "state": "MI",
      "recordCount": 846,
      "path": "data/course/detail-shards/mi.json"
    },
    {
      "key": "mn",
      "state": "MN",
      "recordCount": 488,
      "path": "data/course/detail-shards/mn.json"
    },
    {
      "key": "mo",
      "state": "MO",
      "recordCount": 344,
      "path": "data/course/detail-shards/mo.json"
    },
    {
      "key": "ms",
      "state": "MS",
      "recordCount": 172,
      "path": "data/course/detail-shards/ms.json"
    },
    {
      "key": "mt",
      "state": "MT",
      "recordCount": 105,
      "path": "data/course/detail-shards/mt.json"
    },
    {
      "key": "nc",
      "state": "NC",
      "recordCount": 561,
      "path": "data/course/detail-shards/nc.json"
    },
    {
      "key": "nd",
      "state": "ND",
      "recordCount": 121,
      "path": "data/course/detail-shards/nd.json"
    },
    {
      "key": "ne",
      "state": "NE",
      "recordCount": 228,
      "path": "data/course/detail-shards/ne.json"
    },
    {
      "key": "nh",
      "state": "NH",
      "recordCount": 113,
      "path": "data/course/detail-shards/nh.json"
    },
    {
      "key": "nj",
      "state": "NJ",
      "recordCount": 298,
      "path": "data/course/detail-shards/nj.json"
    },
    {
      "key": "nm",
      "state": "NM",
      "recordCount": 86,
      "path": "data/course/detail-shards/nm.json"
    },
    {
      "key": "nv",
      "state": "NV",
      "recordCount": 106,
      "path": "data/course/detail-shards/nv.json"
    },
    {
      "key": "ny",
      "state": "NY",
      "recordCount": 839,
      "path": "data/course/detail-shards/ny.json"
    },
    {
      "key": "oh",
      "state": "OH",
      "recordCount": 768,
      "path": "data/course/detail-shards/oh.json"
    },
    {
      "key": "ok",
      "state": "OK",
      "recordCount": 212,
      "path": "data/course/detail-shards/ok.json"
    },
    {
      "key": "or",
      "state": "OR",
      "recordCount": 194,
      "path": "data/course/detail-shards/or.json"
    },
    {
      "key": "pa",
      "state": "PA",
      "recordCount": 706,
      "path": "data/course/detail-shards/pa.json"
    },
    {
      "key": "ri",
      "state": "RI",
      "recordCount": 58,
      "path": "data/course/detail-shards/ri.json"
    },
    {
      "key": "sc",
      "state": "SC",
      "recordCount": 353,
      "path": "data/course/detail-shards/sc.json"
    },
    {
      "key": "sd",
      "state": "SD",
      "recordCount": 123,
      "path": "data/course/detail-shards/sd.json"
    },
    {
      "key": "tn",
      "state": "TN",
      "recordCount": 299,
      "path": "data/course/detail-shards/tn.json"
    },
    {
      "key": "tx",
      "state": "TX",
      "recordCount": 854,
      "path": "data/course/detail-shards/tx.json"
    },
    {
      "key": "ut",
      "state": "UT",
      "recordCount": 116,
      "path": "data/course/detail-shards/ut.json"
    },
    {
      "key": "va",
      "state": "VA",
      "recordCount": 349,
      "path": "data/course/detail-shards/va.json"
    },
    {
      "key": "vt",
      "state": "VT",
      "recordCount": 69,
      "path": "data/course/detail-shards/vt.json"
    },
    {
      "key": "wa",
      "state": "WA",
      "recordCount": 292,
      "path": "data/course/detail-shards/wa.json"
    },
    {
      "key": "wi",
      "state": "WI",
      "recordCount": 510,
      "path": "data/course/detail-shards/wi.json"
    },
    {
      "key": "wv",
      "state": "WV",
      "recordCount": 121,
      "path": "data/course/detail-shards/wv.json"
    },
    {
      "key": "wy",
      "state": "WY",
      "recordCount": 59,
      "path": "data/course/detail-shards/wy.json"
    }
  ]
};
