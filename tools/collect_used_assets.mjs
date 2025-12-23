import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const entry = path.resolve(root, "index.html");

const seen = new Set();
const used = new Set();

function isExternal(p) {
  return (
    /^([a-z]+:)?\/\//i.test(p) ||
    p.startsWith("mailto:") ||
    p.startsWith("#") ||
    p.startsWith("tel:") ||
    p.startsWith("data:")
  );
}

function addFile(relLike) {
  if (!relLike) return;
  if (isExternal(relLike)) return;

  const clean = relLike.split("?")[0].split("#")[0].trim();
  if (!clean) return;

  const abs = path.resolve(root, clean);
  try {
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) used.add(abs);
  } catch {
    // ignore
  }
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function extractFromHtml(file) {
  const html = readText(file);
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)) addFile(m[1]);
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*'([^']+)'/g)) addFile(m[1]);
}

function extractFromCss(file) {
  const css = readText(file);
  for (const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    const u = m[2].trim();
    if (!u || isExternal(u)) continue;
    const abs = path.resolve(path.dirname(file), u);
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) used.add(abs);
    } catch {
      // ignore
    }
  }
}

function extractFromJs(file) {
  const js = readText(file);
  for (const m of js.matchAll(/\b(?:src|href)\s*:\s*['"]([^'"]+)['"]/g)) addFile(m[1]);
  for (const m of js.matchAll(/['"](assets\/[a-z0-9_\-\/.]+)['"]/gi)) addFile(m[1]);
}

function walkFile(file) {
  if (seen.has(file)) return;
  seen.add(file);
  if (!fs.existsSync(file)) return;

  const ext = path.extname(file).toLowerCase();
  if (ext === ".html") extractFromHtml(file);
  else if (ext === ".css") extractFromCss(file);
  else if (ext === ".js") extractFromJs(file);
}

function listAllFiles(dirAbs, out = []) {
  for (const ent of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    if (ent.name === ".git" || ent.name === "_unused_backup") continue;
    const p = path.join(dirAbs, ent.name);
    if (ent.isDirectory()) listAllFiles(p, out);
    else out.push(p);
  }
  return out;
}

// seed
if (!fs.existsSync(entry)) {
  console.error("No encuentro index.html en", root);
  process.exit(1);
}
used.add(entry);
walkFile(entry);

// fixed point: parse any discovered css/js as well (they may reference more assets)
let changed = true;
while (changed) {
  changed = false;
  const files = [...used];
  const before = used.size;
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (ext === ".css" || ext === ".js") walkFile(f);
  }
  if (used.size !== before) changed = true;
}

const all = listAllFiles(root);
const usedRel = [...used].map((f) => path.relative(root, f)).sort();
const unusedRel = all.filter((f) => !used.has(f)).map((f) => path.relative(root, f)).sort();

fs.writeFileSync(path.join(root, "_used_files.txt"), usedRel.join("\n") + "\n");
fs.writeFileSync(path.join(root, "_unused_files.txt"), unusedRel.join("\n") + "\n");

console.log("used:", usedRel.length);
console.log("unused:", unusedRel.length);







