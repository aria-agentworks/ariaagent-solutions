# Bob for Ads

Bob for Ads is an AI workflow automation stack for turning a client URL into ad concepts, creative assets, campaign deployment, and ongoing monitoring from one repository.

It combines:

- `creative-ad-agent` as the idea-generation layer
- `meta-ads-ai-agent` as the creative and deployment layer
- `meta-ads-kit` as the monitoring and alerting layer
- `bob/` as the orchestration layer
- `src/` as the operator dashboard

## What this repo is for

This project is aimed at teams building repeatable ad-operations workflows with AI assistance instead of disconnected scripts and manual handoffs.

The repository brings together:

- Concept generation from a client site
- Asset-generation and deployment helpers
- Monitoring and operator actions
- A dashboard for running and reviewing the pipeline

## Architecture

```text
Client URL
  -> Brain (`creative-ad-agent`)
  -> Hands (`meta-ads-ai-agent`)
  -> Mouth (`meta-ads-kit`)
  -> Dashboard + orchestration (`src/`, `bob/`)
```

## Repository layout

```text
bob/                    Pipeline orchestration scripts and shared config
creative-ad-agent/      Idea generation service
meta-ads-ai-agent/      Creative generation and Meta deployment helpers
meta-ads-kit/           Monitoring and Slack/action tooling
src/                    Next.js dashboard
prisma/                 Database schema
```

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/aria-agentworks/ariaagent-solutions.git
cd ariaagent-solutions
```

### 2. Set up the dashboard environment

```bash
cp .env.example .env
```

The root `.env` is for dashboard and integration endpoints such as:

- `DATABASE_URL`
- `GUMROAD_ACCESS_TOKEN`
- `RESEND_API_KEY`

### 3. Set up the orchestration environment

```bash
cp bob/.env.example bob/.env
```

Fill in the provider keys required by the workflow:

- `ANTHROPIC_API_KEY`
- `FAL_KEY`
- `FB_ACCESS_TOKEN`
- `AD_ACCOUNT_ID`
- `PAGE_ID`
- `REPLICATE_API_TOKEN`
- Slack credentials if you want notifications

### 4. Install dependencies

```bash
npm install
bash bob/bob.sh setup
```

### 5. Start the dashboard

```bash
npm run dev
```

### 6. Run the pipeline

```bash
bash bob/bob.sh run https://client-website.com "Client Brand"
```

## Useful commands

```bash
npm run dev
npm run lint
npm run build

bash bob/bob.sh setup
bash bob/bob.sh run <url> <brand>
bash bob/bob.sh run <url> <brand> --skip-deploy
bash bob/bob.sh monitor
bash bob/bob.sh status
bash bob/bob.sh slack-bot
```

## API routes

The dashboard currently exposes routes for:

- `/api/pipeline`
- `/api/generate`
- `/api/deploy`
- `/api/monitor`
- `/api/action`

## Notes for contributors

- Do not commit secrets, customer data, or generated runtime files
- Use `.env.example` and `bob/.env.example` as templates only
- Keep docs aligned with the actual workflow and directory layout

Please read:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## License

MIT. See [LICENSE](LICENSE).
