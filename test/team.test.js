import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const html = await readFile(
  fileURLToPath(new URL("../index.html", import.meta.url)),
  "utf8",
);

const count = (re) => (html.match(re) ?? []).length;

test("team section is a labelled landmark with a heading", () => {
  assert.match(html, /<section class="team" aria-labelledby="team-heading">/);
  assert.match(html, /<h2 id="team-heading"[^>]*>\s*Team\s*<\/h2>/);
});

// agent -> [demo status, status word]. Demo/placeholder layout so all 5 poses show.
const DEMO = [
  ["march", "working", "Working"],
  ["homer", "resting", "Resting"],
  ["bart", "question", "Question"],
  ["lisa", "idle", "Idle"],
  ["maggie", "down", "Down"],
];

test("5 agent cards, each with its demo status (color + word) and lantern", () => {
  assert.equal(count(/class="agent-card"/g), 5, "expected 5 agent cards");
  assert.equal(count(/agent-card__lantern" aria-hidden="true"/g), 5);
  for (const [, status, word] of DEMO) {
    assert.match(
      html,
      new RegExp(`class="agent-card" data-status="${status}"`),
      `expected a card with data-status=${status}`,
    );
    assert.match(
      html,
      new RegExp(`agent-card__status-text">${word}</span>`),
      `expected the "${word}" status word`,
    );
  }
});

test("each card shows its agent's emotion frame for its status", () => {
  assert.equal(count(/class="agent-card__avatar"/g), 5, "expected 5 panel images");
  for (const [agent, status] of DEMO) {
    assert.match(
      html,
      new RegExp(
        `<img class="agent-card__avatar" src="assets/emotions/${agent}-${status}\\.webp" alt=""`,
      ),
      `expected ${agent} to show the ${status} emotion frame`,
    );
  }
});

test("cards carry the real team data (name + role)", () => {
  for (const [name, role] of [
    ["March", "Orchestrator"],
    ["Homer", "Developer"],
    ["Bart", "Reviewer"],
    ["Lisa", "Reviewer"],
    ["Maggie", "Designer"],
  ]) {
    assert.match(
      html,
      new RegExp(`agent-card__name">${name}</p>`),
      `expected a name plate for ${name}`,
    );
    assert.match(
      html,
      new RegExp(`agent-card__role">${role}</p>`),
      `expected a role plate "${role}"`,
    );
  }
});
