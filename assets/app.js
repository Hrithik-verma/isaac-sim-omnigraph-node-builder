// Isaac Sim OmniGraph Node Builder - user interface.
// All file generation lives in generator.js; this module only handles the DOM.

import * as G from "./generator.js";

const STORAGE_KEY = "ogn-builder-project-v1";
const THEME_KEY = "ogn-builder-theme";
const WRAP_KEY = "ogn-builder-wrap";
const TEXT_EXTENSIONS = /\.(toml|ogn|py|json)$/i;
const SKIP_DIRS = new Set(["__pycache__", ".git", "node_modules", "data", "PACKAGE-LICENSES"]);

const $ = (sel, root = document) => root.querySelector(sel);

let project;
let selected = 0;
let currentFile = null;
let saveTimer = null;

// ---------------------------------------------------------------------------
// Small DOM helpers

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key in node && typeof value !== "string") node[key] = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function toast(message, kind = "info", ms = 4500) {
  const t = el("div", { class: `toast ${kind}`, role: kind === "error" ? "alert" : "status", text: message });
  $("#toasts").append(t);
  setTimeout(() => t.remove(), ms);
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode or blocked storage: the page still works without it */
  }
}

// ---------------------------------------------------------------------------
// Type colours (approximation of the Kit graph editor)

function typeColor(type) {
  const base = String(type).replace(/\[\]$/, "");
  if (type === "execution") return "#e8e8e8";
  if (base === "bool") return "#f05d6c";
  if (/^u?int(64)?$/.test(base)) return "#38bdf8";
  if (base === "float" || base === "double") return "#86d36b";
  if (base === "token" || base === "string") return "#f39ad6";
  if (base.startsWith("quat")) return "#c084fc";
  if (base.startsWith("color")) return "#fb923c";
  return "#f6c453";
}

const LEGEND = [
  ["Execution", "execution"],
  ["Bool", "bool"],
  ["Integer", "int"],
  ["Float / Double", "double"],
  ["Token / String", "token"],
  ["Vector", "double[3]"],
  ["Color", "colorf[3]"],
  ["Quaternion", "quatd[4]"],
];

// ---------------------------------------------------------------------------
// State

function currentNode() {
  return project.nodes[selected];
}

function uniqueNodeName(base) {
  const names = new Set(project.nodes.map((n) => n.name));
  if (!names.has(base)) return base;
  let i = 2;
  while (names.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

function isProjectShape(p) {
  return p && typeof p === "object" && p.extension && Array.isArray(p.nodes);
}

function loadInitialProject() {
  const params = new URLSearchParams(location.search);
  const preset = params.get("preset");
  if (preset && G.PRESETS[preset]) return G.projectFromPreset(preset);
  const saved = storageGet(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (isProjectShape(parsed)) return G.normalizeProject(parsed);
    } catch {
      /* ignore corrupt storage */
    }
  }
  return G.projectFromPreset("twoInOneOut");
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => storageSet(STORAGE_KEY, JSON.stringify(project)), 300);
}

// ---------------------------------------------------------------------------
// Extension fields

const EXT_FIELDS = {
  extName: "name",
  extTitle: "title",
  extVersion: "version",
  extAuthors: "authors",
  extDescription: "description",
  extNodeCategory: "nodeCategory",
  extNodeCategoryDescription: "nodeCategoryDescription",
};

function bindExtensionFields() {
  for (const [id, key] of Object.entries(EXT_FIELDS)) {
    $(`#${id}`).addEventListener("input", (e) => {
      project.extension[key] = e.target.value.trim() === e.target.value ? e.target.value : e.target.value.trimStart();
      refresh();
    });
  }
}

function fillExtensionFields() {
  for (const [id, key] of Object.entries(EXT_FIELDS)) $(`#${id}`).value = project.extension[key] ?? "";
}

// ---------------------------------------------------------------------------
// Node list

function renderNodeList(validation) {
  const list = $("#nodeList");
  list.replaceChildren();
  project.nodes.forEach((node, index) => {
    const hasError = validation.errors.some((e) => e.startsWith(`Node "${node.name}"`));
    list.append(
      el(
        "li",
        {
          class: index === selected ? "active" : "",
          tabindex: "0",
          onclick: () => selectNode(index),
          onkeydown: (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), selectNode(index)),
        },
        el("span", { class: `dot ${node.action || hasExecution(node) ? "action" : ""}`, title: node.action ? "Action Graph node" : "Data node" }),
        el("span", { class: "name" }, node.uiName || node.name || "(unnamed)", el("small", { text: node.name || "?" })),
        hasError ? el("span", { class: "err", title: "Has errors", text: "!" }) : null
      )
    );
  });
  if (!project.nodes.length) list.append(el("li", { class: "empty", text: "No nodes yet. Add one." }));
}

function hasExecution(node) {
  return [...node.inputs, ...node.outputs].some((a) => a.type === "execution");
}

function selectNode(index) {
  selected = Math.max(0, Math.min(index, project.nodes.length - 1));
  currentFile = null;
  renderEditor();
  refresh();
}

function buildAddNodeMenu() {
  const menu = $("#addNodeMenu .menu-list");
  menu.replaceChildren(
    el("button", { role: "menuitem", text: "Blank node", onclick: () => addNode("blank") }),
    el("hr"),
    ...Object.entries(G.PRESETS)
      .filter(([key]) => key !== "blank")
      .map(([key, preset]) => el("button", { role: "menuitem", text: preset.label, onclick: () => addNode(key) }))
  );
}

function addNode(presetKey) {
  const node = G.PRESETS[presetKey].node();
  node.name = uniqueNodeName(node.name);
  if (node.name !== G.PRESETS[presetKey].node().name) node.uiName = G.splitWords(node.name);
  project.nodes.push(node);
  closeMenus();
  selectNode(project.nodes.length - 1);
}

// ---------------------------------------------------------------------------
// Node editor

function field(label, input, hint, cls = "") {
  return el("label", { class: `field ${cls}` }, el("span", {}, label, hint ? " " : "", hint ? el("em", { text: hint }) : null), input);
}

function renderEditor() {
  const editor = $("#editor");
  editor.replaceChildren();
  const node = currentNode();
  if (!node) {
    editor.append(
      el("div", { class: "editor-head" }, el("h2", { text: "Node" })),
      el("p", { class: "empty", text: "Add a node from the Nodes panel or load an example." })
    );
    return;
  }

  // Header
  editor.append(
    el(
      "div",
      { class: "editor-head" },
      el("h2", { text: "Node" }),
      el(
        "div",
        { class: "btns" },
        el("button", { class: "btn small", text: "Duplicate", onclick: duplicateNode }),
        el("button", { class: "btn small danger", text: "Delete", onclick: deleteNode })
      )
    )
  );

  // Basic info
  const nameInput = el("input", { value: node.name, spellcheck: "false", autocomplete: "off", placeholder: "MultiplyNumbers" });
  const uiInput = el("input", { value: node.uiName, placeholder: "Multiply Numbers" });
  nameInput.addEventListener("input", () => {
    const oldName = node.name;
    const oldAuto = G.splitWords(oldName);
    node.name = nameInput.value.trim();
    if (node.pythonSource && /^[A-Z][A-Za-z0-9]*$/.test(oldName) && /^[A-Z][A-Za-z0-9]*$/.test(node.name))
      node.pythonSource = G.renameInSource(node.pythonSource, "node", oldName, node.name);
    if (!node.uiName || node.uiName === oldAuto) {
      node.uiName = G.splitWords(node.name);
      uiInput.value = node.uiName;
    }
    nameInput.classList.toggle("invalid", !/^[A-Z][A-Za-z0-9]*$/.test(node.name));
    $("#pythonFileName") && ($("#pythonFileName").textContent = `Ogn${node.name}.py`);
    refresh();
  });
  uiInput.addEventListener("input", () => {
    node.uiName = uiInput.value;
    refresh();
  });
  const descInput = el("input", { value: node.description, placeholder: "What the node does (shown as tooltip)" });
  descInput.addEventListener("input", () => {
    node.description = descInput.value;
    refresh();
  });
  const catSelect = el(
    "select",
    {},
    el("option", { value: "", text: "None" }),
    ...G.BUILTIN_CATEGORIES.map((c) => el("option", { value: c, text: c, selected: c === node.extraCategory }))
  );
  catSelect.addEventListener("change", () => {
    node.extraCategory = catSelect.value;
    refresh();
  });
  const typeId = el("input", { value: G.nodeTypeName(project, node), readOnly: true, tabindex: "-1", id: "nodeTypeId" });

  editor.append(
    el(
      "div",
      { class: "node-grid" },
      field("Node name", nameInput, "PascalCase, used in file names"),
      field("Label", uiInput, "shown on the node"),
      field("Description", descInput, "", "wide"),
      field("Extra category", catSelect, "built-in OmniGraph group"),
      field("Node type id", typeId, "search name in Isaac Sim")
    )
  );

  // Options
  const actionBox = el("input", { type: "checkbox", checked: node.action });
  actionBox.addEventListener("change", () => {
    node.action = actionBox.checked;
    renderEditor();
    refresh();
  });
  const rosBox = el("input", { type: "checkbox", checked: node.ros.enabled });
  rosBox.addEventListener("change", () => {
    node.ros.enabled = rosBox.checked;
    if (node.ros.enabled && !node.action) node.action = true; // ROS nodes are normally ticked by an Action Graph
    renderEditor();
    refresh();
  });
  editor.append(
    el(
      "div",
      { class: "toggles" },
      el(
        "label",
        { class: "toggle" },
        actionBox,
        el("span", {}, el("b", { text: "Action Graph node" }), el("small", { text: "Adds Exec In / Exec Out pins so events (On Playback Tick, On Impulse...) trigger it." }))
      ),
      el(
        "label",
        { class: "toggle" },
        rosBox,
        el("span", {}, el("b", { text: "ROS 2" }), el("small", { text: "Publish or subscribe to a ROS 2 topic with rclpy from Isaac Sim's ROS 2 bridge." }))
      )
    )
  );
  if (node.ros.enabled) editor.append(rosSection(node));

  editor.append(attrSection(node, "inputs"), attrSection(node, "outputs"), pythonSection(node));
}

function rosSection(node) {
  const ros = node.ros;
  const role = el(
    "select",
    {},
    el("option", { value: "publisher", text: "Publisher (send messages)", selected: ros.role === "publisher" }),
    el("option", { value: "subscriber", text: "Subscriber (receive messages)", selected: ros.role === "subscriber" })
  );
  role.addEventListener("change", () => {
    ros.role = role.value;
    renderEditor();
    refresh();
  });
  const groups = {};
  for (const type of Object.keys(G.ROS_MESSAGES)) (groups[type.split("/")[0]] ||= []).push(type);
  const msg = el(
    "select",
    {},
    ...Object.entries(groups).map(([pkg, types]) =>
      el("optgroup", { label: pkg }, ...types.map((t) => el("option", { value: t, text: t.split("/").pop(), selected: t === ros.msgType })))
    ),
    el("option", { value: G.CUSTOM_MESSAGE, text: "Custom type...", selected: ros.msgType === G.CUSTOM_MESSAGE })
  );
  msg.addEventListener("change", () => {
    ros.msgType = msg.value;
    renderEditor();
    refresh();
  });
  const topic = el("input", { value: ros.topic, spellcheck: "false", placeholder: "/my_topic" });
  topic.addEventListener("input", () => {
    ros.topic = topic.value.trim();
    refresh();
  });
  const grid = el(
    "div",
    { class: "node-grid" },
    field("Role", role),
    field("Message type", msg),
    field("Default topic", topic, "editable later on the node", ros.msgType === G.CUSTOM_MESSAGE ? "" : "wide")
  );
  if (ros.msgType === G.CUSTOM_MESSAGE) {
    const custom = el("input", { value: ros.customType, spellcheck: "false", placeholder: "my_msgs/msg/MyType" });
    custom.addEventListener("input", () => {
      ros.customType = custom.value.trim();
      refresh();
    });
    grid.append(field("Custom type", custom, "package/msg/Type"));
  }
  return el(
    "div",
    { class: "attr-section ros-box" },
    el("h3", { text: "ROS 2" }),
    grid,
    el("p", {
      class: "sub",
      text:
        "Adds a Topic Name input and the rclpy setup/cleanup code. Isaac Sim must be started with its internal ROS 2 libraries " +
        "(not a sourced system ROS 2): see How to use." +
        (ros.msgType === G.CUSTOM_MESSAGE ? " Custom messages must be built for Isaac Sim's Python version." : ""),
    })
  );
}

function attrSection(node, side) {
  const isInput = side === "inputs";
  const list = node[side];
  const fixed = (isInput ? G.allInputs(node) : G.allOutputs(node)).filter((a) => a.auto);
  const section = el("div", { class: "attr-section" });
  const addBtn = el("button", {
    class: "btn small",
    text: `+ Add ${isInput ? "input" : "output"}`,
    onclick: () => {
      const a = G.emptyAttribute("double");
      a.name = uniqueAttrName(node, side, isInput ? "value" : "result");
      if (!isInput) a.default = "";
      list.push(a);
      renderEditor();
      refresh();
      const rows = document.querySelectorAll(`[data-side="${side}"] .a-name`);
      rows[rows.length - 1]?.select();
    },
  });
  section.append(
    el("h3", {}, el("span", {}, isInput ? "Inputs" : "Outputs", el("span", { class: "count", text: `${list.length + fixed.length}` })), addBtn)
  );
  const container = el("div", { class: "attr-list", "data-side": side });
  for (const f of fixed) container.append(fixedAttrRow(f));
  list.forEach((attr, index) => container.append(attrRow(node, side, attr, index)));
  if (!list.length && !fixed.length) container.append(el("div", { class: "empty", text: `No ${side} yet.` }));
  section.append(container);
  return section;
}

function uniqueAttrName(node, side, base) {
  const names = new Set([...(side === "inputs" ? G.allInputs(node) : G.allOutputs(node))].map((a) => a.name));
  if (!names.has(base)) return base;
  let i = 2;
  while (names.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

function fixedAttrRow(attr) {
  const by = attr.auto === "ros" ? "the ROS 2 option" : "the Action Graph option";
  return el(
    "div",
    { class: "attr fixed", title: `Added by ${by}` },
    el("span", { class: `pin ${attr.type === "execution" ? "exec" : ""}`, style: `background:${typeColor(attr.type)}` }),
    el("input", { class: "a-name", value: attr.name, disabled: true }),
    el("input", { class: "a-type", value: attr.type, disabled: true }),
    el("input", { class: "a-def", value: attr.type === "execution" ? "" : attr.default, disabled: true, placeholder: "automatic" }),
    el("span", { class: "btns" }),
    el("input", { class: "a-label", value: attr.uiName, disabled: true }),
    el("input", { class: "a-desc", value: `Added by ${by}`, disabled: true })
  );
}

function typeSelect(value) {
  const groups = {};
  for (const t of G.ATTRIBUTE_TYPES) (groups[t.group] ||= []).push(t);
  return el(
    "select",
    { class: "a-type", title: "Attribute type" },
    ...Object.entries(groups).map(([group, types]) =>
      el("optgroup", { label: group }, ...types.map((t) => el("option", { value: t.type, text: t.type, selected: t.type === value })))
    )
  );
}

function attrRow(node, side, attr, index) {
  const isInput = side === "inputs";
  const list = node[side];
  const pin = el("span", { class: `pin ${attr.type === "execution" ? "exec" : ""}`, style: `background:${typeColor(attr.type)}` });
  const name = el("input", { class: "a-name", value: attr.name, spellcheck: "false", autocomplete: "off", placeholder: "name", title: "Attribute name (camelCase), used as db." + side + ".<name>" });
  const type = typeSelect(attr.type);
  const info = () => G.typeInfo(attr.type) || {};
  const def = el("input", { class: "a-def", value: isInput ? attr.default : "", spellcheck: "false", placeholder: isInput ? "default" : "output", title: "Default value" });
  const label = el("input", { class: "a-label", value: attr.uiName, placeholder: G.splitWords(attr.name) || "Label" });
  const desc = el("input", { class: "a-desc", value: attr.description, placeholder: "Description (tooltip)" });

  const syncDefaultState = () => {
    const disabled = !isInput || info().kind === "execution";
    def.disabled = disabled;
    if (disabled) def.value = "";
    def.placeholder = !isInput ? "output" : info().kind === "execution" ? "trigger" : info().kind === "text" ? "text" : "default";
  };
  syncDefaultState();

  name.addEventListener("input", () => {
    const oldName = attr.name;
    attr.name = name.value.trim();
    // Keep the user's own code in step with the rename.
    if (node.pythonSource && /^[a-z][A-Za-z0-9_]*$/.test(oldName) && /^[a-z][A-Za-z0-9_]*$/.test(attr.name))
      node.pythonSource = G.renameInSource(node.pythonSource, side, oldName, attr.name);
    label.placeholder = G.splitWords(attr.name) || "Label";
    name.classList.toggle("invalid", !/^[a-z][A-Za-z0-9_]*$/.test(attr.name));
    refresh();
  });
  type.addEventListener("change", () => {
    const old = G.typeInfo(attr.type);
    attr.type = type.value;
    if (!attr.default || attr.default === old?.default) attr.default = info().default;
    if (isInput) def.value = attr.default;
    pin.style.background = typeColor(attr.type);
    pin.classList.toggle("exec", attr.type === "execution");
    syncDefaultState();
    refresh();
  });
  def.addEventListener("input", () => {
    attr.default = def.value;
    refresh();
  });
  label.addEventListener("input", () => {
    attr.uiName = label.value;
    refresh();
  });
  desc.addEventListener("input", () => {
    attr.description = desc.value;
    refresh();
  });

  const move = (delta) => {
    const j = index + delta;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    renderEditor();
    refresh();
  };
  const btns = el(
    "span",
    { class: "btns" },
    el("button", { class: "btn ghost", title: "Move up", "aria-label": "Move up", text: "↑", disabled: index === 0, onclick: () => move(-1) }),
    el("button", { class: "btn ghost", title: "Move down", "aria-label": "Move down", text: "↓", disabled: index === list.length - 1, onclick: () => move(1) }),
    el("button", {
      class: "btn ghost danger",
      title: "Remove",
      "aria-label": "Remove",
      text: "✕",
      onclick: () => {
        list.splice(index, 1);
        renderEditor();
        refresh();
      },
    })
  );
  return el("div", { class: "attr" }, pin, name, type, def, btns, label, desc);
}

function showFile(path) {
  currentFile = path;
  document.querySelector('.tab[data-tab="files"]').click();
  refresh();
}

function pythonSection(node) {
  const kept = node.pythonSource !== null && node.pythonSource !== undefined;
  const fileName = el("code", { id: "pythonFileName", text: `Ogn${node.name}.py` });
  const view = el("button", {
    class: "btn small",
    text: "View file",
    onclick: () => showFile(`${project.extension.name}/${G.modulePath(project.extension.name)}/nodes/Ogn${node.name}.py`),
  });
  const reset = kept
    ? el("button", {
        class: "btn small danger",
        text: "Reset to template",
        onclick: () => {
          if (!confirm(`Replace your code in Ogn${node.name}.py with a fresh template?\nYour current code in the builder will be lost (files on disk are not touched until you save).`)) return;
          node.pythonSource = null;
          renderEditor();
          refresh();
        },
      })
    : null;
  const steps = el(
    "ol",
    { class: "steps" },
    el("li", {}, el("b", { text: "Read inputs" }), " every input is read into a variable"),
    el("li", {}, el("b", { text: "Your computation" }), " write your logic here; use ", el("code", { text: "state" }), " for values that persist"),
    el("li", {}, el("b", { text: "Write outputs" }), " every output is written from a variable")
  );
  return el(
    "div",
    { class: `attr-section python-box ${kept ? "kept" : ""}` },
    el("h3", {}, el("span", {}, "Python file ", fileName), el("span", { class: "btns" }, view, reset)),
    kept
      ? el(
          "p",
          { class: "sub" },
          el("b", { text: "Your code is kept as-is. " }),
          "It came from the extension you opened. The builder never rewrites it; renaming a node, input or output here also renames ",
          el("code", { text: "Ogn<Name>" }),
          " / ",
          el("code", { text: "db.inputs.<name>" }),
          " in it. Checks warns if it uses names that no longer exist."
        )
      : el(
          "p",
          { class: "sub" },
          el("b", { text: "Starting template, like the Isaac Sim VS Code template. " }),
          "It follows your inputs and outputs and has a ",
          el("code", { text: "compute()" }),
          " with three steps. Write your own logic in your editor after downloading; nothing is assumed:"
        ),
    kept ? null : steps
  );
}

function duplicateNode() {
  const copy = JSON.parse(JSON.stringify(currentNode()));
  const oldName = copy.name;
  copy.name = uniqueNodeName(copy.name);
  copy.uiName = G.splitWords(copy.name);
  if (copy.pythonSource) copy.pythonSource = G.renameInSource(copy.pythonSource, "node", oldName, copy.name);
  copy.pythonOriginal = null;
  project.nodes.splice(selected + 1, 0, copy);
  selectNode(selected + 1);
}

function deleteNode() {
  const node = currentNode();
  if (!confirm(`Delete node "${node.uiName || node.name}"?`)) return;
  project.nodes.splice(selected, 1);
  selectNode(Math.min(selected, project.nodes.length - 1));
}

// ---------------------------------------------------------------------------
// Previews

const ROW = 22;
const HEAD = 30;

function nodeSvg(node, { standalone = false } = {}) {
  const inputs = G.allInputs(node);
  const outputs = G.allOutputs(node);
  const label = (a) => a.uiName || G.splitWords(a.name) || a.name || "?";
  const title = node.uiName || G.splitWords(node.name) || "Node";
  const maxIn = Math.max(0, ...inputs.map((a) => label(a).length));
  const maxOut = Math.max(0, ...outputs.map((a) => label(a).length));
  const width = Math.max(190, title.length * 8 + 40, 28 + maxIn * 7 + 36 + maxOut * 7 + 28);
  const rows = Math.max(inputs.length, outputs.length, 1);
  const height = HEAD + rows * ROW + 12;
  const isAction = node.action || hasExecution(node);
  const accent = isAction ? "#f6ad55" : "#2dd4bf";
  const font = 'font-family="Inter, Segoe UI, Arial, sans-serif"';

  const pin = (a, x, y) => {
    const color = typeColor(a.type);
    if (a.type === "execution") return `<path d="M${x - 5} ${y - 6} L${x + 5} ${y} L${x - 5} ${y + 6} Z" fill="${color}"/>`;
    if (String(a.type).endsWith("[]")) return `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" fill="#262c33" stroke="${color}" stroke-width="2.5"/>`;
    return `<circle cx="${x}" cy="${y}" r="5.5" fill="${color}" stroke="#14181c" stroke-width="1.5"/>`;
  };
  let parts = "";
  inputs.forEach((a, i) => {
    const y = HEAD + 16 + i * ROW;
    parts += pin(a, 0, y);
    parts += `<text x="14" y="${y + 4}" fill="#d9dee3" font-size="12" ${font}>${esc(label(a))}</text>`;
  });
  outputs.forEach((a, i) => {
    const y = HEAD + 16 + i * ROW;
    parts += pin(a, width, y);
    parts += `<text x="${width - 14}" y="${y + 4}" fill="#d9dee3" font-size="12" text-anchor="end" ${font}>${esc(label(a))}</text>`;
  });
  const pad = 12;
  const ns = standalone ? ' xmlns="http://www.w3.org/2000/svg"' : "";
  return `<svg${ns} viewBox="${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}" width="${width + pad * 2}" height="${height + pad * 2}" role="img" aria-label="${esc(title)} node preview">
  <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#262c33" stroke="#3d4650"/>
  <path d="M0 8 a8 8 0 0 1 8 -8 h${width - 16} a8 8 0 0 1 8 8 v${HEAD - 8} h-${width} Z" fill="#353d47"/>
  <rect x="0" y="0" width="${width}" height="3" rx="1.5" fill="${accent}"/>
  <text x="12" y="20" fill="#f1f4f7" font-size="13" font-weight="600" ${font}>${esc(title)}</text>
  ${parts}
</svg>`;
}

function renderNodePreview() {
  const node = currentNode();
  $("#nodePreview").innerHTML = node ? nodeSvg(node) : '<p class="hint">No node selected.</p>';
  $("#legend").replaceChildren(
    ...LEGEND.map(([text, type]) => el("span", {}, el("i", { style: `background:${typeColor(type)}${type === "execution" ? ";border-radius:1px;clip-path:polygon(0 0,100% 50%,0 100%)" : ""}` }), text)),
    el("span", {}, el("i", { style: "border:2px solid #f6c453;border-radius:2px;background:transparent" }), "Array")
  );

  const panel = $("#propertyPreview");
  panel.replaceChildren();
  if (!node) return;
  const group = (title, attrs, isInput) => {
    panel.append(el("div", { class: "pp-group", text: title }));
    const data = attrs.filter((a) => a.type !== "execution");
    if (!data.length) panel.append(el("div", { class: "pp-empty", text: "none" }));
    for (const a of data) panel.append(el("div", { class: "pp-row" }, el("label", { text: a.uiName || G.splitWords(a.name) || a.name, title: a.description }), widget(a, isInput)));
  };
  group("Inputs", G.allInputs(node), true);
  group("Outputs", G.allOutputs(node), false);
}

function widget(attr, isInput) {
  const info = G.typeInfo(attr.type) || {};
  const raw = isInput ? String(attr.default ?? "") : "";
  if (info.kind === "bool") {
    const on = isInput && /^(true|1)$/i.test(raw.trim());
    return el("div", { class: "pp-fields" }, el("span", { class: "pp-check", text: on ? "✓" : "" }));
  }
  if (info.kind === "tuple") {
    let values = [];
    try {
      values = JSON.parse(raw || info.default);
    } catch {
      values = [];
    }
    return el("div", { class: "pp-fields" }, ...Array.from({ length: info.size }, (_, i) => el("span", { class: "pp-field", text: isInput ? fmt(values[i]) : "0.0" })));
  }
  if (info.kind === "array") {
    let count = 0;
    try {
      count = JSON.parse(raw || "[]").length;
    } catch {
      count = 0;
    }
    return el("div", { class: "pp-fields" }, el("span", { class: "pp-field", text: `${count} item${count === 1 ? "" : "s"}` }));
  }
  const fallback = info.kind === "text" ? "" : info.kind === "number" ? "0.0" : "0";
  return el("div", { class: "pp-fields" }, el("span", { class: "pp-field", text: isInput ? raw || fallback : fallback }));
}

function fmt(v) {
  if (typeof v !== "number") return "0.0";
  return Number.isInteger(v) ? v.toFixed(1) : String(v);
}

// ---------------------------------------------------------------------------
// Files preview

function languageFor(path) {
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".ogn") || path.endsWith(".json")) return "json";
  if (path.endsWith(".toml")) return "ini";
  if (path.endsWith(".md")) return "markdown";
  return null;
}

function renderFiles(files) {
  const tree = $("#fileTree");
  tree.replaceChildren();
  const seenDirs = new Set();
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  if (!sorted.some((f) => f.path === currentFile)) {
    currentFile = sorted.find((f) => f.path.endsWith(`Ogn${currentNode()?.name}.py`))?.path || sorted[0]?.path;
  }
  for (const f of sorted) {
    const parts = f.path.split("/");
    for (let i = 1; i < parts.length; i++) {
      const dir = parts.slice(0, i).join("/");
      if (seenDirs.has(dir)) continue;
      seenDirs.add(dir);
      tree.append(el("li", { class: "dir", style: `padding-left:${6 + (i - 1) * 12}px`, text: `${parts[i - 1]}/` }));
    }
    tree.append(
      el("li", {
        class: `file ${f.path === currentFile ? "active" : ""}`,
        style: `padding-left:${6 + (parts.length - 1) * 12}px`,
        text: parts[parts.length - 1],
        title: f.path,
        onclick: () => {
          currentFile = f.path;
          renderFiles(files);
        },
      })
    );
  }
  const file = sorted.find((f) => f.path === currentFile);
  $("#fileName").textContent = file?.path || "";
  const code = $("#fileCode");
  if (!file) {
    code.textContent = "";
    return;
  }
  if (typeof file.content !== "string") {
    code.textContent = "(PNG image, generated when you download)";
    return;
  }
  const owner = file.owner === "user"
    ? file.node && project.nodes.find((n) => n.name === file.node)?.pythonSource ? "your code, kept as-is" : "starting template, yours to edit"
    : "generated from the form";
  $("#fileName").textContent = `${file.path}  (${owner})`;
  const lang = languageFor(file.path);
  if (window.hljs && lang && hljs.getLanguage(lang)) code.innerHTML = hljs.highlight(file.content, { language: lang }).value;
  else code.textContent = file.content;
}

// ---------------------------------------------------------------------------
// "How to use" panel

function renderUsePanel() {
  const ext = project.extension;
  const nodes = project.nodes.map((n) => `${ext.name}.${n.name}`);
  const panel = $("#usePanel");
  panel.innerHTML = `
    <ol>
      <li><b>Get the extension</b>
        <p>Click <b>Download .zip</b> and unzip it, or <b>Save to folder</b> (Chrome / Edge) to write it straight to disk.
        You get a folder named <code>${esc(ext.name)}</code>.</p></li>
      <li><b>Keep it inside an extensions folder</b>
        <p>For example:</p>
        <pre>~/isaacsim_exts/
└── ${esc(ext.name)}/
    ├── config/extension.toml
    └── ${esc(G.modulePath(ext.name || "my/ext"))}/nodes/Ogn*.ogn + Ogn*.py</pre></li>
      <li><b>Add the parent folder to Isaac Sim</b>
        <p><b>Window &gt; Extensions &gt; &#9776; &gt; Settings &gt; Extension Search Paths</b>, add
        <code>~/isaacsim_exts</code> (the folder <i>containing</i> the extension, not the extension itself).</p></li>
      <li><b>Enable it</b>
        <p>Search the extension list for <b>${esc(ext.title)}</b>, turn it on and tick <i>Autoload</i>.</p></li>
      <li><b>Use the nodes</b>
        <p><b>Window &gt; Graph Editors &gt; Action Graph</b>, then search for:</p>
        <pre>${nodes.map(esc).join("\n") || "(no nodes)"}</pre></li>
      <li><b>Edit the code later</b>
        <p>Change <code>compute()</code> in <code>Ogn&lt;Node&gt;.py</code> between the BEGIN/END USER CODE markers; it reloads while
        Isaac Sim runs. Re-open the folder here with <b>Open&hellip;</b> to change inputs and outputs with the GUI.</p></li>
    </ol>
    <h3 class="panel-title">From a standalone Python script</h3>
    <pre>from isaacsim import SimulationApp
app = SimulationApp({"headless": False})
import omni.kit.app
manager = omni.kit.app.get_app().get_extension_manager()
manager.add_path("/path/to/isaacsim_exts")
manager.set_extension_enabled_immediate("${esc(ext.name)}", True)</pre>
    <table class="versions">
      <thead><tr><th>Isaac Sim</th><th>Kit</th><th>Python</th><th>Status</th></tr></thead>
      <tbody>${G.SUPPORTED_VERSIONS.map((v) => `<tr><td>${esc(v.label)}</td><td>${v.kit}</td><td>${v.python}</td><td>${esc(v.status)}</td></tr>`).join("")}</tbody>
    </table>
    <p class="hint" style="margin-top:10px">Python nodes only. C++ nodes always need a compiled build.</p>
    ${G.usesRos(project) ? rosHelp() : ""}`;
}

function rosHelp() {
  return `
    <h3 class="panel-title">Starting Isaac Sim for ROS 2 nodes</h3>
    <p class="hint">Isaac Sim's Python (3.11 in 5.x, 3.12 in 6.x / 7.0) cannot use a system ROS 2 such as Humble (Python 3.10).
    Start Isaac Sim from a terminal where ROS 2 is <b>not</b> sourced, using its internal ROS 2 libraries:</p>
    <pre>export ROS_DISTRO=humble                    # or jazzy
export RMW_IMPLEMENTATION=rmw_fastrtps_cpp
ISAAC=$(python -c "import isaacsim, os; print(os.path.dirname(isaacsim.__file__))")
# Isaac Sim 6.x / 7.0
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$ISAAC/exts/isaacsim.ros2.core/humble/lib
# Isaac Sim 5.x
# export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$ISAAC/exts/isaacsim.ros2.bridge/humble/lib
isaacsim</pre>
    <p class="hint">If ROS 2 is not set up, the node still loads and its error message explains this. Use
    <code>ros2 topic echo</code> / <code>rviz2</code> from a normal, sourced terminal (same <code>ROS_DOMAIN_ID</code>).</p>`;
}

// ---------------------------------------------------------------------------
// Refresh everything that depends on the project

function refresh() {
  const validation = G.validateProject(project);
  renderNodeList(validation);
  renderChecks(validation);
  renderNodePreview();
  const typeId = $("#nodeTypeId");
  if (typeId && currentNode()) typeId.value = G.nodeTypeName(project, currentNode());
  $("#extName").classList.toggle("invalid", validation.errors.some((e) => e.startsWith("Extension name")));
  $("#extVersion").classList.toggle("invalid", validation.errors.some((e) => e.startsWith("Version")));
  renderFiles(G.generateFiles(project, { iconPng: "png", previewPng: "png" }).map((f) => ({ ...f, content: f.content === "png" ? null : f.content })));
  renderUsePanel();
  const blocked = validation.errors.length > 0;
  for (const id of ["downloadBtn", "writeFolderBtn"]) {
    $(`#${id}`).disabled = blocked;
    $(`#${id}`).title = blocked ? "Fix the errors in Checks first" : "";
  }
  scheduleSave();
}

function renderChecks(validation) {
  const list = $("#checksList");
  list.replaceChildren(
    ...validation.errors.map((m) => el("li", { class: "error", text: m })),
    ...validation.warnings.map((m) => el("li", { class: "warn", text: m }))
  );
  if (!validation.errors.length) list.prepend(el("li", { class: "ok", text: "Ready to export." }));
}

// ---------------------------------------------------------------------------
// Export

async function svgToPng(svg, width, height, background) {
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (background) background(ctx, width, height);
    const scale = Math.min((width * 0.86) / img.width, (height * 0.86) / img.height, 3);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    return new Uint8Array(await blob.arrayBuffer());
  } catch {
    return undefined; // generator falls back to a placeholder PNG
  } finally {
    URL.revokeObjectURL(url);
  }
}

function graphBackground(ctx, w, h) {
  ctx.fillStyle = "#1b1f24";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#262b31";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
}

async function buildAssets() {
  const iconPng = await svgToPng(G.iconSvg(), 256, 256);
  const previewNode = project.nodes[0];
  const previewPng = previewNode ? await svgToPng(nodeSvg(previewNode, { standalone: true }), 640, 360, graphBackground) : undefined;
  return { iconPng, previewPng };
}

function ensureValid() {
  const { errors } = G.validateProject(project);
  if (errors.length) {
    toast(`Fix ${errors.length} error${errors.length > 1 ? "s" : ""} in Checks first.`, "error");
    return false;
  }
  return true;
}

async function downloadZip() {
  if (!ensureValid()) return;
  if (typeof JSZip === "undefined") {
    toast("The ZIP library did not load (offline?). Try Save to folder, or reload the page.", "error");
    return;
  }
  const files = G.generateFiles(project, await buildAssets());
  const zip = new JSZip();
  for (const f of files) zip.file(f.path, f.content);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const a = el("a", { href: URL.createObjectURL(blob), download: `${project.extension.name}.zip` });
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
  toast(`Downloaded ${project.extension.name}.zip\nUnzip it into your extensions folder, then add that folder in Isaac Sim (see How to use).`);
}

async function getDir(parent, parts) {
  let dir = parent;
  for (const p of parts) dir = await dir.getDirectoryHandle(p, { create: true });
  return dir;
}

async function writeToFolder() {
  if (!ensureValid()) return;
  if (!("showDirectoryPicker" in window)) {
    toast("Saving straight to a folder needs Chrome, Edge or Opera.\nUse Download .zip in this browser.", "warn", 6000);
    return;
  }
  let parent;
  try {
    parent = await window.showDirectoryPicker({ id: "ogn-builder-save", mode: "readwrite" });
  } catch (e) {
    if (e.name !== "AbortError") toast(`Could not open the folder: ${e.message}`, "error");
    return;
  }
  const extName = project.extension.name;
  const files = G.generateFiles(project, await buildAssets());
  let root = parent;
  let strip = 0;
  let location = `${parent.name}/${extName}`;
  let searchPath = parent.name;

  if (parent.name === extName) {
    if (!confirm(`You picked the "${extName}" folder itself.\nWrite the extension files directly into it?`)) return;
    strip = 1;
    location = parent.name;
    searchPath = "the folder that contains it";
  }

  // A stale Ogn*.ogn (node removed or renamed here) would still register in Isaac Sim.
  // Only .ogn files are removed; .py files are yours and are never deleted.
  const nodesParts = [...(strip ? [] : [extName]), ...G.modulePath(extName).split("/"), "nodes"];
  const keep = new Set(files.map((f) => f.path.split("/").pop()));
  try {
    let nodesDir = root;
    for (const p of nodesParts) nodesDir = await nodesDir.getDirectoryHandle(p);
    const stale = [];
    for await (const [name, handle] of nodesDir.entries()) {
      if (handle.kind === "file" && /^Ogn.+\.ogn$/.test(name) && !keep.has(name)) stale.push(name);
    }
    if (stale.length && confirm(`These node definitions are no longer in the builder:\n\n${stale.join("\n")}\n\nRemove them so Isaac Sim stops loading those nodes?\n(Their .py files are kept.)`)) {
      for (const name of stale) await nodesDir.removeEntry(name);
    }
  } catch {
    /* nodes folder does not exist yet */
  }

  const written = [];
  const kept = [];
  try {
    for (const f of files) {
      const parts = f.path.split("/").slice(strip);
      const dir = await getDir(root, parts.slice(0, -1));
      const fileName = parts[parts.length - 1];
      if (f.owner === "user") {
        const onDisk = await readExisting(dir, fileName, typeof f.content === "string");
        if (onDisk !== null) {
          const node = f.node ? project.nodes.find((n) => n.name === f.node) : null;
          // Update a .py only when it is still exactly what the builder opened (e.g. to apply a rename here).
          const safeUpdate = node && node.pythonOriginal !== null && onDisk === node.pythonOriginal && onDisk !== f.content;
          if (!safeUpdate) {
            if (onDisk !== f.content && typeof f.content === "string") kept.push(parts.join("/"));
            continue;
          }
        }
      }
      const handle = await dir.getFileHandle(fileName, { create: true });
      const writable = await handle.createWritable();
      await writable.write(f.content);
      await writable.close();
      written.push(parts.join("/"));
      const node = f.node ? project.nodes.find((n) => n.name === f.node) : null;
      if (node) node.pythonOriginal = f.content;
    }
  } catch (e) {
    toast(`Saving failed: ${e.message}`, "error", 7000);
    return;
  }
  const keptNote = kept.filter((p) => p.endsWith(".py")).length
    ? `\nKept your existing ${kept.filter((p) => p.endsWith(".py")).map((p) => p.split("/").pop()).join(", ")} unchanged.`
    : "";
  toast(`Saved ${written.length} files to ${location}${keptNote}\nIn Isaac Sim add ${searchPath === parent.name ? `"${searchPath}"` : searchPath} as an Extension Search Path.`, "info", 9000);
  scheduleSave();
}

// Text (or bytes) of an existing file, or null if it does not exist.
async function readExisting(dir, name, asText) {
  try {
    const file = await (await dir.getFileHandle(name)).getFile();
    return asText ? await file.text() : new Uint8Array(await file.arrayBuffer());
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Import

function pickExtensionRoot(files) {
  const roots = Object.keys(files)
    .filter((p) => p === "config/extension.toml" || p.endsWith("/config/extension.toml"))
    .map((p) => p.slice(0, -"config/extension.toml".length));
  if (!roots.length) return Object.keys(files).some((p) => p.endsWith(".ogn")) ? "" : null;
  const withNodes = roots.filter((r) => Object.keys(files).some((p) => p.startsWith(r) && p.endsWith(".ogn")));
  const choice = (withNodes[0] ?? roots[0]);
  if (roots.length > 1) toast(`Found ${roots.length} extensions; opened "${choice.replace(/\/$/, "") || "root"}".`, "warn");
  return choice;
}

function applyImport(files, pickedName) {
  const root = pickExtensionRoot(files);
  if (root === null) {
    toast("No extension found: expected config/extension.toml or .ogn files.", "error");
    return;
  }
  const relative = {};
  for (const [p, text] of Object.entries(files)) if (p.startsWith(root)) relative[p.slice(root.length)] = text;
  const folderName = root.replace(/\/$/, "").split("/").pop() || pickedName;
  try {
    const { project: imported, warnings } = G.importProject(relative, folderName);
    if (!isProjectShape(imported)) throw new Error("unrecognised project");
    project = G.normalizeProject(imported);
    selected = 0;
    currentFile = null;
    renderAll();
    toast(`Opened ${project.extension.name} (${project.nodes.length} node${project.nodes.length === 1 ? "" : "s"}).`);
    if (warnings.length) toast(warnings.join("\n"), "warn", 8000);
  } catch (e) {
    toast(`Could not open the extension: ${e.message}`, "error");
  }
}

async function readDirectory(dir, prefix = "", depth = 0, out = {}) {
  if (depth > 8) return out;
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === "directory") {
      if (!SKIP_DIRS.has(name)) await readDirectory(handle, `${prefix}${name}/`, depth + 1, out);
    } else if (TEXT_EXTENSIONS.test(name) || name === G.PROJECT_FILE) {
      const file = await handle.getFile();
      if (file.size < 1_000_000) out[`${prefix}${name}`] = await file.text();
    }
  }
  return out;
}

async function importFolder() {
  closeMenus();
  if (!("showDirectoryPicker" in window)) {
    toast("Opening a folder needs Chrome, Edge or Opera. Use Extension .zip instead.", "warn", 6000);
    return;
  }
  try {
    const dir = await window.showDirectoryPicker({ id: "ogn-builder-open", mode: "read" });
    applyImport(await readDirectory(dir), dir.name);
  } catch (e) {
    if (e.name !== "AbortError") toast(`Could not read the folder: ${e.message}`, "error");
  }
}

async function importZipFile(file) {
  if (typeof JSZip === "undefined") {
    toast("The ZIP library did not load. Reload the page and try again.", "error");
    return;
  }
  try {
    const zip = await JSZip.loadAsync(file);
    const files = {};
    const entries = Object.values(zip.files).filter(
      (f) => !f.dir && (TEXT_EXTENSIONS.test(f.name) || f.name.endsWith(G.PROJECT_FILE)) && !f.name.split("/").some((p) => SKIP_DIRS.has(p))
    );
    for (const entry of entries) files[entry.name] = await entry.async("string");
    applyImport(files, file.name.replace(/\.zip$/i, ""));
  } catch (e) {
    toast(`Could not read the zip: ${e.message}`, "error");
  }
}

// ---------------------------------------------------------------------------
// Menus, theme, tabs, drag & drop

function closeMenus() {
  document.querySelectorAll(".menu-list").forEach((m) => (m.hidden = true));
  document.querySelectorAll(".menu > button").forEach((b) => b.setAttribute("aria-expanded", "false"));
}

function bindMenu(menuId) {
  const menu = $(`#${menuId}`);
  const button = menu.querySelector("button");
  const list = menu.querySelector(".menu-list");
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = list.hidden;
    closeMenus();
    list.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  });
}

function setFullscreen(on) {
  const panel = document.querySelector(".preview");
  panel.classList.toggle("fullscreen", on);
  document.body.classList.toggle("has-fullscreen", on);
  const btn = $("#fullscreenBtn");
  btn.setAttribute("aria-pressed", String(on));
  btn.querySelector("span").textContent = on ? "Exit full screen" : "Full screen";
  btn.title = on ? "Exit full screen (Esc)" : "Show this panel full screen (Esc to exit)";
}

function setWrap(on) {
  document.querySelector(".file-view").classList.toggle("wrap", on);
  $("#wrapBtn").setAttribute("aria-pressed", String(on));
  storageSet(WRAP_KEY, on ? "1" : "0");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", String(t === tab));
      });
      document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.dataset.panel !== tab.dataset.tab));
    })
  );
}

function bindDragDrop() {
  let overlay = null;
  let depth = 0;
  window.addEventListener("dragenter", (e) => {
    if (![...(e.dataTransfer?.types || [])].includes("Files")) return;
    depth++;
    if (!overlay) {
      overlay = el("div", { class: "drop-overlay", text: "Drop an extension .zip to open it" });
      document.body.append(overlay);
    }
  });
  window.addEventListener("dragleave", () => {
    depth = Math.max(0, depth - 1);
    if (!depth && overlay) {
      overlay.remove();
      overlay = null;
    }
  });
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    depth = 0;
    overlay?.remove();
    overlay = null;
    const file = [...(e.dataTransfer?.files || [])].find((f) => /\.zip$/i.test(f.name));
    if (file) importZipFile(file);
    else if (e.dataTransfer?.files?.length) toast("Drop a .zip file, or use Open > Extension folder.", "warn");
  });
}

function renderAll() {
  fillExtensionFields();
  renderEditor();
  refresh();
}

function init() {
  applyTheme(storageGet(THEME_KEY) || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
  project = loadInitialProject();

  const presetSelect = $("#presetSelect");
  for (const [key, preset] of Object.entries(G.PRESETS)) presetSelect.append(el("option", { value: key, text: preset.label }));
  presetSelect.addEventListener("change", () => {
    const key = presetSelect.value;
    presetSelect.value = "";
    if (!key) return;
    if (project.nodes.length && !confirm("Replace the current extension with this example?\n(Use + Add node to add it alongside instead.)")) return;
    project = G.projectFromPreset(key);
    selected = 0;
    currentFile = null;
    renderAll();
  });

  bindExtensionFields();
  buildAddNodeMenu();
  bindMenu("importMenu");
  bindMenu("addNodeMenu");
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu")) closeMenus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeMenus();
    if (document.querySelector(".preview.fullscreen")) setFullscreen(false);
  });
  $("#fullscreenBtn").addEventListener("click", () => setFullscreen(!document.querySelector(".preview").classList.contains("fullscreen")));
  $("#wrapBtn").addEventListener("click", () => setWrap(!document.querySelector(".file-view").classList.contains("wrap")));
  setWrap(storageGet(WRAP_KEY) === "1");
  $("#importFolderBtn").addEventListener("click", importFolder);
  $("#importZipBtn").addEventListener("click", () => {
    closeMenus();
    $("#zipInput").click();
  });
  $("#zipInput").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) importZipFile(file);
  });
  $("#downloadBtn").addEventListener("click", downloadZip);
  $("#writeFolderBtn").addEventListener("click", writeToFolder);
  $("#themeBtn").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next);
    storageSet(THEME_KEY, next);
  });
  $("#copyFileBtn").addEventListener("click", async () => {
    const text = $("#fileCode").textContent;
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied.");
    } catch {
      toast("Copy failed; select the text and copy manually.", "warn");
    }
  });
  // Folder access exists only in desktop Chrome / Edge / Opera; elsewhere (Firefox, Safari, phones) use the zip.
  if (!("showDirectoryPicker" in window)) {
    $("#writeFolderBtn").hidden = true;
    $("#importFolderBtn").hidden = true;
  }
  bindTabs();
  bindDragDrop();
  renderAll();
  document.body.dataset.ready = "true";
}

init();
