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

test("team section has 5 placeholder cards, each with a lantern slot", () => {
  assert.equal(count(/class="team__item"/g), 5, "expected 5 team items");
  assert.equal(count(/class="card"/g), 5, "expected 5 placeholder cards");
  assert.equal(
    count(/class="lantern" aria-hidden="true"/g),
    5,
    "expected 5 decorative lantern slots (aria-hidden)",
  );
});
