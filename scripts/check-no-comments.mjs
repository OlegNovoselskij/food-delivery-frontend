import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const targets = ["src", "scripts", "e2e"];
const rootFiles = [
  "vite.config.ts",
  "eslint.config.js",
  "playwright.config.ts",
  "vitest.config.ts",
];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"]);
const ignoredPaths = new Set(["src/api/schema.d.ts"]);
const ignoredDirs = new Set([
  "node_modules",
  "dist",
  "coverage",
  "playwright-report",
  "test-results",
]);
const regexPrefix = new Set([
  "(",
  ",",
  "=",
  ":",
  "[",
  "!",
  "&",
  "|",
  "?",
  "{",
  "}",
  ";",
  "+",
  "-",
  "*",
  "%",
  "<",
  ">",
  "~",
  "^",
]);
const regexKeywords = new Set([
  "return",
  "typeof",
  "case",
  "do",
  "else",
  "in",
  "of",
  "void",
  "yield",
  "await",
]);

function collect(path, files) {
  let stats;
  try {
    stats = statSync(path);
  } catch {
    return;
  }
  if (stats.isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (!ignoredDirs.has(entry)) collect(join(path, entry), files);
    }
  } else if (extensions.has(extname(path))) {
    files.push(path);
  }
}

function lastWord(text, end) {
  let start = end;
  while (start > 0 && /[A-Za-z_$]/.test(text[start - 1])) start -= 1;
  return text.slice(start, end);
}

function findScriptComments(text) {
  const hits = [];
  const templateDepth = [];
  let braceDepth = 0;
  let lastSignificant = "";
  let lastSignificantIndex = -1;
  let i = 0;

  const skipQuoted = (quote) => {
    i += 1;
    while (i < text.length && text[i] !== quote) {
      if (text[i] === "\\") i += 1;
      i += 1;
    }
    i += 1;
  };

  const scanTemplate = () => {
    i += 1;
    while (i < text.length) {
      if (text[i] === "\\") {
        i += 2;
      } else if (text[i] === "`") {
        i += 1;
        return;
      } else if (text[i] === "$" && text[i + 1] === "{") {
        templateDepth.push(braceDepth);
        braceDepth += 1;
        i += 2;
        return;
      } else {
        i += 1;
      }
    }
  };

  while (i < text.length) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "/" && next === "/") {
      hits.push(i);
      while (i < text.length && text[i] !== "\n") i += 1;
    } else if (char === "/" && next === "*") {
      hits.push(i);
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 2;
    } else if (char === '"' || char === "'") {
      skipQuoted(char);
      lastSignificant = char;
    } else if (char === "`") {
      scanTemplate();
      lastSignificant = "`";
    } else if (char === "/") {
      const previousWord =
        lastSignificant && /[A-Za-z_$]/.test(lastSignificant)
          ? lastWord(text, lastSignificantIndex + 1)
          : "";
      const isRegex =
        lastSignificant === "" ||
        regexPrefix.has(lastSignificant) ||
        regexKeywords.has(previousWord);
      if (isRegex) {
        i += 1;
        let inClass = false;
        while (i < text.length && text[i] !== "\n" && (inClass || text[i] !== "/")) {
          if (text[i] === "\\") i += 1;
          else if (text[i] === "[") inClass = true;
          else if (text[i] === "]") inClass = false;
          i += 1;
        }
        i += 1;
        lastSignificant = "/";
        lastSignificantIndex = i - 1;
      } else {
        lastSignificant = "/";
        lastSignificantIndex = i;
        i += 1;
      }
    } else {
      if (char === "{") braceDepth += 1;
      if (char === "}") {
        braceDepth -= 1;
        if (templateDepth.length > 0 && templateDepth[templateDepth.length - 1] === braceDepth) {
          templateDepth.pop();
          i += 1;
          while (i < text.length) {
            if (text[i] === "\\") {
              i += 2;
            } else if (text[i] === "`") {
              i += 1;
              break;
            } else if (text[i] === "$" && text[i + 1] === "{") {
              templateDepth.push(braceDepth);
              braceDepth += 1;
              i += 2;
              break;
            } else {
              i += 1;
            }
          }
          lastSignificant = "`";
          continue;
        }
      }
      if (!/\s/.test(char)) {
        lastSignificant = char;
        lastSignificantIndex = i;
      }
      i += 1;
    }
  }
  return hits;
}

function findCssComments(text) {
  const hits = [];
  const pattern = /\/\*[\s\S]*?\*\//g;
  let match;
  while ((match = pattern.exec(text)) !== null) hits.push(match.index);
  return hits;
}

const files = [];
for (const target of targets) collect(join(root, target), files);
for (const file of rootFiles) collect(join(root, file), files);

const problems = [];
for (const file of files) {
  const rel = relative(root, file).split("\\").join("/");
  if (ignoredPaths.has(rel)) continue;
  const text = readFileSync(file, "utf8");
  const positions = rel.endsWith(".css") ? findCssComments(text) : findScriptComments(text);
  for (const position of positions) {
    const line = text.slice(0, position).split("\n").length;
    problems.push(`${rel}:${line}`);
  }
}

if (problems.length > 0) {
  console.error("Comments are not allowed in this project. Found:");
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`No comments found in ${files.length} files.`);
