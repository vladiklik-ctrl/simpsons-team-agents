/*
  Stamp index.html with the current asset version (npm run stamp).

  Run this whenever a cache-busted asset (styles.css, the scripts, or an emotion
  .webp) changes, before committing/deploying. It rewrites the ?v=<hash> queries
  and the window.ASSET_V global in index.html so the branch serves fresh assets
  without a hard refresh. Idempotent — safe to run any time. The cache-busting
  test fails if index.html is left un-stamped.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeVersion, stampHtml } from "./asset-version.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "index.html");
const ver = computeVersion(root);
const before = readFileSync(file, "utf8");
const after = stampHtml(before, ver);
if (after !== before) writeFileSync(file, after);
console.log(`asset version v=${ver}${after !== before ? " (index.html updated)" : " (already current)"}`);
