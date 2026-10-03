// Isaac Sim OmniGraph Node Builder - extension generator.
//
// Pure functions with no DOM access, so the same module runs in the browser,
// in Node.js (tests/generate.mjs) and later inside a VS Code webview.
//
// The generated layout is a Python-only OmniGraph extension that Kit loads
// without a build step: OmniGraph scans <ext>/<module path>/ for .ogn files
// and generates the node database at startup (Isaac Sim 5.x, 6.x, 7.0).
//
// File ownership:
//   builder-owned  .ogn, extension.toml, CategoryDefinition.json, .ogn-builder.json
//                  -> regenerated from the GUI every time
//   user-owned     Ogn<Node>.py, __init__.py, docs/, data/, icons/
//                  -> created once as a starting template, never overwritten.
//                     Re-opened .py files are kept exactly as written.

export const GENERATOR_VERSION = "1.2.0";
export const PROJECT_SCHEMA = 2;
export const PROJECT_FILE = ".ogn-builder.json";

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
  { label: "Isaac Sim 5.0", kit: "107.3", python: "3.11", status: "tested", rosLib: "isaacsim.ros2.bridge" },
  { label: "Isaac Sim 5.1", kit: "107.3", python: "3.11", status: "same Kit as 5.0", rosLib: "isaacsim.ros2.bridge" },
  { label: "Isaac Sim 6.1", kit: "110.3", python: "3.12", status: "tested", rosLib: "isaacsim.ros2.core" },
  { label: "Isaac Sim 7.0 (alpha)", kit: "110.3", python: "3.12", status: "same Kit as 6.1", rosLib: "isaacsim.ros2.core" },
];

// ROS 2 message types offered in the GUI. fields: [path, placeholder] used in the template.
export const ROS_MESSAGES = {
  "std_msgs/msg/Float64": [["data", "0.0"]],
  "std_msgs/msg/Float32": [["data", "0.0"]],
  "std_msgs/msg/Int32": [["data", "0"]],
  "std_msgs/msg/Int64": [["data", "0"]],
  "std_msgs/msg/Bool": [["data", "False"]],
  "std_msgs/msg/String": [["data", '""']],
  "geometry_msgs/msg/Twist": [
    ["linear.x", "0.0"], ["linear.y", "0.0"], ["linear.z", "0.0"],
    ["angular.x", "0.0"], ["angular.y", "0.0"], ["angular.z", "0.0"],
  ],
  "geometry_msgs/msg/Vector3": [["x", "0.0"], ["y", "0.0"], ["z", "0.0"]],
  "geometry_msgs/msg/Point": [["x", "0.0"], ["y", "0.0"], ["z", "0.0"]],
  "geometry_msgs/msg/Pose": [
    ["position.x", "0.0"], ["position.y", "0.0"], ["position.z", "0.0"],
    ["orientation.x", "0.0"], ["orientation.y", "0.0"], ["orientation.z", "0.0"], ["orientation.w", "1.0"],
  ],
  "sensor_msgs/msg/Imu": [
    ["header.frame_id", '"imu_link"'],
    ["orientation.x", "0.0"], ["orientation.y", "0.0"], ["orientation.z", "0.0"], ["orientation.w", "1.0"],
    ["angular_velocity.x", "0.0"], ["angular_velocity.y", "0.0"], ["angular_velocity.z", "0.0"],
    ["linear_acceleration.x", "0.0"], ["linear_acceleration.y", "0.0"], ["linear_acceleration.z", "0.0"],
  ],
  "sensor_msgs/msg/JointState": [["name", "[]"], ["position", "[]"], ["velocity", "[]"], ["effort", "[]"]],
};
export const CUSTOM_MESSAGE = "custom";

const PY_KEYWORDS = new Set(
  ("False None True and as assert async await break class continue def del elif else except " +
    "finally for from global if import in is lambda nonlocal not or pass raise return try while with yield")
    .split(" ")
);
// Names the template itself uses inside compute(); attribute variables avoid them.
const RESERVED_LOCALS = new Set(["db", "state", "og", "msg", "error", "rclpy", "topic_name", "SingleThreadedExecutor", "_ROS_STATES", "ROS_IMPORT_ERROR", "MSG_IMPORT_ERROR"]);

const EXEC_IN = { name: "execIn", uiName: "Exec In", type: "execution", default: "", description: "Signal that triggers this node", auto: "action" };
const EXEC_OUT = { name: "execOut", uiName: "Exec Out", type: "execution", default: "", description: "Signal sent after this node runs", auto: "action" };

// 1x1 transparent PNG, used when the caller does not supply rendered icons.
const FALLBACK_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

// ---------------------------------------------------------------------------
// Project model helpers

export function defaultRos() {
  return { enabled: false, role: "publisher", msgType: "std_msgs/msg/Float64", customType: "", msgDefinition: "", topic: "/my_topic" };
}

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
    inputs: [],
    outputs: [],
    ros: defaultRos(),
    pythonSource: null, // user's own Ogn<Node>.py (kept verbatim); null = generated template
    pythonOriginal: null, // .py content as it was when opened (lets saves detect later edits on disk)
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

// Fill in fields that older project files do not have.
export function normalizeProject(project) {
  const base = defaultProject();
  const out = { ...base, ...project, extension: { ...base.extension, ...(project.extension || {}) } };
  out.schema = PROJECT_SCHEMA;
  out.nodes = (project.nodes || []).map((n) => {
    const node = { ...emptyNode(n.name), ...n };
    node.ros = { ...defaultRos(), ...(n.ros || {}) };
    node.inputs = (n.inputs || []).map((a) => ({ ...emptyAttribute(a.type), ...a }));
    node.outputs = (n.outputs || []).map((a) => ({ ...emptyAttribute(a.type), ...a }));
    for (const legacy of ["code", "imports", "stateInit", "useState"]) delete node[legacy];
    return node;
  });
  return out;
}

// Clean a name while the user types: no spaces or symbols.
//   "attribute": angular velocity -> angular_velocity (first letter lowercase)
//   "node":      imu publisher    -> ImuPublisher
//   "extension": my ros2.imu nodes -> my_ros2.imu_nodes
//   "topic":     /my topic        -> /my_topic
export function sanitizeName(kind, text) {
  let v = String(text ?? "");
  if (kind === "node") {
    v = v.replace(/[^A-Za-z0-9\s_-]/g, "").replace(/[\s_-]+([A-Za-z0-9])/g, (_, c) => c.toUpperCase()).replace(/[\s_-]+/g, "");
    return v.charAt(0).toUpperCase() + v.slice(1);
  }
  if (kind === "attribute") {
    v = v.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_]/g, "");
    return v.charAt(0).toLowerCase() + v.slice(1);
  }
  if (kind === "extension") return v.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_.]/g, "");
  if (kind === "topic") return v.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_/~{}]/g, "");
  return v;
}

export function splitWords(name) {
  return String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim();
}

function snakeCase(name) {
  return String(name || "node")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .toLowerCase();
}

export function modulePath(extName) {
  return extName.split(".").join("/");
}

export function nodeTypeName(project, node) {
  return `${project.extension.name}.${node.name}`;
}

function rosTopicAttr(node) {
  return {
    name: "topicName",
    uiName: "Topic Name",
    type: "token",
    default: node.ros.topic || "/my_topic",
    description: `ROS 2 topic to ${node.ros.role === "subscriber" ? "subscribe to" : "publish on"}`,
    auto: "ros",
  };
}

export function allInputs(node) {
  const list = [];
  if (node.action) list.push(EXEC_IN);
  if (node.ros?.enabled) list.push(rosTopicAttr(node));
  return [...list, ...node.inputs];
}

export function allOutputs(node) {
  return node.action ? [EXEC_OUT, ...node.outputs] : node.outputs;
}

export function typeInfo(type) {
  return TYPE_INFO[type];
}

export function rosMessageType(node) {
  return node.ros.msgType === CUSTOM_MESSAGE ? String(node.ros.customType || "").trim() : node.ros.msgType;
}

export function usesRos(project) {
  return project.nodes.some((n) => n.ros?.enabled);
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

// Attribute names used as db.inputs.X / db.outputs.X in a .py source.
export function pythonReferences(source) {
  const refs = { inputs: new Set(), outputs: new Set() };
  for (const m of String(source || "").matchAll(/\bdb\.(inputs|outputs)\.([A-Za-z_][A-Za-z0-9_]*)/g)) refs[m[1]].add(m[2]);
  return refs;
}

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

    for (const [side, list] of [["input", allInputs(node)], ["output", allOutputs(node)]]) {
      const names = new Set();
      for (const attr of list) {
        const where = `Node "${label}" ${side} "${attr.name || "?"}"`;
        if (!/^[a-z][A-Za-z0-9_]*$/.test(attr.name || ""))
          errors.push(`${where}: name must start with a lowercase letter and use only letters, digits and _ (e.g. angular_velocity).`);
        else if (PY_KEYWORDS.has(attr.name)) errors.push(`${where}: "${attr.name}" is a Python keyword.`);
        if (names.has(attr.name)) {
          const auto = list.find((a) => a.name === attr.name && a.auto);
          errors.push(auto ? `${where}: already added by the ${auto.auto === "ros" ? "ROS 2" : "Action Graph"} option.` : `${where}: duplicate name.`);
        }
        names.add(attr.name);
        if (!TYPE_INFO[attr.type]) errors.push(`${where}: unknown type "${attr.type}".`);
        else if (side === "input") {
          const d = parseDefault(attr);
          if (d.error) errors.push(`${where}: default ${d.error}.`);
        }
      }
    }
    if (allOutputs(node).length === 0 && !(node.ros?.enabled && node.ros.role === "publisher"))
      warnings.push(`Node "${label}" has no outputs.`);

    if (node.ros?.enabled) {
      const type = rosMessageType(node);
      if (!/^[a-z][a-z0-9_]*\/msg\/[A-Z][A-Za-z0-9]*$/.test(type))
        errors.push(`Node "${label}": ROS 2 message type must look like package/msg/Type, e.g. std_msgs/msg/Float64`);
      if (!/^[~/A-Za-z][A-Za-z0-9_/{}~]*$/.test(node.ros.topic || ""))
        errors.push(`Node "${label}": ROS 2 topic "${node.ros.topic}" is not a valid topic name.`);
      if (!node.action) warnings.push(`Node "${label}": ROS 2 nodes usually run in an Action Graph; consider turning on "Action Graph node".`);
      if (node.ros.msgType === CUSTOM_MESSAGE && String(node.ros.msgDefinition || "").trim() && !parseMsgDefinition(node.ros.msgDefinition).length)
        warnings.push(`Node "${label}": no fields found in the pasted .msg definition (expected lines like "float64 x").`);
    }

    // The user's own Python file: check it still matches the .ogn.
    if (node.pythonSource) {
      const file = `Ogn${node.name}.py`;
      if (!new RegExp(`\\bclass\\s+Ogn${node.name}\\s*[:(]`).test(node.pythonSource))
        errors.push(`Node "${label}": ${file} has no "class Ogn${node.name}". Rename the class in your code or reset it to the template.`);
      const refs = pythonReferences(node.pythonSource);
      const ins = new Set(allInputs(node).map((a) => a.name));
      const outs = new Set(allOutputs(node).map((a) => a.name));
      for (const r of refs.inputs) if (!ins.has(r)) warnings.push(`Node "${label}": ${file} uses db.inputs.${r}, which is not an input.`);
      for (const r of refs.outputs) if (!outs.has(r)) warnings.push(`Node "${label}": ${file} uses db.outputs.${r}, which is not an output.`);
    }
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
  const ros = usesRos(project)
    ? `# ROS 2 bridge: provides rclpy and message packages for Isaac Sim's Python version.
"isaacsim.ros2.bridge" = {}
`
    : "";
  return `# Generated by Isaac Sim OmniGraph Node Builder ${GENERATOR_VERSION}
# Python-only OmniGraph extension: no build step needed (Isaac Sim 5.x / 6.x / 7.0).

[package]
version = ${tomlString(ext.version)}
title = ${tomlString(ext.title)}
description = ${tomlString(ext.description)}
category = ${tomlString(ext.category || "Graph")}
authors = ${tomlList(csv(ext.authors))}
keywords = ["isaac sim", "omnigraph", "action graph", "nodes"${usesRos(project) ? ', "ros2"' : ""}]
changelog = "docs/CHANGELOG.md"
readme = "docs/README.md"
icon = "data/icon.png"
preview_image = "data/preview.png"

[core]
reloadable = true

[dependencies]
"omni.graph" = {}
${ros}
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

// Python placeholder value for an output of the given type.
function placeholder(type) {
  const info = TYPE_INFO[type] || {};
  if (info.kind === "bool") return "False";
  if (info.kind === "int" || info.kind === "uint") return "0";
  if (info.kind === "number") return "0.0";
  if (info.kind === "text") return '""';
  if (info.kind === "array") return "[]";
  if (info.kind === "tuple") {
    if (type.startsWith("quat")) return "[0.0, 0.0, 0.0, 1.0]";
    const zero = type.startsWith("int") ? "0" : "0.0";
    return `[${Array(info.size).fill(zero).join(", ")}]`;
  }
  return "None";
}

function variableName(name, taken) {
  let v = String(name || "value").replace(/[^A-Za-z0-9_]/g, "_");
  if (/^[0-9]/.test(v)) v = `_${v}`;
  if (RESERVED_LOCALS.has(v) || PY_KEYWORDS.has(v)) v = `${v}_value`;
  while (taken.has(v)) v = `${v}_out`;
  taken.add(v);
  return v;
}

// Placeholders for primitive ROS 2 field types.
const MSG_PRIMITIVES = {
  bool: "False", byte: "0", char: "0",
  int8: "0", uint8: "0", int16: "0", uint16: "0", int32: "0", uint32: "0", int64: "0", uint64: "0",
  float32: "0.0", float64: "0.0", string: '""', wstring: '""',
};
// Common nested types expanded into their fields.
const MSG_NESTED = {
  "std_msgs/Header": [["frame_id", '""']],
  "Header": [["frame_id", '""']],
  "geometry_msgs/Vector3": [["x", "0.0"], ["y", "0.0"], ["z", "0.0"]],
  "geometry_msgs/Point": [["x", "0.0"], ["y", "0.0"], ["z", "0.0"]],
  "geometry_msgs/Quaternion": [["x", "0.0"], ["y", "0.0"], ["z", "0.0"], ["w", "1.0"]],
};

// Read the fields of a pasted .msg definition into [path, placeholder] pairs.
// Unknown nested message types become [path, null, type] (written as a comment).
export function parseMsgDefinition(text) {
  const fields = [];
  for (const raw of String(text || "").split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line || line.startsWith("---")) continue;
    const m = line.match(/^([A-Za-z][A-Za-z0-9_/]*)(\[[^\]]*\])?\s+([a-z][a-z0-9_]*)(\s*=.*|\s+.*)?$/);
    if (!m) continue;
    const [, type, array, name, rest] = m;
    if (rest && rest.trim().startsWith("=")) continue; // constant
    const base = type.replace("/msg/", "/");
    if (array) {
      const size = array.slice(1, -1).replace("<=", "");
      const n = /^\d+$/.test(size) ? parseInt(size, 10) : 0;
      const zero = MSG_PRIMITIVES[type];
      fields.push([name, n && zero && n <= 16 ? `[${Array(n).fill(zero).join(", ")}]` : "[]"]);
    } else if (MSG_PRIMITIVES[type]) {
      fields.push([name, MSG_PRIMITIVES[type]]);
    } else if (MSG_NESTED[base]) {
      for (const [sub, value] of MSG_NESTED[base]) fields.push([`${name}.${sub}`, value]);
    } else {
      fields.push([name, null, type]);
    }
  }
  return fields;
}

export function messageFields(node) {
  if (node.ros.msgType !== CUSTOM_MESSAGE) return ROS_MESSAGES[node.ros.msgType] || null;
  const parsed = parseMsgDefinition(node.ros.msgDefinition);
  return parsed.length ? parsed : null;
}

function rosImport(node) {
  const [pkg, , type] = rosMessageType(node).split("/");
  return { pkg, type };
}

function rosStateCode(project, node) {
  const { type } = rosImport(node);
  const isSub = node.ros.role === "subscriber";
  const rosNodeName = `og_${snakeCase(node.name)}`;
  const lines = [
    "",
    "        # ROS 2 handles, created on the first compute()",
    "        self.ros_node = None",
    isSub ? "        self.subscription = None" : "        self.publisher = None",
    ...(isSub ? ["        self.executor = None", "        self.latest_msg = None"] : []),
    "        self.topic = None",
    "",
    "    def setup_ros(self, topic, node):",
    `        """Create the ROS 2 node and ${isSub ? "subscription" : "publisher"} (again if the topic changes)"""`,
    "        _ROS_STATES.setdefault(node.node_id(), set()).add(self)",
    "        if self.ros_node is not None and topic == self.topic:",
    "            return",
    "        self.cleanup_ros()",
    "        if rclpy is None:",
    "            raise RuntimeError(",
    '                f"ROS 2 is not available ({ROS_IMPORT_ERROR}). Start Isaac Sim with its internal "',
    '                "ROS 2 libraries and without a sourced system ROS 2 (see docs/README.md)."',
    "            )",
    `        if ${rosImport(node).type} is None:`,
    "            raise RuntimeError(",
    `                f"Message package '${rosImport(node).pkg}' could not be imported ({MSG_IMPORT_ERROR}). Custom messages must be "`,
    '                "built for Isaac Sim\'s Python (3.11 in 5.x, 3.12 in 6.x / 7.0); see docs/README.md."',
    "            )",
    "        if not rclpy.ok():",
    "            rclpy.init()",
    `        self.ros_node = rclpy.create_node(f"${rosNodeName}_{id(self)}")`,
  ];
  if (isSub) {
    lines.push(
      `        self.subscription = self.ros_node.create_subscription(${type}, topic, self.on_message, 10)`,
      "        self.executor = SingleThreadedExecutor()",
      "        self.executor.add_node(self.ros_node)"
    );
  } else {
    lines.push(`        self.publisher = self.ros_node.create_publisher(${type}, topic, 10)`);
  }
  lines.push("        self.topic = topic", "");
  if (isSub) {
    lines.push(
      "    def on_message(self, msg):",
      '        """Called for every received message (during executor.spin_once)"""',
      "        self.latest_msg = msg",
      ""
    );
  }
  lines.push(
    "    def cleanup_ros(self):",
    '        """Destroy the ROS 2 node (topic change or node deleted)"""',
    ...(isSub ? ["        if self.executor is not None:", "            self.executor.shutdown()", "            self.executor = None"] : []),
    "        if self.ros_node is not None:",
    "            self.ros_node.destroy_node()",
    "        self.ros_node = None",
    isSub ? "        self.subscription = None" : "        self.publisher = None",
    "        self.topic = None"
  );
  return lines;
}

function rosComputeCode(node) {
  const { type } = rosImport(node);
  const fields = messageFields(node);
  if (node.ros.role === "subscriber") {
    const first = fields && fields.find((f) => f[1] !== null);
    const example = first ? `msg.${first[0]}` : "msg.<field>";
    return [
      "            state.setup_ros(topic_name, db.abi_node)",
      "            state.executor.spin_once(timeout_sec=0.0)",
      `            msg = state.latest_msg  # newest ${type}, or None until the first message arrives`,
      "            if msg is not None:",
      `                pass  # read the message here, e.g. value = ${example}`,
    ];
  }
  const lines = ["            state.setup_ros(topic_name, db.abi_node)", `            msg = ${type}()`, "            # Fill the message from your inputs (placeholders below)"];
  if (fields) {
    for (const [path, value, nested] of fields)
      lines.push(value === null ? `            # msg.${path} = ...  (${nested} message: set its fields)` : `            msg.${path} = ${value}`);
  } else {
    lines.push("            # msg.<field> = ...  (paste the .msg definition in the builder to list the fields)");
  }
  lines.push("            state.publisher.publish(msg)");
  return lines;
}

// Starting template for Ogn<Node>.py, modelled on the Isaac Sim VS Code
// extension template: an internal state class and a compute() that reads
// inputs, leaves room for the user's computation, and writes outputs.
export function pythonTemplate(project, node) {
  const cls = `Ogn${node.name}`;
  const ros = node.ros?.enabled;
  const isAction = node.action;
  const L = [];

  L.push(`"""${node.uiName || splitWords(node.name)} (${nodeTypeName(project, node)})`);
  if (node.description) L.push("", node.description);
  L.push(
    "",
    `Starting template generated by Isaac Sim OmniGraph Node Builder ${GENERATOR_VERSION}.`,
    "This file is yours: change anything. The builder never overwrites it.",
    `Inputs and outputs are defined in ${cls}.ogn; the names used as db.inputs.<name>`,
    "and db.outputs.<name> must match it.",
    "",
    "OmniGraph Python node reference:",
    "  https://docs.omniverse.nvidia.com/kit/docs/omni.graph.docs/latest/dev/ogn/ogn_code_samples_python.html",
    `"""`,
    "",
    "import omni.graph.core as og"
  );
  if (ros) {
    const { pkg, type } = rosImport(node);
    L.push(
      "",
      "try:",
      "    import rclpy",
      ...(node.ros.role === "subscriber" ? ["    from rclpy.executors import SingleThreadedExecutor"] : []),
      "except Exception as ros_import_error:  # ROS 2 not set up for Isaac Sim's Python version",
      "    rclpy = None",
      "    ROS_IMPORT_ERROR = ros_import_error",
      "",
      "try:",
      `    from ${pkg}.msg import ${type}`,
      "except Exception as msg_import_error:  # message package not built for Isaac Sim's Python",
      `    ${type} = None`,
      "    MSG_IMPORT_ERROR = msg_import_error",
      "",
      "# ROS 2 states created by each OmniGraph node, so release() can clean them up",
      "_ROS_STATES = {}"
    );
  }
  L.push("", "");

  // Internal state
  L.push(
    `class ${cls}InternalState:`,
    '    """Per-node state that persists between compute() calls"""',
    "",
    "    def __init__(self):",
    '        """Instantiate the per-node state information"""',
    "        # Add your own variables here, e.g. self.counter = 0",
    "        self.initialized = False"
  );
  if (ros) L.push(...rosStateCode(project, node));
  L.push("", "");

  // Node class
  L.push(
    `class ${cls}:`,
    `    """${(node.description || node.uiName || node.name).replace(/"""/g, "")}"""`,
    "",
    "    @staticmethod",
    "    def internal_state():",
    '        """Returns an object that contains per-node state information"""',
    `        return ${cls}InternalState()`,
    ""
  );
  if (ros) {
    L.push(
      "    @staticmethod",
      "    def release(node):",
      '        """Called when the node is deleted: free the ROS 2 handles"""',
      "        for state in _ROS_STATES.pop(node.node_id(), ()):",
      "            state.cleanup_ros()",
      ""
    );
  }
  L.push(
    "    @staticmethod",
    "    def compute(db) -> bool:",
    '        """Compute the outputs from the current inputs and internal state"""',
    "        state = db.per_instance_state",
    "",
    "        try:",
    "            # 1. Read input values"
  );

  const taken = new Set();
  const dataInputs = allInputs(node).filter((a) => a.type !== "execution" && a.auto !== "ros");
  if (ros) L.push("            topic_name = db.inputs.topicName");
  for (const a of dataInputs) L.push(`            ${variableName(a.name, taken)} = db.inputs.${a.name}`);
  if (!dataInputs.length && !ros) L.push("            # (no data inputs)");
  L.push("", "            # 2. Do your custom computation here");
  if (ros) L.push(...rosComputeCode(node));
  const dataOutputs = allOutputs(node).filter((a) => a.type !== "execution");
  const outVars = dataOutputs.map((a) => [a, variableName(a.name, taken)]);
  for (const [a, v] of outVars) L.push(`            ${v} = ${placeholder(a.type)}`);
  if (!ros && !outVars.length) L.push("            pass");
  L.push("", "            # 3. Write output values");
  for (const [a, v] of outVars) L.push(`            db.outputs.${a.name} = ${v}`);
  const execOuts = allOutputs(node).filter((a) => a.type === "execution");
  if (execOuts.length) {
    L.push("            state.initialized = True", "");
    L.push("            # Trigger an execution output so the Action Graph continues");
    if (isAction) L.push("            db.outputs.execOut = og.ExecutionAttributeState.ENABLED");
    for (const a of execOuts.filter((x) => !x.auto)) L.push(`            # db.outputs.${a.name} = og.ExecutionAttributeState.ENABLED`);
  } else {
    L.push("            state.initialized = True");
  }
  L.push(
    "        except Exception as error:",
    `            db.log_error(f"Computation error: {error}")`,
    "            return False",
    "        return True"
  );
  return L.join("\n") + "\n";
}

export function nodePython(project, node) {
  return node.pythonSource ?? pythonTemplate(project, node);
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

function rosReadme(project) {
  if (!usesRos(project)) return "";
  return `
## ROS 2 nodes

These nodes use \`rclpy\` from Isaac Sim's ROS 2 bridge (enabled automatically as a dependency).
Isaac Sim needs its **internal** ROS 2 libraries, because a system ROS 2 install (e.g. Humble with
Python 3.10) does not match Isaac Sim's Python (3.11 in 5.x, 3.12 in 6.x / 7.0).

Start Isaac Sim from a terminal where ROS 2 is **not** sourced, after setting:

\`\`\`bash
export ROS_DISTRO=humble                      # or jazzy
export RMW_IMPLEMENTATION=rmw_fastrtps_cpp
# Isaac Sim 6.x / 7.0:
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:<isaac-sim>/exts/isaacsim.ros2.core/humble/lib
# Isaac Sim 5.x:
# export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:<isaac-sim>/exts/isaacsim.ros2.bridge/humble/lib
\`\`\`

For a pip install, \`<isaac-sim>\` is \`$(python -c "import isaacsim, os; print(os.path.dirname(isaacsim.__file__))")\`.

Message packages included with Isaac Sim work as-is (std_msgs, geometry_msgs, sensor_msgs, nav_msgs,
tf2_msgs, trajectory_msgs, vision_msgs, visualization_msgs, ackermann_msgs, ...).
**Custom messages** must be built for Isaac Sim's Python, e.g. with NVIDIA's
[IsaacSim-ros_workspaces](https://github.com/isaac-sim/IsaacSim-ros_workspaces) (\`./build_ros.sh -d humble -v 22.04\`
builds the workspace for Python 3.12 in Docker). Put your package in that workspace, build it, then add the built
install folder to \`PYTHONPATH\` and \`LD_LIBRARY_PATH\` before starting Isaac Sim.
Other ROS 2 tools (ros2 topic echo, rviz2) can run normally in a separate, sourced terminal.
`;
}

export function readme(project) {
  const ext = project.extension;
  const nodeRows = project.nodes
    .map((n) => {
      const kind = [n.action ? "Action" : "Data", n.ros?.enabled ? `ROS 2 ${n.ros.role}` : ""].filter(Boolean).join(", ");
      return `| ${n.uiName || n.name} | \`${nodeTypeName(project, n)}\` | ${kind} |`;
    })
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

## Writing your node code

Each \`${modulePath(ext.name)}/nodes/Ogn<Node>.py\` is a starting template: it reads every input,
leaves a spot for your computation and writes every output. Change it however you like;
it reloads automatically while Isaac Sim runs.

- Inputs/outputs live in \`Ogn<Node>.ogn\`. Names used in Python (\`db.inputs.x\`) must match the .ogn.
- \`Ogn<Name>.ogn\`, \`Ogn<Name>.py\` and \`class Ogn<Name>\` must share the same \`<Name>\`.
- Use \`state\` (\`db.per_instance_state\`, the InternalState object) for values that must survive between evaluations.
- Code must run on Python 3.11 (Isaac Sim 5.x) and 3.12 (6.x / 7.0) if you target both.
- Re-open this folder in the builder to change inputs/outputs with the GUI. Your .py files are kept
  as they are; the builder warns if they use names that no longer exist.
${rosReadme(project)}`;
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

// What is saved in .ogn-builder.json (no copies of the user's code).
export function projectFileContent(project) {
  const slim = {
    ...project,
    generator: GENERATOR_VERSION,
    nodes: project.nodes.map(({ pythonSource, pythonOriginal, ...rest }) => rest),
  };
  return JSON.stringify(slim, null, 2) + "\n";
}

// Returns [{ path, content, owner }] with paths starting at the extension folder.
// content is a string, or a Uint8Array for binary files.
// owner "builder": regenerate on every save. owner "user": create once, never overwrite.
export function generateFiles(project, assets = {}) {
  const ext = project.extension;
  const root = ext.name;
  const mod = `${root}/${modulePath(ext.name)}`;
  const fallback = base64ToBytes(FALLBACK_PNG_BASE64);
  const files = [
    { path: `${root}/config/extension.toml`, content: extensionToml(project), owner: "builder" },
    { path: `${root}/docs/README.md`, content: readme(project), owner: "user" },
    { path: `${root}/docs/CHANGELOG.md`, content: changelog(project), owner: "user" },
    { path: `${root}/data/icon.png`, content: assets.iconPng || fallback, owner: "user" },
    { path: `${root}/data/preview.png`, content: assets.previewPng || fallback, owner: "user" },
    { path: `${mod}/__init__.py`, content: initPython(project), owner: "user" },
    { path: `${mod}/nodes/config/CategoryDefinition.json`, content: categoryJson(project), owner: "builder" },
    { path: `${mod}/nodes/icons/icon.svg`, content: iconSvg(), owner: "user" },
  ];
  for (const node of project.nodes) {
    files.push({ path: `${mod}/nodes/Ogn${node.name}.ogn`, content: ognJson(project, node), owner: "builder" });
    files.push({ path: `${mod}/nodes/Ogn${node.name}.py`, content: nodePython(project, node), owner: "user", node: node.name });
  }
  files.push({ path: `${root}/${PROJECT_FILE}`, content: projectFileContent(project), owner: "builder" });
  return files;
}

// Keep the user's code in step with a rename made in the GUI.
export function renameInSource(source, kind, oldName, newName) {
  if (!source || !oldName || !newName || oldName === newName) return source;
  if (kind === "node") return source.replace(new RegExp(`\\bOgn${oldName}(?=(InternalState|Database)?\\b)`, "g"), `Ogn${newName}`);
  return source.replace(new RegExp(`\\bdb\\.${kind}\\.${oldName}\\b`, "g"), `db.${kind}.${newName}`);
}

// ---------------------------------------------------------------------------
// Import: rebuild a project from existing extension files.

function defaultToText(attr) {
  if (attr.default === undefined) return "";
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

function rosFromPython(py, topicDefault) {
  if (!py || !/\brclpy\b/.test(py)) return null;
  const imp = py.match(/^[ \t]*from\s+([a-z][a-z0-9_]*)\.msg\s+import\s+([A-Z][A-Za-z0-9]*)/m);
  const type = imp ? `${imp[1]}/msg/${imp[2]}` : "std_msgs/msg/Float64";
  const known = Object.prototype.hasOwnProperty.call(ROS_MESSAGES, type);
  return {
    enabled: true,
    role: /create_subscription\s*\(/.test(py) ? "subscriber" : "publisher",
    msgType: known ? type : CUSTOM_MESSAGE,
    customType: known ? "" : type,
    topic: topicDefault || "/my_topic",
  };
}

// files: { "relative/path": "text content" } relative to the extension folder.
export function importProject(files, folderName = "") {
  const warnings = [];
  const paths = Object.keys(files);
  let project;

  const projectPath = paths.find((p) => p === PROJECT_FILE || p.endsWith("/" + PROJECT_FILE));
  if (projectPath) {
    project = normalizeProject(JSON.parse(files[projectPath]));
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
  }

  // .ogn/.py files on disk are the source of truth for nodes.
  const ognPaths = paths.filter((p) => /(^|\/)Ogn[A-Za-z0-9_]+\.ogn$/.test(p) && !p.includes("/ogn/"));
  if (ognPaths.length || !projectPath) {
    const byName = Object.fromEntries(project.nodes.map((n) => [n.name, n]));
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
      const py = files[p.replace(/\.ogn$/, ".py")] ?? null;
      const saved = byName[name];
      const node = { ...emptyNode(name), ...(saved || {}) };
      node.ros = { ...defaultRos(), ...(saved?.ros || {}) };
      if (!saved) {
        const detected = rosFromPython(py, def.inputs?.topicName?.default);
        if (detected && def.inputs?.topicName) node.ros = detected;
      }
      node.action = def.inputs?.execIn?.type === "execution" && def.outputs?.execOut?.type === "execution";
      if (node.ros.enabled && def.inputs?.topicName?.default !== undefined) node.ros.topic = String(def.inputs.topicName.default);
      const skipIn = new Set([...(node.action ? ["execIn"] : []), ...(node.ros.enabled ? ["topicName"] : [])]);
      const skipOut = new Set(node.action ? ["execOut"] : []);
      node.name = name;
      node.uiName = def.uiName || splitWords(name);
      // ognJson() writes the label as the description when none was given; read that back as empty.
      const fallback = def.uiName || splitWords(name);
      node.description = def.description && def.description !== fallback ? def.description : saved?.description || "";
      node.inputs = attrsFromOgn(def.inputs, skipIn);
      node.outputs = attrsFromOgn(def.outputs, skipOut);
      const cats = Array.isArray(def.categories) ? def.categories : String(def.categories || "").split(",");
      node.extraCategory = cats.map((c) => c.trim()).find((c) => BUILTIN_CATEGORIES.includes(c)) || "";

      if (py === null) {
        warnings.push(`${p}: matching .py file not found; a new template will be created.`);
        node.pythonSource = null;
        node.pythonOriginal = null;
      } else {
        // An untouched template stays "generated" so it follows GUI edits; anything else is kept verbatim.
        const untouched = py === pythonTemplate(project, { ...node, pythonSource: null });
        node.pythonSource = untouched ? null : py;
        node.pythonOriginal = py;
      }
      nodes.push(node);
    }
    project.nodes = nodes;
  }
  project.schema = PROJECT_SCHEMA;
  return { project, warnings };
}

// ---------------------------------------------------------------------------
// Starting layouts. These only set up inputs/outputs; the Python file is
// always the neutral template, so nothing is assumed about the logic.

function attr(name, type, def, description, uiName) {
  return { name, uiName: uiName || "", type, default: def ?? TYPE_INFO[type].default, description: description || "" };
}

export const PRESETS = {
  twoInOneOut: {
    label: "Two numbers in, one out",
    node: () => ({
      ...emptyNode("MathOperation"),
      uiName: "Math Operation",
      description: "Combines two numbers into one result",
      extraCategory: "math:operator",
      inputs: [attr("a", "double", "0.0", "First number", "A"), attr("b", "double", "0.0", "Second number", "B")],
      outputs: [attr("result", "double", "", "Result")],
    }),
  },
  vector: {
    label: "Vector in, number out",
    node: () => ({
      ...emptyNode("VectorOperation"),
      uiName: "Vector Operation",
      description: "Turns a 3D vector into a number",
      extraCategory: "math:operator",
      inputs: [attr("vector", "double[3]", "[0.0, 0.0, 0.0]", "Input vector")],
      outputs: [attr("value", "double", "", "Result")],
    }),
  },
  actionNode: {
    label: "Action Graph node",
    node: () => ({
      ...emptyNode("ActionNode"),
      uiName: "Action Node",
      description: "Runs when triggered by an event such as On Playback Tick",
      extraCategory: "flowControl",
      action: true,
      inputs: [attr("enabled", "bool", "true", "Do the work only when true")],
      outputs: [attr("count", "int", "", "Example output")],
    }),
  },
  branch: {
    label: "Branch (two execution outputs)",
    node: () => ({
      ...emptyNode("BranchNode"),
      uiName: "Branch Node",
      description: "Chooses which execution output fires",
      extraCategory: "flowControl",
      inputs: [
        attr("execIn", "execution", "", "Signal that triggers this node", "Exec In"),
        attr("value", "double", "0.0", "Value to test"),
      ],
      outputs: [
        attr("onTrue", "execution", "", "Fires when the condition is true", "On True"),
        attr("onFalse", "execution", "", "Fires when the condition is false", "On False"),
      ],
    }),
  },
  rosPublisher: {
    label: "ROS 2 publisher",
    node: () => ({
      ...emptyNode("RosPublisher"),
      uiName: "ROS 2 Publisher",
      description: "Publishes a ROS 2 message every time it is triggered",
      extraCategory: "function",
      action: true,
      ros: { ...defaultRos(), enabled: true, role: "publisher", msgType: "std_msgs/msg/Float64", topic: "/isaac/value" },
      inputs: [attr("value", "double", "0.0", "Value to publish")],
      outputs: [],
    }),
  },
  rosSubscriber: {
    label: "ROS 2 subscriber",
    node: () => ({
      ...emptyNode("RosSubscriber"),
      uiName: "ROS 2 Subscriber",
      description: "Reads the newest ROS 2 message every time it is triggered",
      extraCategory: "function",
      action: true,
      ros: { ...defaultRos(), enabled: true, role: "subscriber", msgType: "geometry_msgs/msg/Twist", topic: "/cmd_vel" },
      inputs: [],
      outputs: [attr("linearX", "double", "", "Forward speed"), attr("angularZ", "double", "", "Turn rate")],
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
    }),
  },
};

export function projectFromPreset(key) {
  const project = defaultProject();
  const preset = PRESETS[key] || PRESETS.twoInOneOut;
  project.nodes = [preset.node()];
  return project;
}
