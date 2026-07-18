/*
  Live status (experiment/live-status branch only).
  Polls status.json every ~5s and updates each card's status live: the pose image,
  the lantern glow, the status dot and the status word all change without a reload.

  status.json is fetched from raw.githubusercontent (with a cache-busting query) so
  a watchdog push shows up in a few seconds, without waiting for a Pages redeploy.
  If the file is missing/unreachable the cards keep their current (placeholder)
  status, so the page degrades gracefully.
*/
(function () {
  "use strict";

  var AGENTS = ["march", "homer", "bart", "lisa", "maggie"];
  var STATUSES = ["working", "resting", "question", "idle", "down"];
  var RAW =
    "https://raw.githubusercontent.com/vladiklik-ctrl/simpsons-team-agents/experiment/live-status/status.json";
  var POLL_MS = 5000;

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Preload every pose so status swaps are instant (no flash of a loading image).
  AGENTS.forEach(function (a) {
    STATUSES.forEach(function (s) {
      var img = new Image();
      img.src = "assets/emotions/" + a + "-" + s + ".webp";
    });
  });

  function applyStatus(agent, status) {
    if (STATUSES.indexOf(status) === -1) return; // ignore unknown values
    var card = document.querySelector('.agent-card[data-agent="' + agent + '"]');
    if (!card || card.dataset.status === status) return; // no change

    card.dataset.status = status; // drives lantern glow + dot + word color (CSS)

    var img = card.querySelector(".agent-card__avatar");
    var word = card.querySelector(".agent-card__status-text");
    if (word) word.textContent = cap(status);

    if (img) {
      // brief crossfade for a smooth pose change (image is preloaded)
      img.style.opacity = "0";
      window.setTimeout(function () {
        img.src = "assets/emotions/" + agent + "-" + status + ".webp";
        img.style.opacity = "1";
      }, 180);
    }
  }

  function poll() {
    fetch(RAW + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (!data || !data.agents) return;
        AGENTS.forEach(function (a) {
          if (data.agents[a]) applyStatus(a, data.agents[a]);
        });
      })
      .catch(function () {
        /* transient network error — keep the current status, try again next tick */
      });
  }

  poll();
  window.setInterval(poll, POLL_MS);
})();
