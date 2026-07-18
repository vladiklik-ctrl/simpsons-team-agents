/*
  Cache-busting asset version (experiment/live-status branch).

  The version is a hash of the CONTENT of the cache-busted assets, so it only
  changes when one of those files actually changes. tools/stamp-assets.mjs
  writes it into index.html (a ?v=<hash> query on every reference and the
  window.ASSET_V global); the browser then fetches a changed file fresh, without
  a hard refresh, while unchanged files stay cached.

  Shared by the stamp script and the cache-busting test so both agree on the
  algorithm.
*/
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

// Code assets that carry a ?v= cache-buster.
export const CODE_ASSETS = ["styles.css", "live-status.js", "poke.js", "donut-rain.js"];

// Every emotion frame (repo-relative paths), sorted for a stable hash.
export function emotionFiles(root) {
  return readdirSync(join(root, "assets", "emotions"))
    .filter((f) => f.endsWith(".webp"))
    .sort()
    .map((f) => "assets/emotions/" + f);
}

// Short content hash of all cache-busted assets.
export function computeVersion(root) {
  const hash = createHash("md5");
  for (const rel of [...CODE_ASSETS, ...emotionFiles(root)]) {
    hash.update(readFileSync(join(root, rel)));
  }
  return hash.digest("hex").slice(0, 10);
}

// Pure: return index.html with ?v=<ver> on every cache-busted reference and
// window.ASSET_V set to <ver>. Idempotent — strips any existing ?v= first, so
// running it repeatedly is a no-op once stamped.
export function stampHtml(html, ver) {
  html = html.replace(/(window\.ASSET_V\s*=\s*")[^"]*(")/, `$1${ver}$2`);
  const patterns = [
    /(href=")(styles\.css)(?:\?v=[^"]*)?(")/g,
    /(src=")((?:live-status|poke|donut-rain)\.js)(?:\?v=[^"]*)?(")/g,
    /(src=")(assets\/emotions\/[a-z0-9-]+\.webp)(?:\?v=[^"]*)?(")/g,
  ];
  for (const re of patterns) {
    html = html.replace(re, (_m, pre, path, post) => `${pre}${path}?v=${ver}${post}`);
  }
  return html;
}
