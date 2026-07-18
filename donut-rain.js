/*
  Easter egg: donut rain (experiment/live-status branch, task 031).

  Clicking/tapping the Homer card MORE than 5 times within a sliding 10-second
  window (i.e. the 6th click in 10s) starts a 5-second rain of pink donuts (🍩).
  The normal 0.5s poke reaction (poke.js) still happens on every click — this is
  an extra decorative layer on top.

  Visual only: no server. The overlay is fixed, pointer-events:none and a high
  z-index, so it never blocks clicks or the interface. Each donut animates only
  transform (translateY to fall, rotate to spin) + opacity. Donuts are removed
  from the DOM when they finish falling; the overlay is removed once the last one
  lands, so nothing leaks. Re-triggering while it is already raining is ignored,
  so the effect never stacks endlessly.
*/
(function () {
  "use strict";

  var WINDOW_MS = 10000; // sliding click window
  var THRESHOLD = 5; // strictly more than this many clicks in the window triggers
  var SPAWN_MS = 5000; // keep spawning donuts for this long
  var BASE_REM = 2.4; // base donut size
  var SPAWN_GAP_MIN = 70; // ms between spawns (randomised -> chaotic timing)
  var SPAWN_GAP_MAX = 200;

  var homer = document.querySelector('.agent-card[data-agent="homer"]');
  if (!homer) return;

  var raining = false;
  var clicks = []; // timestamps of recent Homer clicks

  homer.addEventListener("click", function () {
    var now = Date.now();
    clicks.push(now);
    // drop clicks older than the window
    clicks = clicks.filter(function (t) {
      return now - t <= WINDOW_MS;
    });
    if (clicks.length > THRESHOLD) {
      clicks.length = 0; // reset the streak so further clicks don't retrigger
      startRain();
    }
  });

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function startRain() {
    if (raining) return; // already raining -> don't stack
    raining = true;

    var layer = document.createElement("div");
    layer.className = "donut-rain";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    var active = 0; // donuts currently falling
    var spawnEnd = Date.now() + SPAWN_MS;

    function finishMaybe() {
      // Overlay is gone only once spawning stopped AND every donut has landed.
      if (active === 0 && Date.now() >= spawnEnd) {
        layer.remove();
        raining = false;
      }
    }

    function spawnOne() {
      var drop = document.createElement("div");
      drop.className = "donut-rain__drop";
      drop.style.left = rand(1, 95) + "vw"; // random horizontal position
      drop.style.fontSize = (BASE_REM * rand(0.8, 1.2)).toFixed(3) + "rem"; // size ±~20%
      drop.style.animationDuration = rand(2.4, 3.6).toFixed(3) + "s"; // fall speed ±~20%

      var spin = document.createElement("span");
      spin.className = "donut-rain__spin";
      spin.textContent = "🍩"; // 🍩
      spin.style.animationDuration = rand(0.8, 2.2).toFixed(3) + "s"; // own spin speed
      if (Math.random() < 0.5) spin.style.animationDirection = "reverse"; // random direction
      drop.appendChild(spin);

      active++;
      drop.addEventListener("animationend", function (e) {
        if (e.animationName !== "donut-fall") return; // ignore the infinite spin
        drop.remove();
        active--;
        finishMaybe();
      });
      layer.appendChild(drop);
    }

    function tick() {
      if (Date.now() < spawnEnd) {
        spawnOne();
        window.setTimeout(tick, rand(SPAWN_GAP_MIN, SPAWN_GAP_MAX));
      } else {
        finishMaybe(); // spawning done; overlay leaves once the last donut lands
      }
    }
    tick();
  }
})();
