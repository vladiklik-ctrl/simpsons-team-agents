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

test("there are 5 agent cards, all default status ready", () => {
  assert.equal(count(/class="agent-card"/g), 5, "expected 5 agent cards");
  assert.equal(
    count(/class="agent-card" data-status="ready"/g),
    5,
    "expected all 5 cards to default to data-status=ready",
  );
  // decorative lantern + status word carry meaning; lantern is aria-hidden
  assert.equal(count(/agent-card__lantern" aria-hidden="true"/g), 5);
  assert.equal(count(/agent-card__status-text">Ready</g), 5);
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
