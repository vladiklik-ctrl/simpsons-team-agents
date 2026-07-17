import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const indexPath = fileURLToPath(new URL("../index.html", import.meta.url));

test("index.html contains the site heading", async () => {
  const html = await readFile(indexPath, "utf8");
  assert.match(
    html,
    /<h1[^>]*>\s*simpsons team agents\s*<\/h1>/,
    "expected an <h1> heading with the text 'simpsons team agents'",
  );
});

test("index.html opts out of browser auto dark theme", async () => {
  const html = await readFile(indexPath, "utf8");
  assert.match(
    html,
    /<meta\s+name="color-scheme"\s+content="(only\s+)?light"/,
    "expected a <meta name=\"color-scheme\" content=\"only light\"> opt-out",
  );
});
