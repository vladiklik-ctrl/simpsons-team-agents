import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const cssPath = fileURLToPath(new URL("../styles.css", import.meta.url));
const css = await readFile(cssPath, "utf8");

test("title color tokens are defined", () => {
  assert.match(css, /--title-yellow:\s*#ffd90f/i, "expected --title-yellow #FFD90F");
  assert.match(css, /--title-outline:\s*#0c1d30/i, "expected --title-outline #0C1D30");
  assert.match(css, /--page-sky:\s*#4fa9e6/i, "expected --page-sky #4FA9E6 to be declared");
});

test("title uses the yellow fill and dark outline", () => {
  assert.match(css, /color:\s*var\(--title-yellow\)/, "title fill should use --title-yellow");
  assert.match(
    css,
    /-webkit-text-stroke:\s*2px\s*var\(--title-outline\)/,
    "title should have a 2px outline using --title-outline",
  );
  assert.match(css, /paint-order:\s*stroke fill/, "stroke should paint under the fill");
});

test("outline has a text-shadow fallback for engines without text-stroke", () => {
  assert.match(css, /@supports not/, "expected an @supports fallback block");
  assert.match(css, /text-shadow:[\s\S]*var\(--title-outline\)/, "fallback should draw the outline");
});

test("step 003 does not change the page background (that is step 004)", () => {
  // Extract the top-level `body { ... }` rule and make sure it sets no background.
  const bodyRule = css.match(/\bbody\s*\{([^}]*)\}/);
  assert.ok(bodyRule, "expected a body rule");
  assert.doesNotMatch(
    bodyRule[1],
    /background/,
    "body must not set a background in step 003 (sky-blue ships in 004)",
  );
});
