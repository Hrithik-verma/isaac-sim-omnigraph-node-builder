// Isaac Sim OmniGraph Node Builder - extension generator.
//
// Pure functions with no DOM access, so the same module runs in the browser,
// in Node.js (tests/generate.mjs) and later inside a VS Code webview.
//
// The generated layout is a Python-only OmniGraph extension that Kit loads
// without a build step: OmniGraph scans <ext>/<module path>/ for .ogn files
// and generates the node database at startup (Isaac Sim 5.x, 6.x, 7.0).

export const GENERATOR_VERSION = "1.0.0";
export const PROJECT_SCHEMA = 1;
export const PROJECT_FILE = ".ogn-builder.json";

const USER_BEGIN = "# --- BEGIN USER CODE ---";
const USER_END = "# --- END USER CODE ---";
const IMPORTS_BEGIN = "# --- BEGIN USER IMPORTS ---";
const IMPORTS_END = "# --- END USER IMPORTS ---";
const STATE_BEGIN = "# --- BEGIN USER STATE ---";
const STATE_END = "# --- END USER STATE ---";

// kind: how the default value is parsed / validated
// size: tuple size (for tuple kinds)
export const ATTRIBUTE_TYPES = [
  { type: "bool", group: "Scalar", kind: "bool", default: "false" },
  { type: "int", group: "Scalar", kind: "int", default: "0" },
  { type: "int64", group: "Scalar", kind: "int", default: "0" },
  { type: "uint", group: "Scalar", kind: "uint", default: "0" },
  { type: "uint64", group: "Scalar", kind: "uint", default: "0" },
  { type: "float", group: "Scalar", kind: "number", default: "0.0" },
  { type: "double", group: "Scalar", kind: "number", default: "0.0" },
  { type: "token", group: "Text", kind: "text", default: "" },
  { type: "string", group: "Text", kind: "text", default: "" },
  { type: "int[2]", group: "Tuple", kind: "tuple", size: 2, default: "[0, 0]" },
  { type: "int[3]", group: "Tuple", kind: "tuple", size: 3, default: "[0, 0, 0]" },
  { type: "float[2]", group: "Tuple", kind: "tuple", size: 2, default: "[0.0, 0.0]" },
  { type: "float[3]", group: "Tuple", kind: "tuple", size: 3, default: "[0.0, 0.0, 0.0]" },
  { type: "float[4]", group: "Tuple", kind: "tuple", size: 4, default: "[0.0, 0.0, 0.0, 0.0]" },
  { type: "double[2]", group: "Tuple", kind: "tuple", size: 2, default: "[0.0, 0.0]" },
  { type: "double[3]", group: "Tuple", kind: "tuple", size: 3, default: "[0.0, 0.0, 0.0]" },
  { type: "double[4]", group: "Tuple", kind: "tuple", size: 4, default: "[0.0, 0.0, 0.0, 0.0]" },
  { type: "vectord[3]", group: "Tuple", kind: "tuple", size: 3, default: "[0.0, 0.0, 0.0]" },
  { type: "pointd[3]", group: "Tuple", kind: "tuple", size: 3, default: "[0.0, 0.0, 0.0]" },
  { type: "colorf[3]", group: "Tuple", kind: "tuple", size: 3, default: "[1.0, 1.0, 1.0]" },
  { type: "colorf[4]", group: "Tuple", kind: "tuple", size: 4, default: "[1.0, 1.0, 1.0, 1.0]" },
  { type: "quatd[4]", group: "Tuple", kind: "tuple", size: 4, default: "[0.0, 0.0, 0.0, 1.0]" },
  { type: "bool[]", group: "Array", kind: "array", default: "[]" },
  { type: "int[]", group: "Array", kind: "array", default: "[]" },
  { type: "float[]", group: "Array", kind: "array", default: "[]" },
  { type: "double[]", group: "Array", kind: "array", default: "[]" },
  { type: "token[]", group: "Array", kind: "array", default: "[]" },
  { type: "double[3][]", group: "Array", kind: "array", default: "[]" },
  { type: "float[3][]", group: "Array", kind: "array", default: "[]" },
  { type: "execution", group: "Flow", kind: "execution", default: "" },
];

const TYPE_INFO = Object.fromEntries(ATTRIBUTE_TYPES.map((t) => [t.type, t]));

export const BUILTIN_CATEGORIES = [
  "math:operator",
  "math:condition",
  "math:conversion",
  "math:array",
  "flowControl",
  "function",
  "time",
  "sceneGraph",
  "event",
  "debug",
];

export const SUPPORTED_VERSIONS = [
  { label: "Isaac Sim 5.0", kit: "107.3", python: "3.11", status: "tested" },
  { label: "Isaac Sim 5.1", kit: "107.3", python: "3.11", status: "same Kit as 5.0" },
  { label: "Isaac Sim 6.1", kit: "110.3", python: "3.12", status: "tested" },
  { label: "Isaac Sim 7.0 (alpha)", kit: "110.3", python: "3.12", status: "same Kit as 6.1" },
];

const PY_KEYWORDS = new Set(
  ("False None True and as assert async await break class continue def del elif else except " +
    "finally for from global if import in is lambda nonlocal not or pass raise return try while with yield")
    .split(" ")
);

const EXEC_IN = { name: "execIn", uiName: "Exec In", type: "execution", default: "", description: "Signal that triggers this node" };
const EXEC_OUT = { name: "execOut", uiName: "Exec Out", type: "execution", default: "", description: "Signal sent after this node runs" };

// 1x1 transparent PNG, used when the caller does not supply rendered icons.
const FALLBACK_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

// ---------------------------------------------------------------------------
// Project model helpers

export function emptyAttribute(type = "double") {
  return { name: "", uiName: "", type, default: TYPE_INFO[type]?.default ?? "", description: "" };
}

export function emptyNode(name = "MyNode") {
  return {
    name,
    uiName: splitWords(name),
    description: "",
    extraCategory: "",
    action: false,
    useState: false,
    inputs: [],
    outputs: [],
    imports: "",
    stateInit: "",
    code: "pass",
  };
}

export function defaultProject() {
  return {
    schema: PROJECT_SCHEMA,
    extension: {
      name: "my.omnigraph.examples",
      title: "My OmniGraph Nodes",
      version: "0.1.0",
      description: "Custom OmniGraph nodes for Isaac Sim",
      authors: "",
      category: "Graph",
      nodeCategory: "myNodes",
      nodeCategoryDescription: "My custom nodes",
    },
    nodes: [],
  };
}

export function splitWords(name) {
  return String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim();
}

export function modulePath(extName) {
  return extName.split(".").join("/");
}

export function nodeTypeName(project, node) {
  return `${project.extension.name}.${node.name}`;
}

export function allInputs(node) {
  return node.action ? [EXEC_IN, ...node.inputs] : node.inputs;
}

export function allOutputs(node) {
  return node.action ? [EXEC_OUT, ...node.outputs] : node.outputs;
}

export function typeInfo(type) {
  return TYPE_INFO[type];
}

// ---------------------------------------------------------------------------
// Validation

function parseDefault(attr) {
  const info = TYPE_INFO[attr.type];
  const raw = String(attr.default ?? "").trim();
  if (!info) return { error: `unknown type "${attr.type}"` };
  if (info.kind === "execution") return { skip: true };
  if (info.kind === "text") return { value: String(attr.default ?? "") };
  if (raw === "") return { skip: true };
  if (info.kind === "bool") {
    const v = raw.toLowerCase();
    if (v === "true" || v === "1") return { value: true };
    if (v === "false" || v === "0") return { value: false };
    return { error: "must be true or false" };
  }
  if (info.kind === "int" || info.kind === "uint") {
    if (!/^[-+]?\d+$/.test(raw)) return { error: "must be a whole number" };
    const value = parseInt(raw, 10);
    if (info.kind === "uint" && value < 0) return { error: "must not be negative" };
    return { value };
  }
  if (info.kind === "number") {
    const value = Number(raw);
    if (!Number.isFinite(value)) return { error: "must be a number" };
    return { value };
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return { error: "must be a JSON list, e.g. [1.0, 2.0, 3.0]" };
  }
  if (!Array.isArray(value)) return { error: "must be a JSON list" };
  if (info.kind === "tuple") {
    if (value.length !== info.size || !value.every((v) => typeof v === "number"))
      return { error: `must be a list of ${info.size} numbers` };
  }
  return { value };
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function validateProject(project) {
  const errors = [];
  const warnings = [];
  const ext = project.extension || {};
  const segs = String(ext.name || "").split(".");

  if (!ext.name) errors.push("Extension name is required.");
  else if (segs.length < 2 || !segs.every((s) => IDENT.test(s)))
    errors.push(`Extension name "${ext.name}" must be dotted Python identifiers, e.g. my.robot.nodes`);
  else {
    if (segs.some((s) => PY_KEYWORDS.has(s))) errors.push(`Extension name "${ext.name}" uses a Python keyword.`);
    if (/[A-Z]/.test(ext.name)) warnings.push("Extension names are usually all lowercase.");
    if (segs[0] === "omni" || segs[0] === "isaacsim")
      warnings.push(`"${segs[0]}." is NVIDIA's namespace; a personal prefix avoids clashes.`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(String(ext.version || ""))) errors.push("Version must look like 1.0.0");
  if (!String(ext.title || "").trim()) errors.push("Extension title is required.");
  if (!IDENT.test(String(ext.nodeCategory || ""))) errors.push("Node category id must be a simple identifier, e.g. myNodes");

  if (!project.nodes || project.nodes.length === 0) errors.push("Add at least one node.");
  const seen = new Set();
  for (const node of project.nodes || []) {
    const label = node.name || "(unnamed node)";
    if (!/^[A-Z][A-Za-z0-9]*$/.test(node.name || ""))
      errors.push(`Node "${label}": name must be PascalCase letters/digits, e.g. MultiplyNumbers`);
    if (seen.has(node.name)) errors.push(`Node "${label}" is defined twice.`);
    seen.add(node.name);
    if (!String(node.code || "").trim()) errors.push(`Node "${label}": compute code is empty (use "pass").`);

    for (const [side, list] of [["input", allInputs(node)], ["output", allOutputs(node)]]) {
      const names = new Set();
      for (const attr of list) {
        const where = `Node "${label}" ${side} "${attr.name || "?"}"`;
        if (!/^[a-z][A-Za-z0-9_]*$/.test(attr.name || ""))
          errors.push(`${where}: name must start with a lowercase letter (camelCase).`);
        else if (PY_KEYWORDS.has(attr.name)) errors.push(`${where}: "${attr.name}" is a Python keyword.`);
        if (names.has(attr.name)) {
          const clash = node.action && (attr.name === "execIn" || attr.name === "execOut");
          errors.push(clash ? `${where}: already added by the Action Graph switch.` : `${where}: duplicate name.`);
        }
        names.add(attr.name);
        if (!TYPE_INFO[attr.type]) errors.push(`${where}: unknown type "${attr.type}".`);
        else if (side === "input") {
          const d = parseDefault(attr);
          if (d.error) errors.push(`${where}: default ${d.error}.`);
        }
      }
    }
    if (allOutputs(node).length === 0) warnings.push(`Node "${label}" has no outputs.`);
  }
  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// File content generators

function tomlString(value) {
  return `"${String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
}

function tomlList(values) {
  return `[${values.map(tomlString).join(", ")}]`;
}

function csv(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function extensionToml(project) {
  const ext = project.extension;
  return `# Generated by Isaac Sim OmniGraph Node Builder ${GENERATOR_VERSION}
# Python-only OmniGraph extension: no build step needed (Isaac Sim 5.x / 6.x / 7.0).

[package]
version = ${tomlString(ext.version)}
title = ${tomlString(ext.title)}
description = ${tomlString(ext.description)}
category = ${tomlString(ext.category || "Graph")}
authors = ${tomlList(csv(ext.authors))}
keywords = ["isaac sim", "omnigraph", "action graph", "nodes"]
changelog = "docs/CHANGELOG.md"
readme = "docs/README.md"
icon = "data/icon.png"
preview_image = "data/preview.png"

[core]
reloadable = true

[dependencies]
"omni.graph" = {}

# OmniGraph scans this module's folder for .ogn/.py pairs and registers the nodes.
[[python.module]]
name = ${tomlString(ext.name)}

# Reload node definitions when they change on disk.
[fswatcher.patterns]
include = ["*.ogn", "*.py"]
exclude = ["Ogn*Database.py"]
`;
}

function ognAttribute(attr, isInput) {
  const out = {
    type: attr.type,
    uiName: attr.uiName || splitWords(attr.name),
    description: attr.description || splitWords(attr.name),
  };
  if (isInput) {
    const d = parseDefault(attr);
    if (!d.skip && !d.error) out.default = d.value;
  }
  return out;
}

export function ognJson(project, node) {
  const ext = project.extension;
  const categories = [ext.nodeCategory];
  if (node.extraCategory) categories.push(node.extraCategory);
  const def = {
    version: 1,
    language: "python",
    icon: "icons/icon.svg",
    uiName: node.uiName || splitWords(node.name),
    description: node.description || node.uiName || splitWords(node.name),
    categoryDefinitions: "config/CategoryDefinition.json",
    categories,
  };
  const inputs = allInputs(node);
  const outputs = allOutputs(node);
  if (inputs.length) def.inputs = Object.fromEntries(inputs.map((a) => [a.name, ognAttribute(a, true)]));
  if (outputs.length) def.outputs = Object.fromEntries(outputs.map((a) => [a.name, ognAttribute(a, false)]));
  return JSON.stringify({ [node.name]: def }, null, 4) + "\n";
}

function indent(text, spaces) {
  const pad = " ".repeat(spaces);
  return String(text)
    .replace(/\t/g, "    ")
    .split("\n")
    .map((line) => (line.trim() ? pad + line : ""))
    .join("\n");
}

function attrDoc(list, prefix) {
  if (!list.length) return `    (none)`;
  return list.map((a) => `    db.${prefix}.${a.name} (${a.type})${a.description ? ": " + a.description : ""}`).join("\n");
}

export function nodePython(project, node) {
  const cls = `Ogn${node.name}`;
  const userImports = String(node.imports || "").trim();
  const lines = [];
  lines.push(`"""${node.uiName || splitWords(node.name)}: ${nodeTypeName(project, node)}`);
  lines.push("");
  if (node.description) lines.push(node.description, "");
  lines.push("Inputs:", attrDoc(allInputs(node), "inputs"));
  lines.push("Outputs:", attrDoc(allOutputs(node), "outputs"));
  lines.push("");
  lines.push(`Generated by Isaac Sim OmniGraph Node Builder ${GENERATOR_VERSION}.`);
  lines.push("Edit the code between the BEGIN/END markers; the builder can re-import it.");
  lines.push(`"""`);
  lines.push("");
  lines.push("import omni.graph.core as og");
  lines.push("");
  lines.push(IMPORTS_BEGIN);
  if (userImports) lines.push(userImports);
  lines.push(IMPORTS_END);
  lines.push("");
  lines.push("");
  if (node.useState) {
    lines.push(`class ${cls}InternalState:`);
    lines.push(`    """Per-node state that persists between compute() calls"""`);
    lines.push("");
    lines.push("    def __init__(self):");
    lines.push(`        ${STATE_BEGIN}`);
    lines.push(indent(String(node.stateInit || "").trim() || "pass", 8));
    lines.push(`        ${STATE_END}`);
    lines.push("");
    lines.push("");
  }
  lines.push(`class ${cls}:`);
  lines.push(`    """${(node.description || node.uiName || node.name).replace(/"""/g, "")}"""`);
  lines.push("");
  if (node.useState) {
    lines.push("    @staticmethod");
    lines.push("    def internal_state():");
    lines.push(`        return ${cls}InternalState()`);
    lines.push("");
  }
  lines.push("    @staticmethod");
  lines.push("    def compute(db) -> bool:");
  if (node.useState) lines.push("        state = db.internal_state");
  lines.push("        try:");
  lines.push(`            ${USER_BEGIN}`);
  lines.push(indent(String(node.code || "").trim() || "pass", 12));
  lines.push(`            ${USER_END}`);
  if (node.action) lines.push("            db.outputs.execOut = og.ExecutionAttributeState.ENABLED");
  lines.push("        except Exception as error:");
  lines.push(`            db.log_error(f"${node.name} failed: {error}")`);
  lines.push("            return False");
  lines.push("        return True");
  return lines.join("\n") + "\n";
}

export function categoryJson(project) {
  const ext = project.extension;
  return (
    JSON.stringify(
      {
        categoryDefinitions: {
          $description: `Categories used by the nodes in ${ext.name}`,
          [ext.nodeCategory]: ext.nodeCategoryDescription || ext.title,
        },
      },
      null,
      4
    ) + "\n"
  );
}

export function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect x="4" y="4" width="56" height="56" rx="12" fill="#1f2a33"/>
  <path d="M20 24 C32 24 32 40 44 40" stroke="#4fd1c5" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="18" cy="24" r="6" fill="#4fd1c5"/>
  <circle cx="46" cy="40" r="6" fill="#f6ad55"/>
  <circle cx="18" cy="42" r="4" fill="#9ae6b4"/>
</svg>
`;
}

export function initPython(project) {
  return `"""${project.extension.name}: ${project.extension.title}

Kit imports this module (declared in config/extension.toml); OmniGraph then
registers every Ogn*.ogn / Ogn*.py pair found in the nodes/ folder.
"""
`;
}

export function readme(project) {
  const ext = project.extension;
  const nodeRows = project.nodes
    .map((n) => `| ${n.uiName || n.name} | \`${nodeTypeName(project, n)}\` | ${n.action ? "Action" : "Data"} |`)
    .join("\n");
  return `# ${ext.title}

${ext.description || ""}

Python-only OmniGraph extension generated by
[Isaac Sim OmniGraph Node Builder](https://hrithik-verma.github.io/isaac-sim-omnigraph-node-builder/).
No build step is needed.

## Nodes

| Node | Type | Kind |
|---|---|---|
${nodeRows}

## Use it in Isaac Sim

1. Put the \`${ext.name}\` folder inside a folder that holds your extensions, e.g. \`~/isaacsim_exts/${ext.name}\`.
2. In Isaac Sim open **Window > Extensions > (menu) > Settings** and add the **parent** folder
   (\`~/isaacsim_exts\`) to *Extension Search Paths*.
3. Search the extension list for **${ext.title}** and enable it (tick *Autoload* to keep it on).
4. Open **Window > Graph Editors > Action Graph** and search for your node names.

From a standalone Python script:

\`\`\`python
from isaacsim import SimulationApp
app = SimulationApp({"headless": False})
import omni.kit.app
manager = omni.kit.app.get_app().get_extension_manager()
manager.add_path("/path/to/isaacsim_exts")
manager.set_extension_enabled_immediate("${ext.name}", True)
\`\`\`

## Editing

- Change node logic in \`${modulePath(ext.name)}/nodes/Ogn<Node>.py\` between the BEGIN/END USER CODE markers.
  Changes reload automatically while Isaac Sim runs.
- Inputs/outputs live in \`Ogn<Node>.ogn\`. Names used in Python (\`db.inputs.x\`) must match the .ogn exactly.
- \`Ogn<Name>.ogn\`, \`Ogn<Name>.py\` and \`class Ogn<Name>\` must share the same \`<Name>\`.
- Code must run on Python 3.11 (Isaac Sim 5.x) and 3.12 (6.x / 7.0) if you target both.
- Re-open the folder (or this extension's \`.ogn-builder.json\`) in the builder to edit it with the GUI again.
`;
}

export function changelog(project) {
  const today = new Date().toISOString().slice(0, 10);
  return `# Changelog

## [${project.extension.version}] - ${today}
### Added
- Initial version generated by Isaac Sim OmniGraph Node Builder
`;
}

function base64ToBytes(b64) {
  if (typeof atob === "function") return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

// Returns [{ path, content }] with paths starting at the extension folder.
// content is a string, or a Uint8Array for binary files.
export function generateFiles(project, assets = {}) {
  const ext = project.extension;
  const root = ext.name;
  const mod = `${root}/${modulePath(ext.name)}`;
  const fallback = base64ToBytes(FALLBACK_PNG_BASE64);
  const files = [
    { path: `${root}/config/extension.toml`, content: extensionToml(project) },
    { path: `${root}/docs/README.md`, content: readme(project) },
    { path: `${root}/docs/CHANGELOG.md`, content: changelog(project) },
    { path: `${root}/data/icon.png`, content: assets.iconPng || fallback },
    { path: `${root}/data/preview.png`, content: assets.previewPng || fallback },
    { path: `${mod}/__init__.py`, content: initPython(project) },
    { path: `${mod}/nodes/config/CategoryDefinition.json`, content: categoryJson(project) },
    { path: `${mod}/nodes/icons/icon.svg`, content: iconSvg() },
  ];
  for (const node of project.nodes) {
    files.push({ path: `${mod}/nodes/Ogn${node.name}.ogn`, content: ognJson(project, node) });
    files.push({ path: `${mod}/nodes/Ogn${node.name}.py`, content: nodePython(project, node) });
  }
  files.push({ path: `${root}/${PROJECT_FILE}`, content: JSON.stringify(project, null, 2) + "\n" });
  return files;
}

// ---------------------------------------------------------------------------
// Import: rebuild a project from existing extension files.

function between(text, begin, end) {
  const lines = text.split("\n");
  const b = lines.findIndex((l) => l.trim() === begin);
  const e = lines.findIndex((l, i) => i > b && l.trim() === end);
  if (b < 0 || e < 0) return null;
  return dedent(lines.slice(b + 1, e).join("\n"));
}

function dedent(text) {
  const lines = text.replace(/\t/g, "    ").split("\n");
  const widths = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const min = widths.length ? Math.min(...widths) : 0;
  return lines.map((l) => l.slice(min)).join("\n").replace(/^\n+|\n+$/g, "");
}

// Fallback for .py files not made by the builder: take the body of compute().
function computeBody(text) {
  const lines = text.replace(/\t/g, "    ").split("\n");
  const start = lines.findIndex((l) => /^\s*def compute\s*\(/.test(l));
  if (start < 0) return null;
  const defIndent = lines[start].match(/^ */)[0].length;
  const body = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() && l.match(/^ */)[0].length <= defIndent) break;
    body.push(l);
  }
  return dedent(body.join("\n"));
}

function defaultToText(attr) {
  if (attr.default === undefined) return TYPE_INFO[attr.type]?.kind === "text" ? "" : "";
  return typeof attr.default === "string" ? attr.default : JSON.stringify(attr.default);
}

function attrsFromOgn(section, skip) {
  return Object.entries(section || {})
    .filter(([name]) => !skip.has(name))
    .map(([name, a]) => ({
      name,
      uiName: a.uiName || "",
      type: a.type,
      default: defaultToText(a),
      description: a.description || "",
    }));
}

function parseTomlValue(toml, key) {
  const m = toml.match(new RegExp(`^\\s*${key}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`, "m"));
  return m ? m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\") : "";
}

// files: { "relative/path": "text content" } relative to the extension folder.
export function importProject(files, folderName = "") {
  const warnings = [];
  const paths = Object.keys(files);
  let project;

  const projectPath = paths.find((p) => p === PROJECT_FILE || p.endsWith("/" + PROJECT_FILE));
  if (projectPath) {
    project = JSON.parse(files[projectPath]);
  } else {
    project = defaultProject();
    const tomlPath = paths.find((p) => p === "config/extension.toml" || p.endsWith("/config/extension.toml"));
    const toml = tomlPath ? files[tomlPath] : "";
    if (!toml) warnings.push("config/extension.toml not found; using defaults.");
    const moduleMatch = toml.match(/\[\[python\.module\]\][^[]*?name\s*=\s*"([^"]+)"/);
    project.extension.name = moduleMatch ? moduleMatch[1] : folderName || project.extension.name;
    project.extension.title = parseTomlValue(toml, "title") || project.extension.title;
    project.extension.version = parseTomlValue(toml, "version") || project.extension.version;
    project.extension.description = parseTomlValue(toml, "description");
    project.extension.category = parseTomlValue(toml, "category") || "Graph";
    const authors = toml.match(/^\s*authors\s*=\s*\[([^\]]*)\]/m);
    if (authors) project.extension.authors = [...authors[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]).join(", ");
    project.nodes = [];
  }

  // .ogn/.py files on disk are the source of truth for nodes.
  const ognPaths = paths.filter((p) => /(^|\/)Ogn[A-Za-z0-9_]+\.ogn$/.test(p) && !p.includes("/ogn/"));
  if (ognPaths.length) {
    const byName = Object.fromEntries((project.nodes || []).map((n) => [n.name, n]));
    const nodes = [];
    for (const p of ognPaths.sort()) {
      let parsed;
      try {
        parsed = JSON.parse(files[p]);
      } catch (e) {
        warnings.push(`${p}: invalid JSON (${e.message})`);
        continue;
      }
      const [name, def] = Object.entries(parsed)[0] || [];
      if (!name) continue;
      const action =
        def.inputs?.execIn?.type === "execution" && def.outputs?.execOut?.type === "execution";
      const skip = new Set(action ? ["execIn", "execOut"] : []);
      const node = { ...emptyNode(name), ...(byName[name] || {}) };
      node.name = name;
      node.uiName = def.uiName || splitWords(name);
      node.description = def.description || "";
      node.action = action;
      node.inputs = attrsFromOgn(def.inputs, skip);
      node.outputs = attrsFromOgn(def.outputs, skip);
      const cats = Array.isArray(def.categories) ? def.categories : String(def.categories || "").split(",");
      node.extraCategory = cats.map((c) => c.trim()).find((c) => BUILTIN_CATEGORIES.includes(c)) || "";

      const py = files[p.replace(/\.ogn$/, ".py")];
      if (py) {
        const userCode = between(py, USER_BEGIN, USER_END);
        node.code = userCode ?? computeBody(py) ?? node.code;
        if (userCode === null) warnings.push(`${p.replace(/\.ogn$/, ".py")}: no builder markers; imported the whole compute() body.`);
        node.imports = between(py, IMPORTS_BEGIN, IMPORTS_END) ?? node.imports ?? "";
        const stateInit = between(py, STATE_BEGIN, STATE_END);
        node.useState = stateInit !== null || /def internal_state\s*\(/.test(py);
        node.stateInit = stateInit ?? node.stateInit ?? "";
        if (userCode === null) node.imports = "";
      } else {
        warnings.push(`${p}: matching .py file not found.`);
      }
      nodes.push(node);
    }
    project.nodes = nodes;
  }
  project.schema = PROJECT_SCHEMA;
  return { project, warnings };
}

// ---------------------------------------------------------------------------
// Presets

function attr(name, type, def, description, uiName) {
  return { name, uiName: uiName || "", type, default: def ?? TYPE_INFO[type].default, description: description || "" };
}

export const PRESETS = {
  multiply: {
    label: "Multiply two numbers",
    node: () => ({
      ...emptyNode("MultiplyNumbers"),
      uiName: "Multiply Numbers",
      description: "Multiplies two numbers: Product = A * B",
      extraCategory: "math:operator",
      inputs: [attr("a", "double", "0.0", "First number", "A"), attr("b", "double", "0.0", "Second number", "B")],
      outputs: [attr("product", "double", "", "A * B", "Product")],
      code: "db.outputs.product = db.inputs.a * db.inputs.b",
    }),
  },
  add: {
    label: "Add two numbers",
    node: () => ({
      ...emptyNode("AddNumbers"),
      uiName: "Add Numbers",
      description: "Adds two numbers: Sum = A + B",
      extraCategory: "math:operator",
      inputs: [attr("a", "double", "0.0", "First number", "A"), attr("b", "double", "0.0", "Second number", "B")],
      outputs: [attr("sum", "double", "", "A + B", "Sum")],
      code: "db.outputs.sum = db.inputs.a + db.inputs.b",
    }),
  },
  clamp: {
    label: "Clamp a value",
    node: () => ({
      ...emptyNode("ClampValue"),
      uiName: "Clamp Value",
      description: "Limits a value to the range [Min, Max]",
      extraCategory: "math:operator",
      inputs: [
        attr("value", "double", "0.0", "Value to clamp"),
        attr("min", "double", "0.0", "Lower limit", "Min"),
        attr("max", "double", "1.0", "Upper limit", "Max"),
      ],
      outputs: [attr("result", "double", "", "Clamped value")],
      code: "db.outputs.result = max(db.inputs.min, min(db.inputs.max, db.inputs.value))",
    }),
  },
  vectorLength: {
    label: "Vector length",
    node: () => ({
      ...emptyNode("VectorLength"),
      uiName: "Vector Length",
      description: "Length (magnitude) of a 3D vector",
      extraCategory: "math:operator",
      inputs: [attr("vector", "double[3]", "[0.0, 0.0, 0.0]", "Input vector")],
      outputs: [attr("length", "double", "", "Vector length")],
      imports: "import math",
      code: "x, y, z = db.inputs.vector\ndb.outputs.length = math.sqrt(x * x + y * y + z * z)",
    }),
  },
  counter: {
    label: "Counter (Action Graph)",
    node: () => ({
      ...emptyNode("TickCounter"),
      uiName: "Tick Counter",
      description: "Counts how many times it has been triggered",
      extraCategory: "flowControl",
      action: true,
      useState: true,
      inputs: [attr("reset", "bool", "false", "Set to true to restart from zero")],
      outputs: [attr("count", "int", "", "Number of times triggered")],
      stateInit: "self.count = 0",
      code: "if db.inputs.reset:\n    state.count = 0\nstate.count += 1\ndb.outputs.count = state.count",
    }),
  },
  branch: {
    label: "Compare & branch (Action Graph)",
    node: () => ({
      ...emptyNode("CompareBranch"),
      uiName: "Compare Branch",
      description: "Fires Is Greater when A > B, otherwise Is Not Greater",
      extraCategory: "flowControl",
      inputs: [
        attr("execIn", "execution", "", "Signal that triggers this node", "Exec In"),
        attr("a", "double", "0.0", "First number", "A"),
        attr("b", "double", "0.0", "Second number", "B"),
      ],
      outputs: [
        attr("isGreater", "execution", "", "Fires when A > B", "Is Greater"),
        attr("isNotGreater", "execution", "", "Fires when A <= B", "Is Not Greater"),
      ],
      code:
        "if db.inputs.a > db.inputs.b:\n" +
        "    db.outputs.isGreater = og.ExecutionAttributeState.ENABLED\n" +
        "else:\n" +
        "    db.outputs.isNotGreater = og.ExecutionAttributeState.ENABLED",
    }),
  },
  blank: {
    label: "Blank node",
    node: () => ({
      ...emptyNode("MyNode"),
      uiName: "My Node",
      description: "Describe what this node does",
      inputs: [attr("value", "double", "0.0", "Input value")],
      outputs: [attr("result", "double", "", "Output value")],
      code: "db.outputs.result = db.inputs.value",
    }),
  },
};

export function projectFromPreset(key) {
  const project = defaultProject();
  const preset = PRESETS[key] || PRESETS.multiply;
  project.nodes = [preset.node()];
  return project;
}
