#!/usr/bin/env bash
#
# Live-status watchdog (experiment/live-status branch).
#
# Single writer of status.json. Every ~7s it decides each agent's status and,
# ONLY when something changed, writes status.json and commits+pushes it to the
# branch (no spam). The site polls status.json (from raw.githubusercontent) and
# updates the cards live.
#
# Status per agent (march/homer/bart/lisa/maggie):
#   - self-report override file /home/vladiklik/status/<agent>.status (if present
#     and holds a valid status word) wins — lets an agent report e.g. question/idle
#   - else, from its tmux session pane:
#       * no tmux session .......................... down
#       * pane shows "esc to interrupt" (busy) ..... working
#       * pane shows the Claude prompt "❯" (idle) .. resting
#       * session exists but no Claude UI (crashed). down
#
# Resting debounce: an agent that works in bursts (short pauses between steps)
# would otherwise flip working<->resting and look like an idler. So "resting" is
# only reported after the agent has been idle for DEBOUNCE seconds IN A ROW; a
# shorter pause holds the previous "working". down/working are reported at once.
#
# Run:   nohup bash tools/watchdog.sh >/home/vladiklik/watchdog.log 2>&1 &
# Stop:  pkill -f tools/watchdog.sh
# It operates in a dedicated worktree (STATUS_REPO_DIR) so it never collides with
# the main dev checkout — it is the only thing that commits status.json.
#
set -uo pipefail

REPO_DIR="${STATUS_REPO_DIR:-/home/vladiklik/status-writer}"
BRANCH="experiment/live-status"
OVERRIDE_DIR="/home/vladiklik/status"
INTERVAL="${WATCHDOG_INTERVAL:-7}"
# Hold "working" through idle gaps shorter than this many seconds (anti-flicker).
DEBOUNCE="${WATCHDOG_DEBOUNCE:-25}"
AGENTS=(march homer bart lisa maggie)
VALID=" working resting question idle down "
GIT_NAME="Homer"
GIT_EMAIL="yf@getamplify.team"

is_valid() { case "$VALID" in *" $1 "*) return 0 ;; *) return 1 ;; esac; }

detect() {
  local a="$1" ov v pane
  ov="$OVERRIDE_DIR/$a.status"
  if [ -f "$ov" ]; then
    v="$(tr '[:upper:]' '[:lower:]' <"$ov" | tr -d '[:space:]')"
    if is_valid "$v"; then printf '%s' "$v"; return; fi
  fi
  if ! tmux has-session -t "$a" 2>/dev/null; then printf 'down'; return; fi
  # Look ONLY at the CURRENT visible bottom of the pane (no scrollback) so stale
  # "esc to interrupt" left in the history can't be mistaken for busy. The live
  # busy indicator lives in the bottom status bar for both Claude ("esc to
  # interrupt") and Codex ("Working (… esc to interrupt)"). Re-evaluated every
  # cycle, so a return to idle flips it straight back to resting.
  bottom="$(tmux capture-pane -pt "$a" 2>/dev/null | grep -vE '^[[:space:]]*$' | tail -n 6 || true)"
  if printf '%s' "$bottom" | grep -qiE 'esc to interrupt'; then printf 'working'; return; fi
  # crashed: the CLI exited to a bare shell prompt (last non-blank line is a shell)
  if printf '%s\n' "$bottom" | tail -1 \
       | grep -qE '[[:alnum:]._-]+@[[:alnum:]._-]+.*[$#][[:space:]]*$'; then printf 'down'; return; fi
  # session alive at an idle prompt (Claude "❯", Codex "›", or any) -> resting
  printf 'resting'
}

cd "$REPO_DIR" || { echo "watchdog: repo dir not found: $REPO_DIR" >&2; exit 1; }
mkdir -p "$OVERRIDE_DIR"

prev=""
declare -A last_working  # agent -> epoch seconds of its most recent "working"
while true; do
  agents_json=""
  now_epoch="$(date +%s)"
  for a in "${AGENTS[@]}"; do
    raw="$(detect "$a")"
    st="$raw"
    if [ "$raw" = "working" ]; then
      last_working["$a"]="$now_epoch"
    elif [ "$raw" = "resting" ]; then
      # Hold "working" until the agent has been idle for DEBOUNCE seconds in a row.
      lw="${last_working[$a]:-0}"
      if [ "$((now_epoch - lw))" -lt "$DEBOUNCE" ]; then st="working"; fi
    fi
    agents_json="${agents_json}\"${a}\":\"${st}\","
  done
  agents_json="${agents_json%,}"

  if [ "$agents_json" != "$prev" ]; then
    now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '{"agents":{%s},"updated":"%s"}\n' "$agents_json" "$now" >status.json
    git add status.json
    if git -c user.name="$GIT_NAME" -c user.email="$GIT_EMAIL" \
         commit -q -m "status: live update ($now)" 2>/dev/null; then
      tries=0
      until git push -q origin "$BRANCH" 2>/dev/null; do
        tries=$((tries + 1))
        if [ "$tries" -ge 5 ]; then echo "watchdog: push failed after retries" >&2; break; fi
        git pull -q --rebase origin "$BRANCH" 2>/dev/null || true
        sleep 2
      done
    fi
    prev="$agents_json"
  fi
  sleep "$INTERVAL"
done
