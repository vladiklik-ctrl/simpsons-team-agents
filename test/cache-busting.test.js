import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  computeVersion,
  stampHtml,
  CODE_ASSETS,
  emotionFiles,
} from "../tools/asset-version.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const ver = computeVersion(root);

// If this fails, an asset changed but index.html was not re-stamped: run
// `npm run stamp` and commit the result.
test("index.html carries the current asset version", () => {
  assert.equal(stampHtml(html, ver), html, "stale asset version — run: npm run stamp");
});

test("window.ASSET_V is set to the computed version", () => {
  const m = html.match(/window\.ASSET_V\s*=\s*"([^"]*)"/);
  assert.ok(m, "window.ASSET_V global is missing");
  assert.equal(m[1], ver);
});

test("no cache-busted asset is referenced without ?v=", () => {
  for (const rel of [...CODE_ASSETS, ...emotionFiles(root)]) {
    const bare = new RegExp('(?:href|src)="' + rel.replace(/[.]/g, "\\.") + '"');
    assert.ok(!bare.test(html), "un-stamped reference to " + rel);
  }
});
