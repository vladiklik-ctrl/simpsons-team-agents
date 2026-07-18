# Live-status watchdog

`watchdog.sh` decides each agent's status from its tmux pane (+ optional
`/home/vladiklik/status/<agent>.status` override) and pushes `status.json` to this
branch on change. The page polls `status.json` (same-origin) and updates the cards.

## Run as a persistent service (systemd --user, no sudo)

    cp tools/simpsons-watchdog.service ~/.config/systemd/user/
    systemctl --user daemon-reload
    systemctl --user enable --now simpsons-watchdog.service
    loginctl enable-linger vladiklik      # keep it running with no login session

    systemctl --user status  simpsons-watchdog.service   # check
    journalctl --user -u simpsons-watchdog.service -f    # logs
    systemctl --user restart simpsons-watchdog.service   # after editing the script
    systemctl --user stop    simpsons-watchdog.service   # stop

It runs in the dedicated worktree `STATUS_REPO_DIR=/home/vladiklik/status-writer`
so it never collides with the main checkout (single writer of status.json).

## Ad-hoc (no systemd)

    STATUS_REPO_DIR=/home/vladiklik/status-writer nohup bash tools/watchdog.sh >/home/vladiklik/watchdog.log 2>&1 &
