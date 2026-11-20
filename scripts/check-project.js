import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectories = ["src", "scripts", "tests"];
const files = [];
for (const directory of sourceDirectories) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) continue;
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith(".js")) files.push(full);
    }
  };
  visit(absolute);
}
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(result.stderr || result.stdout);
  }
}
for (const relative of ["index.html", "style.css"]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  const urls = source.match(/https?:\\/\\/[A-Za-z0-9.-]+/gi) ?? [];
  const disallowed = urls.filter(url => !/^https?:\/\/yandex\.ru\//i.test(url));
  if (disallowed.length) {
    failed = true;
    console.error(relative + " contains external URLs: " + disallowed.join(", "));
  }
}
if (!failed) console.log("JavaScript syntax and offline HTML/CSS checks passed (" + files.length + " files).");
else process.exitCode = 1;
