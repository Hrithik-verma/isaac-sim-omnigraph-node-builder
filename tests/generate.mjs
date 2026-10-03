// Generates a test extension containing every preset node, checks validation
// and the import round trip, and writes the files to disk for Isaac Sim tests.
//
// Usage: node tests/generate.mjs <output-dir>

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";
import {
  PRESETS,
  defaultProject,
  generateFiles,
  importProject,
  validateProject,
  emptyNode,
} from "../assets/generator.js";

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: node tests/generate.mjs <output-dir>");
  process.exit(2);
}

// 1. Every preset in one extension
const project = defaultProject();
project.extension.name = "builder.test.nodes";
project.extension.title = "Builder Test Nodes";
project.extension.authors = "Tester";
project.nodes = Object.values(PRESETS).map((p) => p.node());
const { errors, warnings } = validateProject(project);
assert.deepEqual(errors, [], "presets must validate");
console.log(`presets: ${project.nodes.length} nodes valid, warnings: ${warnings.length}`);

// 2. Validation catches common mistakes
const bad = defaultProject();
bad.extension.name = "Bad Name";
const n = emptyNode("lowercase");
n.inputs = [{ name: "1x", type: "double", default: "abc", uiName: "", description: "" }];
n.outputs = [{ name: "class", type: "double", default: "", uiName: "", description: "" }];
const n2 = { ...emptyNode("Dup"), action: true, inputs: [{ name: "execIn", type: "execution", default: "" }] };
const n3 = { ...emptyNode("Vec"), inputs: [{ name: "v", type: "double[3]", default: "[1, 2]" }] };
bad.nodes = [n, n2, n3];
const badResult = validateProject(bad);
const expect = ["dotted Python identifiers", "PascalCase", "lowercase letter", "Python keyword", "Action Graph switch", "list of 3 numbers"];
for (const e of expect) assert.ok(badResult.errors.some((m) => m.includes(e)), `expected error containing "${e}"`);
console.log(`validation: ${badResult.errors.length} errors caught as expected`);

// 3. Write files
const files = generateFiles(project);
for (const f of files) {
  const p = join(outDir, f.path);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, f.content);
}
console.log(`wrote ${files.length} files to ${outDir}/${project.extension.name}`);

// 4. Import round trip without the project file (edited-by-hand case)
const textFiles = {};
for (const f of files) {
  if (typeof f.content !== "string" || f.path.endsWith(".ogn-builder.json")) continue;
  textFiles[f.path.slice(project.extension.name.length + 1)] = f.content;
}
const { project: back, warnings: importWarnings } = importProject(textFiles, project.extension.name);
assert.deepEqual(importWarnings, []);
assert.equal(back.extension.name, project.extension.name);
assert.equal(back.extension.title, project.extension.title);
assert.equal(back.nodes.length, project.nodes.length);
for (const orig of project.nodes) {
  const got = back.nodes.find((x) => x.name === orig.name);
  assert.ok(got, `node ${orig.name} imported`);
  for (const key of ["code", "imports", "action", "useState", "stateInit", "uiName", "extraCategory"])
    assert.deepEqual(got[key], orig[key], `${orig.name}.${key}`);
  assert.deepEqual(got.inputs.map((a) => [a.name, a.type]), orig.inputs.map((a) => [a.name, a.type]), `${orig.name} inputs`);
  assert.deepEqual(got.outputs.map((a) => [a.name, a.type]), orig.outputs.map((a) => [a.name, a.type]), `${orig.name} outputs`);
}
console.log("import round trip: OK");
