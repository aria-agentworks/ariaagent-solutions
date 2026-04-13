# Bob for Ads — One Command Pipeline

> Turn any client URL into 9 live Meta ads in ~4 minutes.

Brain → Hands → Mouth. Three repos, one pipeline, zero manual work.

## How It Works

```
┌─────────────────────────────────────────────────┐
│                 bob.sh run <url> <brand>         │
└───────────────┬─────────────────┬───────────────┘
                │                 │
    ┌───────────▼──────┐  ┌───────▼──────────┐
    │   BRAIN          │  │   HANDS          │  MOUTH
    │   creative-ad-   │──│   meta-ads-ai-   │──meta-ads-kit
    │   agent          │  │   agent          │  (Slack alerts)
    │                  │  │                  │
    │ Claude AI        │  │ Replicate Flux   │  social-cli
    │ 6 hook-first     │  │ + Hailuo video   │  daily checks
    │ ad concepts      │  │ 3x3 CBO deploy   │  1-tap buttons
    └──────────────────┘  └──────────────────┘
```

### Stage 1: Brain (`creative-ad-agent`)
Claude AI scrapes the client URL, generates **6 hook-first ad concepts** with images. Hook types: question, bold claim, pain point, social proof, curiosity, FOMO.

### Stage 2: Hands (`meta-ads-ai-agent`)
Takes Brain's concepts, generates images via **Replicate Flux Pro**, optionally animates with **Hailuo 2**, and deploys **9 live Meta ads** (3 campaigns × 3 ads) in a CBO grid at $5/adset/day.

### Stage 3: Mouth (`meta-ads-kit`)
Daily monitoring via `social-cli`. Sends Slack messages with **1-tap kill/scale buttons**. Identifies bleeders, winners, and fatigue.

## Quick Start

```bash
# 1. Clone (this repo includes all 3 sub-repos)
git clone <your-repo-url> bob-for-ads
cd bob-for-ads

# 2. Setup
bash bob/bob.sh setup

# 3. Fill in API keys
cp bob/.env.example bob/.env
# Edit bob/.env with your keys (see below)

# 4. Run the full pipeline
bash bob/bob.sh run https://client-website.com "Client Brand"

# 5. (Optional) Start Slack bot for interactive buttons
bash bob/bob.sh slack-bot
```

## Required API Keys

| Key | Service | Get it from |
|-----|---------|-------------|
| `ANTHROPIC_API_KEY` | Claude AI | [console.anthropic.com](https://console.anthropic.com) |
| `FAL_KEY` | fal.ai images | [fal.ai](https://fal.ai) |
| `FB_ACCESS_TOKEN` | Meta Marketing API | Meta Business Settings |
| `AD_ACCOUNT_ID` | Meta Ad Account | Meta Ads Manager |
| `PAGE_ID` | Meta Page | Meta Business Settings |
| `REPLICATE_API_TOKEN` | Replicate (Flux + Hailuo) | [replicate.com](https://replicate.com) |
| `SLACK_BOT_TOKEN` | Slack notifications | [api.slack.com](https://api.slack.com) |
| `SLACK_SIGNING_SECRET` | Slack verification | Slack App settings |

## Project Structure

```
bob-for-ads/
├── bob/                        # Orchestrator (the glue)
│   ├── bob.sh                  # 1-command entry point
│   ├── orchestrator.py         # Pipeline engine (Brain→Hands→Mouth)
│   ├── adapters/
│   │   └── hands_adapter.py    # Concepts → Meta Live Ads
│   ├── slack/
│   │   └── slack_bot.py        # Interactive Slack button server
│   ├── data/
│   │   └── ad_concepts.schema.json  # Shared data contract
│   ├── .env.example            # Copy to .env and fill in
│   └── logs/                   # Runtime logs
│
├── creative-ad-agent/          # Brain - Claude AI ad concept generator
│   ├── server/                 # Express + WebSocket server (port 3001)
│   ├── client/                 # React frontend
│   └── agent/                  # Claude Agent SDK tools
│
├── meta-ads-ai-agent/          # Hands - Meta ads deployment
│   ├── master_meta_ads_agent.py  # Image gen + campaign deploy
│   └── requirements.txt
│
├── meta-ads-kit/               # Mouth - Monitoring + Slack
│   ├── skills/                 # Monitoring skills
│   ├── run.sh                  # Daily check runner
│   └── SETUP.md
│
├── src/                        # Next.js Dashboard (port 3000)
│   ├── app/
│   │   ├── page.tsx            # Main dashboard UI
│   │   └── api/                # API routes (generate/deploy/monitor/action)
│   ├── components/bob/         # Bob UI components
│   └── store/                  # Zustand state
│
└── package.json
```

## API Routes (Dashboard)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pipeline` | GET | Pipeline status |
| `/api/generate` | POST/GET | Generate ad concepts |
| `/api/deploy` | POST | Deploy campaigns |
| `/api/monitor` | GET | Monitoring data + alerts |
| `/api/action` | POST | Pause/resume/scale ads |

## Commands

```bash
bash bob/bob.sh run <url> <brand>              # Full pipeline
bash bob/bob.sh run <url> <brand> --skip-deploy # Generate only (no live deploy)
bash bob/bob.sh monitor                         # Daily check only
bash bob/bob.sh status                          # Show last pipeline status
bash bob/bob.sh slack-test                      # Test Slack integration
bash bob/bob.sh slack-bot [--port 5000]         # Start Slack bot server
bash bob/bob.sh setup                           # First-time setup
```

## Cost Estimate (per client)

| Item | Cost |
|------|------|
| Claude (Brain - 6 concepts) | ~$0.50 |
| Flux Pro (6 images) | ~$1.80 |
| Hailuo 2 (6 videos, optional) | ~$3.00 |
| Meta Ads (test budget) | $15/day (3×3 CBO) |
| **Total setup** | **~$2.30 - $5.30** |

## Tech Stack

- **Brain**: Claude Agent SDK, fal.ai, Express, WebSocket, React
- **Hands**: Replicate (Flux Pro, Hailuo 2), Meta Graph API v18
- **Mouth**: social-cli, Slack Bolt API
- **Orchestrator**: Python 3, subprocess pipeline
- **Dashboard**: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Framer Motion

## License

MIT
