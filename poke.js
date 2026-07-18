/*
  Card "poke" reaction (experiment/live-status branch, task 030).
  Clicking or tapping an agent card swaps its avatar to the agent's "poked" pose
  for ~0.5 second, then reverts to the pose of the card's CURRENT live status
  (data-status may have changed meanwhile, so it is read at revert time).

  Visual only: no message is sent to the agent yet. The real "notify the agent"
  step is server-side and comes later.

  Coordination with live-status.js: while a poke is showing, the card carries a
  data-poked attribute; live-status.js keeps updating the status/word/lantern but
  leaves the avatar image alone, so the poke owns the picture until it reverts.
*/
(function () {
  "use strict";

  var AGENTS = ["march", "homer", "bart", "lisa", "maggie"];
  var POKE_MS = 500; // how long the poked pose stays up (~0.5s)
  var FADE_MS = 110; // quick crossfade so the reaction feels responsive

  // Cache-busting suffix for emotion images (set in index.html by the stamp step).
  var V = window.ASSET_V ? "?v=" + window.ASSET_V : "";

  // Offline has no artwork; it reuses the calm "resting" pose (mirrors live-status.js).
  function poseFor(status) {
    return status === "offline" ? "resting" : status;
  }
  function statusSrc(agent, status) {
    return "assets/emotions/" + agent + "-" + poseFor(status) + ".webp" + V;
  }
  function pokedSrc(agent) {
    return "assets/emotions/" + agent + "-poked.webp" + V;
  }

  // Preload the poked poses so the first tap swaps instantly (no flash).
  AGENTS.forEach(function (a) {
    var img = new Image();
    img.src = pokedSrc(a);
  });

  // Crossfade an <img> to a new src (the .agent-card__avatar has a CSS opacity
  // transition; the target image is preloaded so the swap has no flash).
  function fadeTo(img, src) {
    img.style.opacity = "0";
    window.setTimeout(function () {
      img.src = src;
      img.style.opacity = "1";
    }, FADE_MS);
  }

  var timers = {}; // agent -> pending revert timeout (a fresh tap restarts the ~1s)

  function poke(card) {
    var agent = card.dataset.agent;
    var img = card.querySelector(".agent-card__avatar");
    if (!agent || !img) return;

    card.dataset.poked = "1"; // ask live-status.js to leave the avatar alone
    fadeTo(img, pokedSrc(agent));

    if (timers[agent]) window.clearTimeout(timers[agent]);
    timers[agent] = window.setTimeout(function () {
      delete timers[agent];
      delete card.dataset.poked; // hand the avatar back to live status
      // Revert to whatever the status is NOW (it may have changed during the poke).
      fadeTo(img, statusSrc(agent, card.dataset.status));
    }, POKE_MS);
  }

  document.querySelectorAll(".agent-card").forEach(function (card) {
    card.addEventListener("click", function () {
      poke(card);
    });
  });
})();
