# Search Improvement Plan

Tracking issue: <https://github.com/miguelcorderocollar/bundle-icon-generator/issues/59>

## Goals

- Make icon search default to name-focused matching for faster, more relevant results.
- Add typo-tolerant fuzzy matching in both the API and frontend.
- Preserve full metadata search through an explicit opt-in mode.
- Add response shaping so API clients and agents can request only the fields they need.
- Prepare optional AI-generated search enrichment for descriptions and synonyms.

## Current Baseline

- API search currently matches against broad metadata by default: name, id, keywords, and category.
- Frontend search mirrors this broad substring matching.
- The generated catalog currently contains 3,876 icons.
- A minimal API response shape can reduce default payload size materially because `keywords`, `category`, and sizing metadata are not always needed for discovery.

## Proposed API Contract

- `GET /api/icons?q=<query>` defaults to name-first fuzzy search.
- `mode=name|full` controls search scope.
- `mode=name` searches names by default, with ranked exact, prefix, substring, and fuzzy matches.
- `mode=full` includes name, id, keywords, category, description, and synonyms where available.
- `fuzzy=true|false` controls typo tolerance, defaulting to `true`.
- `include=<csv>|*` controls response fields.
- Default `include` should stay small, for example `id,name,pack,variant`.
- `include=*` keeps compatibility for clients that need the current broad metadata payload.

## Frontend Plan

- Move matching and ranking into a shared utility used by both client and server search.
- Replace simple `includes` filtering with ranked results.
- Apply the same matching to user emojis and custom SVGs where practical.
- Keep current sorting controls, but sort ranked search results before applying explicit user sorting only when the user has selected a non-relevance sort.

## Search Ranking

- Exact normalized name match ranks first.
- Name prefix match ranks next.
- Name substring match ranks next.
- Fuzzy name match ranks after deterministic name matches.
- Full-mode metadata matches rank after name matches unless the name also matched.
- Pack and category filters remain independent filters.

## Enrichment Plan

- Store generated enrichment in `search-enrichment/batch-*.json`.
- Each entry contains `id`, `description`, and `synonyms`.
- Validate batches with `bun run enrichment:validate`.
- Merge enrichment into catalog generation only after enough data is validated and the API/search implementation is ready to consume it.

## Current Enrichment Progress

- Completed icons: 724.
- Total catalog icons: 3,876.
- Remaining icons: 3,152.
- Completed batch files:
  - `search-enrichment/batch-001.json`
  - `search-enrichment/batch-002.json`
  - `search-enrichment/batch-003.json`
  - `search-enrichment/batch-004.json`
- Validation command:

```bash
bun run enrichment:validate
```

## Implementation Phases

1. Add shared search normalization, scoring, and fuzzy matching utilities.
2. Update server search options and `/api/icons` query parsing.
3. Add response shaping for default minimal fields and explicit full payloads.
4. Update frontend search to use the shared matcher.
5. Add tests for default name search, fuzzy matches, full mode, field includes, and filtering.
6. Update API docs, served docs, copy-agent prompt, and icon-bundle-generator skill docs.
7. Merge validated enrichment into catalog generation and full-mode search.

## Risks

- Fuzzy thresholds can create noisy results if they are too permissive.
- Response shaping changes the default API payload, so docs and tests need to make that explicit.
- AI-generated descriptions and synonyms need validation to avoid duplicate, vague, or invented terms.
- Ranking changes can affect perceived result order, especially for short queries.
