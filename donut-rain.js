/*
  Easter egg: donut rain (experiment/live-status branch, task 031).

  Clicking/tapping the Homer card MORE than 5 times within a sliding 10-second
  window (i.e. the 6th click in 10s) starts a 5-second rain of pink donuts (🍩).
  The normal 0.5s poke reaction (poke.js) still happens on every click — this is
  an extra decorative layer on top.

  Rains STACK: every fresh streak of 6 clicks launches another 5s rain on top of
  whatever is already falling, so spamming clicks buries the screen in donuts.
  The click counter resets after each trigger, so the next 6 clicks trigger
  again. A generous global cap (MAX_DONUTS) keeps the browser safe — once that
  many donuts are on screen, spawning pauses until some land.

  Visual only: no server. One shared overlay (fixed, pointer-events:none, high
  z-index) never blocks clicks or the interface. Each donut animates only
  transform (translateY to fall, rotate to spin) + opacity, is removed from the
  DOM when it lands, and the overlay is removed once the screen is clear again —
  so nothing leaks.
*/
(function () {
  "use strict";

  var WINDOW_MS = 10000; // sliding click window
  var THRESHOLD = 5; // strictly more than this many clicks in the window triggers
  var SPAWN_MS = 5000; // each rain spawns donuts for this long
  var BASE_REM = 2.4; // base donut size
  var SPAWN_GAP_MIN = 70; // ms between spawns per rain (randomised -> chaotic timing)
  var SPAWN_GAP_MAX = 200;
  var MAX_DONUTS = 400; // hard cap on donuts on screen at once (browser safety)

  var homer = document.querySelector('.agent-card[data-agent="homer"]');
  if (!homer) return;

  var clicks = []; // timestamps of recent Homer clicks
  var layer = null; // shared overlay, created on demand, removed when empty
  var totalDonuts = 0; // donuts currently in the DOM (across all stacked rains)
  var activeRains = 0; // rains still spawning

  homer.addEventListener("click", function () {
    var now = Date.now();
    clicks.push(now);
    clicks = clicks.filter(function (t) {
      return now - t <= WINDOW_MS;
    });
    if (clicks.length > THRESHOLD) {
      clicks.length = 0; // reset so the next 6 clicks trigger another rain
      startRain(); // stacks on top of any rain already falling
    }
  });

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function ensureLayer() {
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "donut-rain";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    return layer;
  }

  function maybeRemoveLayer() {
    // Overlay leaves only once every rain has stopped AND every donut has landed.
    if (layer && totalDonuts === 0 && activeRains === 0) {
      layer.remove();
      layer = null;
    }
  }

  function spawnOne() {
    if (totalDonuts >= MAX_DONUTS) return; // at the cap -> pause spawning until some land

    var drop = document.createElement("div");
    drop.className = "donut-rain__drop";
    drop.style.left = rand(1, 95) + "vw"; // random horizontal position
    drop.style.fontSize = (BASE_REM * rand(0.8, 1.2)).toFixed(3) + "rem"; // size ±~20%
    drop.style.animationDuration = rand(2.4, 3.6).toFixed(3) + "s"; // fall speed ±~20%

    var spin = document.createElement("span");
    spin.className = "donut-rain__spin";
    spin.textContent = "🍩";
    spin.style.animationDuration = rand(0.8, 2.2).toFixed(3) + "s"; // own spin speed
    if (Math.random() < 0.5) spin.style.animationDirection = "reverse"; // random direction
    drop.appendChild(spin);

    totalDonuts++;
    drop.addEventListener("animationend", function (e) {
      if (e.animationName !== "donut-fall") return; // ignore the infinite spin
      drop.remove();
      totalDonuts--;
      maybeRemoveLayer();
    });
    ensureLayer().appendChild(drop);
  }

  function startRain() {
    ensureLayer();
    activeRains++;
    var spawnEnd = Date.now() + SPAWN_MS;

    function tick() {
      if (Date.now() < spawnEnd) {
        spawnOne();
        window.setTimeout(tick, rand(SPAWN_GAP_MIN, SPAWN_GAP_MAX));
      } else {
        activeRains--;
        maybeRemoveLayer(); // in case this rain hit the cap and added nothing
      }
    }
    tick();
  }
})();
