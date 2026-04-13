#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# Bob for Ads — One Command Pipeline
# Brain → Hands → Mouth
#
# Usage:
#   bash bob.sh run https://example.com "Brand Name"
#   bash bob.sh run https://example.com "Brand Name" --skip-deploy
#   bash bob.sh monitor
#   bash bob.sh status
#   bash bob.sh slack-test
#   bash bob.sh slack-bot
#   bash bob.sh setup
# ═══════════════════════════════════════════════════════════
set -euo pipefail

BOB_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$BOB_DIR")"
BRAIN_DIR="$PROJECT_DIR/creative-ad-agent"
HANDS_DIR="$PROJECT_DIR/meta-ads-ai-agent"
MOUTH_DIR="$PROJECT_DIR/meta-ads-kit"

RED='\033[0;31m'; GRN='\033[0;32m'; YEL='\033[0;33m'; MAG='\033[0;35m'; CYN='\033[0;36m'; BLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
log() { echo -e "${DIM}$(date '+%H:%M:%S')${NC} ${CYN}[BOB]${NC} $1"; }
ok()  { echo -e "${DIM}$(date '+%H:%M:%S')${NC} ${GRN}[OK]${NC} $1"; }
warn(){ echo -e "${DIM}$(date '+%H:%M:%S')${NC} ${YEL}[WARN]${NC} $1"; }
err() { echo -e "${DIM}$(date '+%H:%M:%S')${NC} ${RED}[ERR]${NC} $1"; }
hdr() { echo -e "\n${BLD}${MAG}── $1 ──${NC}"; }

load_env() {
    if [[ -f "$BOB_DIR/.env" ]]; then set -a; source "$BOB_DIR/.env"; set +a; log "Loaded .env"; fi
}

check_python() {
    if command -v python3 &>/dev/null; then PYTHON="python3"
    elif command -v python &>/dev/null; then PYTHON="python"
    else err "Python 3 required"; exit 1; fi
}

cmd_setup() {
    echo -e "\n${BLD}══════════════════════════════════════\n  Bob for Ads — Setup\n══════════════════════════════════════${NC}"
    mkdir -p "$BOB_DIR/data" "$BOB_DIR/logs"
    check_python

    if [[ ! -f "$BOB_DIR/.env" ]] && [[ -f "$BOB_DIR/.env.example" ]]; then
        cp "$BOB_DIR/.env.example" "$BOB_DIR/.env"; ok "Created .env"; fi

    if [[ -d "$BRAIN_DIR/server" ]] && [[ ! -d "$BRAIN_DIR/server/node_modules" ]]; then
        hdr "Installing Brain deps..."; (cd "$BRAIN_DIR/server" && npm install); ok "Brain deps OK"; fi

    if [[ -f "$HANDS_DIR/requirements.txt" ]]; then
        hdr "Installing Hands deps..."; $PYTHON -m pip install -q requests replicate python-dotenv 2>/dev/null; ok "Hands deps OK"; fi

    if ! command -v social &>/dev/null; then
        warn "social-cli missing. Install: npm install -g @vishalgojha/social-cli"; fi

    echo ""; hdr "API Keys:"
    for key in ANTHROPIC_API_KEY FAL_KEY FB_ACCESS_TOKEN AD_ACCOUNT_ID REPLICATE_API_TOKEN; do
        val="${!key:-}"
        [[ -n "$val" && "$val" != *"your_"* && "$val" != *"$"* ]] && ok "$key set" || warn "$key not set"
    done
    echo ""; ok "Setup complete! Run: bash bob.sh run <url> <brand>"
}

cmd_run() {
    local url="${1:?Usage: bob.sh run <url> <brand>}"
    local brand="${2:?Usage: bob.sh run <url> <brand>}"
    shift 2; load_env; mkdir -p "$BOB_DIR/data" "$BOB_DIR/logs"; check_python
    $PYTHON "$BOB_DIR/orchestrator.py" run --url "$url" --brand "$brand" "$@"
}

case "${1:-help}" in
    run) shift; cmd_run "$@" ;;
    monitor) load_env; check_python; mkdir -p "$BOB_DIR/data"; $PYTHON "$BOB_DIR/orchestrator.py" monitor ;;
    status) load_env; check_python; $PYTHON "$BOB_DIR/orchestrator.py" status ;;
    slack-test) load_env; check_python; $PYTHON "$BOB_DIR/orchestrator.py" slack-test ;;
    slack-bot) load_env; check_python; $PYTHON "$BOB_DIR/slack/slack_bot.py" "$@" ;;
    setup) cmd_setup ;;
    help|--help|-h)
        echo -e "\n${BLD}BOB FOR ADS — 1 Command Pipeline${NC}\n"
        echo "  bash bob.sh run <url> <brand>          Full pipeline"
        echo "  bash bob.sh run <url> <brand> --skip-deploy"
        echo "  bash bob.sh monitor                    Daily check only"
        echo "  bash bob.sh status                     Pipeline status"
        echo "  bash bob.sh slack-test                 Test Slack"
        echo "  bash bob.sh slack-bot [--port 5000]    Slack bot server"
        echo "  bash bob.sh setup                      First-time setup"
        ;;
    *) echo "Unknown: $1. Run: bash bob.sh help"; exit 1 ;;
esac
