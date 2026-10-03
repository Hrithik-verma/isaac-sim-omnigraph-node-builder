// Generator tests + writes a test extension for tests/isaacsim_check.py.
//
// Usage: node tests/generate.mjs <output-dir>
//
// The written extension contains every preset as an untouched template, plus
// nodes whose .py was "edited by the user" (pythonSource) so Isaac Sim can
// check real results, including a ROS 2 publisher -> subscriber round trip.

import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";
import * as G from "../assets/generator.js";

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: node tests/generate.mjs <output-dir>");
  process.exit(2);
}

const edit = (source, from, to) => {
  assert.ok(source.includes(from), `template should contain: ${from}`);
  return source.replace(from, to);
};

// 1. Presets validate and templates never assume logic
const project = G.defaultProject();
project.extension.name = "builder.test.nodes";
project.extension.title = "Builder Test Nodes";
project.extension.authors = "Tester";
project.nodes = Object.values(G.PRESETS).map((p) => p.node());
let result = G.validateProject(project);
assert.deepEqual(result.errors, [], "presets must validate");
for (const node of project.nodes) {
  const py = G.pythonTemplate(project, node);
  assert.ok(py.includes(`class Ogn${node.name}InternalState:`), `${node.name}: internal state class`);
  assert.ok(py.includes("# 2. Do your custom computation here"), `${node.name}: computation placeholder`);
  for (const a of node.inputs.filter((x) => x.type !== "execution")) assert.ok(py.includes(`= db.inputs.${a.name}`), `${node.name}: reads ${a.name}`);
  for (const a of node.outputs.filter((x) => x.type !== "execution")) assert.ok(py.includes(`db.outputs.${a.name} = `), `${node.name}: writes ${a.name}`);
}
console.log(`presets: ${project.nodes.length} nodes valid; templates read every input and write every output`);

// 2. The reported bug: renamed attributes must be reflected in the template
const abc = { ...G.emptyNode("ABC"), uiName: "ABC", description: "add 2 number", action: true };
abc.inputs = [
  { name: "am", uiName: "", type: "double", default: "0.0", description: "" },
  { name: "bm", uiName: "", type: "double", default: "0.0", description: "" },
];
abc.outputs = [{ name: "addition", uiName: "", type: "double", default: "", description: "" }];
const abcPy = G.pythonTemplate({ ...project, nodes: [abc] }, abc);
assert.ok(abcPy.includes("am = db.inputs.am") && abcPy.includes("bm = db.inputs.bm"));
assert.ok(abcPy.includes("db.outputs.addition = addition"));
assert.ok(!/db\.inputs\.a\b|db\.outputs\.product/.test(abcPy), "no stale names");
assert.ok(abcPy.includes("db.outputs.execOut = og.ExecutionAttributeState.ENABLED"));
console.log("ABC case: template uses am, bm, addition");

// 3. Validation catches mistakes, including user code that drifted from the .ogn
const bad = G.defaultProject();
bad.extension.name = "Bad Name";
const n1 = { ...G.emptyNode("lowercase"), inputs: [{ name: "1x", type: "double", default: "abc" }], outputs: [{ name: "class", type: "double" }] };
const n2 = { ...G.emptyNode("Dup"), action: true, inputs: [{ name: "execIn", type: "execution", default: "" }] };
const n3 = { ...G.emptyNode("Vec"), inputs: [{ name: "v", type: "double[3]", default: "[1, 2]" }] };
const n4 = { ...abc, name: "Drift", pythonSource: "class OgnDrift:\n    def compute(db):\n        db.outputs.product = db.inputs.a\n" };
const n5 = { ...abc, name: "Renamed", pythonSource: "class OgnOldName:\n    pass\n" };
const n6 = { ...G.emptyNode("Ros"), action: true, ros: { ...G.defaultRos(), enabled: true, msgType: "custom", customType: "bad type" } };
bad.nodes = [n1, n2, n3, n4, n5, n6];
const badResult = G.validateProject(bad);
for (const e of ["dotted Python identifiers", "PascalCase", "lowercase letter", "Python keyword", "Action Graph option", "list of 3 numbers", 'no "class OgnRenamed"', "package/msg/Type"])
  assert.ok(badResult.errors.some((m) => m.includes(e)), `expected error containing "${e}"`);
for (const w of ["uses db.inputs.a, which is not an input", "uses db.outputs.product, which is not an output"])
  assert.ok(badResult.warnings.some((m) => m.includes(w)), `expected warning containing "${w}"`);
console.log(`validation: ${badResult.errors.length} errors, ${badResult.warnings.length} warnings caught as expected`);

// 4. Renames in the GUI follow into the user's code
let src = "class OgnABC:\n    x = db.inputs.am + db.inputs.amb\nstate = OgnABCInternalState()\nfrom m.ogn.OgnABCDatabase import OgnABCDatabase\n";
src = G.renameInSource(src, "inputs", "am", "alpha");
assert.ok(src.includes("db.inputs.alpha + db.inputs.amb"), "only exact attribute names are renamed");
src = G.renameInSource(src, "node", "ABC", "Adder");
assert.ok(src.includes("class OgnAdder:") && src.includes("OgnAdderInternalState") && src.includes("OgnAdderDatabase"));
console.log("renames: attribute and class renames applied to user code");

// 4b. Names are cleaned while typing; template variables are always valid Python
assert.equal(G.sanitizeName("attribute", "angular velocity vector"), "angular_velocity_vector");
assert.equal(G.sanitizeName("attribute", "Linear Accel"), "linear_Accel");
assert.equal(G.sanitizeName("node", "imu publisher"), "ImuPublisher");
assert.equal(G.sanitizeName("extension", "my ros2.imu"), "my_ros2.imu");
assert.equal(G.sanitizeName("topic", "/my topic"), "/my_topic");
const messy = { ...G.emptyNode("Messy"), inputs: [{ name: "bad name", type: "double", default: "0" }, { name: "class", type: "double", default: "0" }] };
const messyPy = G.pythonTemplate({ ...project, nodes: [messy] }, messy);
assert.ok(messyPy.includes("bad_name = db.inputs.bad name") === true, "variable is a valid identifier even if the .ogn name is not");
assert.ok(messyPy.includes("class_value = db.inputs.class"));
console.log("names: sanitizer and safe template variables OK");

// 5. User-edited nodes for the Isaac Sim run
const math = project.nodes.find((n) => n.name === "MathOperation");
math.pythonSource = edit(G.pythonTemplate(project, math), "            result = 0.0", "            result = a * b");

const pub = project.nodes.find((n) => n.name === "RosPublisher");
pub.ros.topic = "/builder_test/value";
pub.pythonSource = edit(G.pythonTemplate(project, pub), "            msg.data = 0.0", "            msg.data = value");

const sub = {
  ...G.emptyNode("FloatSubscriber"),
  uiName: "Float Subscriber",
  action: true,
  ros: { ...G.defaultRos(), enabled: true, role: "subscriber", msgType: "std_msgs/msg/Float64", topic: "/builder_test/value" },
  outputs: [{ name: "received", uiName: "", type: "double", default: "", description: "Last value" }],
};
sub.pythonSource = edit(
  G.pythonTemplate(project, sub),
  "            received = 0.0",
  "            received = msg.data if msg is not None else -1.0"
);
project.nodes.push(sub);

// IMU publisher with underscore attribute names (built-in sensor_msgs/msg/Imu) + a matching subscriber
const imuPub = {
  ...G.emptyNode("ImuPublisher"),
  uiName: "IMU Publisher",
  action: true,
  ros: { ...G.defaultRos(), enabled: true, role: "publisher", msgType: "sensor_msgs/msg/Imu", topic: "/builder_test/imu" },
  inputs: [
    { name: "angular_velocity_vector", uiName: "", type: "vectord[3]", default: "[0.0, 0.0, 0.0]", description: "" },
    { name: "linear_acceleration_vector", uiName: "", type: "vectord[3]", default: "[0.0, 0.0, 0.0]", description: "" },
    { name: "orientation", uiName: "", type: "quatd[4]", default: "[0.0, 0.0, 0.0, 1.0]", description: "" },
  ],
};
let imuSrc = G.pythonTemplate(project, imuPub);
for (const [from, to] of [
  ["msg.angular_velocity.z = 0.0", "msg.angular_velocity.z = float(angular_velocity_vector[2])"],
  ["msg.linear_acceleration.x = 0.0", "msg.linear_acceleration.x = float(linear_acceleration_vector[0])"],
  ["msg.orientation.w = 1.0", "msg.orientation.w = float(orientation[3])"],
]) imuSrc = edit(imuSrc, `            ${from}`, `            ${to}`);
imuPub.pythonSource = imuSrc;
const imuSub = {
  ...G.emptyNode("ImuSubscriber"),
  action: true,
  ros: { ...G.defaultRos(), enabled: true, role: "subscriber", msgType: "sensor_msgs/msg/Imu", topic: "/builder_test/imu" },
  outputs: [{ name: "angular_z", uiName: "", type: "double", default: "", description: "" }],
};
imuSub.pythonSource = edit(G.pythonTemplate(project, imuSub), "            angular_z = 0.0", "            angular_z = msg.angular_velocity.z if msg is not None else -1.0");
// Custom message whose package is not installed: must load and explain what to do
const customPub = {
  ...G.emptyNode("CustomMsgPublisher"),
  action: true,
  ros: { ...G.defaultRos(), enabled: true, msgType: G.CUSTOM_MESSAGE, customType: "builder_test_msgs/msg/Reading", topic: "/builder_test/custom",
    msgDefinition: "std_msgs/Header header\nfloat64 value\nint32 MODE=1\nfloat64[3] xyz" },
};
const customPy = G.pythonTemplate(project, customPub);
for (const line of ['msg.header.frame_id = ""', "msg.value = 0.0", "msg.xyz = [0.0, 0.0, 0.0]"]) assert.ok(customPy.includes(line), `custom template has ${line}`);
assert.ok(!customPy.includes("MODE"), "constants are skipped");
project.nodes.push(imuPub, imuSub, customPub);
result = G.validateProject(project);
assert.deepEqual(result.errors, []);

// 6. Write files
const files = G.generateFiles(project);
for (const f of files) {
  const p = join(outDir, f.path);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, f.content);
}
assert.ok(files.find((f) => f.path.endsWith("extension.toml")).content.includes('"isaacsim.ros2.bridge" = {}'));
assert.ok(files.every((f) => f.owner === "builder" || f.owner === "user"));
assert.ok(!files.find((f) => f.path.endsWith(G.PROJECT_FILE)).content.includes("result = a * b"), "project file has no code copies");
console.log(`wrote ${files.length} files to ${outDir}/${project.extension.name}`);

// Every generated .py must be valid Python
const pyFiles = files.filter((f) => f.path.endsWith(".py")).map((f) => join(outDir, f.path));
execFileSync("python3", ["-c", "import sys, ast\nfor p in sys.argv[1:]: ast.parse(open(p).read(), p)", ...pyFiles]);
console.log(`python: ${pyFiles.length} generated .py files parse`);

// 7. Re-open without the project file: edited .py kept verbatim, untouched templates stay templates, ROS detected
const textFiles = {};
for (const f of files) {
  if (typeof f.content !== "string" || f.path.endsWith(G.PROJECT_FILE)) continue;
  textFiles[f.path.slice(project.extension.name.length + 1)] = f.content;
}
const { project: back, warnings } = G.importProject(textFiles, project.extension.name);
assert.deepEqual(warnings, []);
assert.equal(back.extension.name, project.extension.name);
assert.equal(back.nodes.length, project.nodes.length);
for (const orig of project.nodes) {
  const got = back.nodes.find((x) => x.name === orig.name);
  assert.ok(got, `node ${orig.name} imported`);
  if (orig.ros.msgDefinition && !orig.pythonSource) {
    // Without .ogn-builder.json the pasted .msg is unknown, so the file is kept verbatim (safe).
    assert.equal(got.pythonSource, G.pythonTemplate(project, orig), `${orig.name}: kept verbatim`);
  } else {
    assert.equal(got.pythonSource, orig.pythonSource ?? null, `${orig.name}: python ownership`);
  }
  assert.equal(got.action, orig.action, `${orig.name}.action`);
  assert.equal(got.ros.enabled, orig.ros.enabled, `${orig.name}.ros.enabled`);
  if (orig.ros.enabled) {
    assert.equal(got.ros.role, orig.ros.role, `${orig.name}.ros.role`);
    assert.equal(G.rosMessageType(got), G.rosMessageType(orig), `${orig.name} msg type`);
    assert.equal(got.ros.topic, orig.ros.topic, `${orig.name} topic`);
  }
  assert.deepEqual(got.inputs.map((a) => [a.name, a.type]), orig.inputs.map((a) => [a.name, a.type]), `${orig.name} inputs`);
  assert.deepEqual(got.outputs.map((a) => [a.name, a.type]), orig.outputs.map((a) => [a.name, a.type]), `${orig.name} outputs`);
}
console.log("re-open: user code kept verbatim, templates still generated, ROS settings detected");

// 8. Re-open WITH the project file: the pasted .msg definition comes back and the template stays a template
const withProject = { ...textFiles, [G.PROJECT_FILE]: files.find((f) => f.path.endsWith(G.PROJECT_FILE)).content };
const { project: back2 } = G.importProject(withProject, project.extension.name);
const custom2 = back2.nodes.find((n) => n.name === "CustomMsgPublisher");
assert.equal(custom2.ros.msgDefinition, customPub.ros.msgDefinition);
assert.equal(custom2.pythonSource, null);
console.log("re-open with project file: .msg definition restored, template still generated");
