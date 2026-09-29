# Agent Skills

Vowvel exposes agent-skills for autonomous agents at `/.well-known/agent-skills/index.json`. Each skill is a single `SKILL.md` file under its own directory, and the index's SHA-256 digests are regenerated automatically at build time so the manifest cannot drift from the source of truth.

## Layout

```
public/.well-known/agent-skills/
├── index.json                         # generated, do not edit by hand
├── commerce-assistant/
│   └── SKILL.md
├── invitation-curator/
│   └── SKILL.md
└── rsvp-concierge/
    └── SKILL.md
```

## Adding a new skill

1. Create `public/.well-known/agent-skills/<name>/SKILL.md`.
2. Start the file with a single H1 line (`# Skill: <Display Name>`) followed by a blank line and a one-sentence description — that description is reused as the `description` field in the generated index.
3. Run `npm run build` (or `npm test`). The `prebuild` / `pretest` npm hooks invoke `scripts/generate-skills-index.mjs`, which walks every `*/SKILL.md` under `public/.well-known/agent-skills/`, recomputes SHA-256 digests, and rewrites `index.json` sorted alphabetically by skill name.

You never need to edit `index.json` by hand — the build-time generator is the source of truth for digests and ordering. The `tests/agent-readiness.test.mjs` SHA-256 assertion verifies the dist copy stays in lock-step after each build.