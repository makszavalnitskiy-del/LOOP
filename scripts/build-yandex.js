import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const archive = path.join(root, "loop-yandex.zip");
const required = [
  "index.html",
  "style.css",
  "src",
  "assets",
  "vendor/phaser.min.js",
  "assets/fonts/Nunito-Regular.woff2",
  "assets/fonts/Nunito-Bold.woff2"
];
const excluded = new Set([".git", "node_modules", "tests", "README.md", "package.json", "package-lock.json", "dist", "loop-yandex.zip"]);

function exists(relative) {
  return fs.existsSync(path.join(root, relative));
}

function copyTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

const missing = required.filter(item => !exists(item));
if (missing.length) {
  console.error("Yandex build stopped. Required local files are missing:");
  for (const item of missing) console.error(" - " + item);
  console.error("Add the official Phaser 3.80.1 browser build and the two Nunito WOFF2 files, then run npm run build:yandex again.");
  process.exitCode = 1;
} else {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.rmSync(archive, { force: true });
  fs.mkdirSync(dist, { recursive: true });
  for (const item of ["index.html", "style.css", "src", "assets", "vendor"]) {
    const source = path.join(root, item);
    const target = path.join(dist, item);
    if (fs.statSync(source).isDirectory()) copyTree(source, target);
    else fs.copyFileSync(source, target);
  }

  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(dist, "style.css"), "utf8");
  const urls = (html + "\n" + css).match(/https?:\/\/[A-Za-z0-9.-]+/gi) ?? [];
  const external = urls.filter(url => !/^https?:\/\/yandex\.ru\//i.test(url));
  if (external.length) {
    fs.rmSync(dist, { recursive: true, force: true });
    throw new Error("External CDN/URL references found in dist: " + [...new Set(external)].join(", "));
  }

  const zip = spawnSync("zip", ["-qr", archive, "."], { cwd: dist, encoding: "utf8" });
  if (zip.status !== 0) {
    const command = "Compress-Archive -Path * -DestinationPath '" + archive.replace(/'/g, "''") + "' -Force";
    const powershell = spawnSync("powershell", ["-NoProfile", "-Command", command], { cwd: dist, encoding: "utf8" });
    if (powershell.status !== 0) {
      throw new Error("Could not create ZIP archive. Install the zip utility or use PowerShell Compress-Archive.");
    }
  }
  console.log("Yandex build created:");
  console.log(" - dist/");
  console.log(" - loop-yandex.zip");
}
