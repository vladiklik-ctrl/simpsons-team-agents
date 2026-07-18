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
  var STATUSES = ["working", "resting", "question", "idle", "down", "offline"];
  // Display word per status (down = "Crashed"; offline = "Offline").
  var WORDS = {
    working: "Working",
    idle: "Idle",
    question: "Question",
    resting: "Resting",
    down: "Crashed",
    offline: "Offline",
  };
  // Pose frame per status. Offline reuses the calm "resting" pose (greyed via CSS);
  // there is no dedicated offline artwork.
  function poseFor(status) {
    return status === "offline" ? "resting" : status;
  }
  // Same-origin status.json served by Pages from this branch. Pages PURGES its CDN
  // cache on every deploy, so a watchdog push shows up within seconds of the deploy
  // (unlike raw.githubusercontent, which ignores cache-busting and caches 5 min).
  var STATUS_URL = "status.json";
  var POLL_MS = 5000;
  // Cache-busting suffix for emotion images (set in index.html by the stamp
  // step). status.json keeps its own live ?t= buster below.
  var V = window.ASSET_V ? "?v=" + window.ASSET_V : "";

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Preload every real pose so status swaps are instant (no flash). Offline has
  // no artwork (it reuses the resting pose), so only these 5 files exist.
  var POSES = ["working", "resting", "question", "idle", "down"];
  AGENTS.forEach(function (a) {
    POSES.forEach(function (p) {
      var img = new Image();
      img.src = "assets/emotions/" + a + "-" + p + ".webp" + V;
    });
  });

  function applyStatus(agent, status) {
    if (STATUSES.indexOf(status) === -1) return; // ignore unknown values
    var card = document.querySelector('.agent-card[data-agent="' + agent + '"]');
    if (!card || card.dataset.status === status) return; // no change

    card.dataset.status = status; // drives lantern glow + dot + word color (CSS)

    var img = card.querySelector(".agent-card__avatar");
    var word = card.querySelector(".agent-card__status-text");
    if (word) word.textContent = WORDS[status] || cap(status);

    // While a "poke" reaction is showing (poke.js sets data-poked), it owns the
    // avatar image; it will revert to this new status's pose when it ends. We
    // still updated the status/word/lantern above, so only the picture waits.
    if (img && !card.dataset.poked) {
      var src = "assets/emotions/" + agent + "-" + poseFor(status) + ".webp" + V;
      // brief crossfade for a smooth pose change (image is preloaded)
      img.style.opacity = "0";
      window.setTimeout(function () {
        img.src = src;
        img.style.opacity = "1";
      }, 180);
    }
  }

  function poll() {
    fetch(STATUS_URL + "?t=" + Date.now(), { cache: "no-store" })
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
