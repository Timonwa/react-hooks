// Regenerates the API reference between the api markers in README.md from the source
// JSDoc. Run via `pnpm docs:api`; `pnpm verify` fails if the README is out of date.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = new URL("../src", import.meta.url).pathname;
const README = new URL("../README.md", import.meta.url).pathname;

function collapse(text) {
  return text.replace(/\s+/g, " ").trim();
}

let out = "## API reference\n\nGenerated from the source JSDoc by `pnpm docs:api` — CI fails when it is out of date.\n\n";
for (const file of readdirSync(SRC).sort()) {
  if (!file.match(/\.(ts|tsx)$/) || file === "index.ts" || file.includes(".test.")) continue;
  const source = readFileSync(join(SRC, file), "utf8");
  const exportRe =
    /\/\*\*([\s\S]*?)\*\/\s*export (?:function|const) ([A-Za-z0-9_]+)/g;
  for (const match of source.matchAll(exportRe)) {
    const [, jsdoc, name] = match;
    const lines = jsdoc
      .split("\n")
      .map((l) => l.replace(/^\s*\*\s?/, "").trim())
      .filter(Boolean);
    const description = collapse(
      lines.filter((l) => !l.startsWith("@")).join(" ").split(/(?<=[.!?])\s/)[0] ?? "",
    );
    const example = lines.find((l) => l.startsWith("@example"))?.slice(9).trim();
    out += `- **\`${name}\`** — ${description || "See source."}`;
    if (example) out += ` \`${example}\``;
    out += "\n";
  }
}

const readme = readFileSync(README, "utf8");
const updated = readme.replace(
  /<!-- api:start -->[\s\S]*<!-- api:end -->/,
  `<!-- api:start -->\n\n${out}\n<!-- api:end -->`,
);
writeFileSync(README, updated);
console.log("README API reference regenerated");
