// Usage: node scripts/bump-version.mjs <patch|minor|major>
// Bumps the version in package.json, tauri.conf.json, Cargo.toml and Cargo.lock, then prints it.
import { readFileSync, writeFileSync } from "node:fs";

const bump = process.argv[2] ?? "patch";
if (!["patch", "minor", "major"].includes(bump)) {
  console.error(`Unknown bump type: ${bump}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
let [major, minor, patch] = pkg.version.split(".").map(Number);
if (bump === "major") [major, minor, patch] = [major + 1, 0, 0];
else if (bump === "minor") [minor, patch] = [minor + 1, 0];
else patch += 1;
const version = `${major}.${minor}.${patch}`;

function update(path, pattern, replacement) {
  const before = readFileSync(path, "utf8");
  const after = before.replace(pattern, replacement);
  if (after === before) throw new Error(`Version not found in ${path}`);
  writeFileSync(path, after);
}

update("package.json", /("version":\s*")[^"]+/, `$1${version}`);
update("src-tauri/tauri.conf.json", /("version":\s*")[^"]+/, `$1${version}`);
update("src-tauri/Cargo.toml", /^(version = ")[^"]+/m, `$1${version}`);
update(
  "src-tauri/Cargo.lock",
  /(name = "tutine"\r?\nversion = ")[^"]+/,
  `$1${version}`,
);

console.log(version);
