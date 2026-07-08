# Contributing to Bob for Ads

Thanks for contributing.

## Before you open a PR

- Keep changes focused and easy to review
- Open an issue first for large features or architectural changes
- Do not commit secrets, API keys, customer data, or generated runtime artifacts

## Local setup

### Dashboard

```bash
npm install
cp .env.example .env
npm run dev
```

### Pipeline orchestrator

```bash
cp bob/.env.example bob/.env
# fill in the required provider keys
bash bob/bob.sh setup
```

## Validation

Before opening a pull request, run what is relevant to your change:

```bash
npm run lint
npm run build
```

If you touch the `bob/` Python workflow, also verify the command you changed still runs.

## Good contribution areas

- Documentation and setup fixes
- Contributor onboarding improvements
- Better failure handling in the pipeline
- Safer config and secrets handling
- Test coverage for API routes and orchestration helpers
- Dashboard UX for run status, monitoring, and approvals

## Code style

- Prefer small, well-named modules
- Reuse existing patterns before introducing new abstractions
- Keep user-facing docs aligned with the actual repo structure
