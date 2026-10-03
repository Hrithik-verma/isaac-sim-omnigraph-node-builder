"""Load a generated extension in Isaac Sim (headless) and run every preset node.

Usage (inside an Isaac Sim Python env, e.g. `conda activate isaacsim6`):
    node tests/generate.mjs /tmp/ogn_out
    python tests/isaacsim_check.py /tmp/ogn_out builder.test.nodes
"""

import sys

from isaacsim import SimulationApp

app = SimulationApp({"headless": True})

import omni.graph.core as og  # noqa: E402
import omni.kit.app  # noqa: E402

ext_folder, ext_name = sys.argv[1], sys.argv[2]
manager = omni.kit.app.get_app().get_extension_manager()
manager.add_path(ext_folder)
manager.set_extension_enabled_immediate("omni.graph.action", True)
manager.set_extension_enabled_immediate(ext_name, True)
for _ in range(5):
    app.update()

results = {}


def check(name, ok, detail=""):
    results[name] = ok
    print(f"{'PASS' if ok else 'FAIL'} {name} {detail}")


types = sorted(t for t in og.get_registered_nodes() if t.startswith(ext_name + "."))
expected = {f"{ext_name}.{n}" for n in
            ["MultiplyNumbers", "AddNumbers", "ClampValue", "VectorLength", "TickCounter", "CompareBranch", "MyNode"]}
check("all node types registered", expected <= set(types), str(types))

keys = og.Controller.Keys

# Data nodes in a push graph
(graph, nodes, _, _) = og.Controller.edit(
    {"graph_path": "/DataGraph", "evaluator_name": "push"},
    {
        keys.CREATE_NODES: [
            ("mul", f"{ext_name}.MultiplyNumbers"),
            ("add", f"{ext_name}.AddNumbers"),
            ("clamp", f"{ext_name}.ClampValue"),
            ("vec", f"{ext_name}.VectorLength"),
            ("blank", f"{ext_name}.MyNode"),
        ],
        keys.SET_VALUES: [
            ("mul.inputs:a", 3.5), ("mul.inputs:b", 4.0),
            ("add.inputs:a", 3.5), ("add.inputs:b", 4.0),
            ("clamp.inputs:value", 7.0), ("clamp.inputs:min", 0.0), ("clamp.inputs:max", 5.0),
            ("vec.inputs:vector", [3.0, 4.0, 12.0]),
            ("blank.inputs:value", 2.5),
        ],
    },
)
og.Controller.evaluate_sync(graph)


def out(path):
    return og.Controller.get(og.Controller.attribute(path))


check("MultiplyNumbers 3.5*4", abs(out("/DataGraph/mul.outputs:product") - 14.0) < 1e-9, out("/DataGraph/mul.outputs:product"))
check("AddNumbers 3.5+4", abs(out("/DataGraph/add.outputs:sum") - 7.5) < 1e-9, out("/DataGraph/add.outputs:sum"))
check("ClampValue 7 in [0,5]", abs(out("/DataGraph/clamp.outputs:result") - 5.0) < 1e-9, out("/DataGraph/clamp.outputs:result"))
check("VectorLength (3,4,12)", abs(out("/DataGraph/vec.outputs:length") - 13.0) < 1e-9, out("/DataGraph/vec.outputs:length"))
check("MyNode passthrough", abs(out("/DataGraph/blank.outputs:result") - 2.5) < 1e-9, out("/DataGraph/blank.outputs:result"))

# Action nodes in an Action Graph: impulse -> counter, impulse -> branch -> counters
(agraph, _, _, _) = og.Controller.edit(
    {"graph_path": "/ActionGraph", "evaluator_name": "execution"},
    {
        keys.CREATE_NODES: [
            ("impulse", "omni.graph.action.OnImpulseEvent"),
            ("counter", f"{ext_name}.TickCounter"),
            ("branch", f"{ext_name}.CompareBranch"),
            ("greater", f"{ext_name}.TickCounter"),
            ("notGreater", f"{ext_name}.TickCounter"),
        ],
        keys.CONNECT: [
            ("impulse.outputs:execOut", "counter.inputs:execIn"),
            ("impulse.outputs:execOut", "branch.inputs:execIn"),
            ("branch.outputs:isGreater", "greater.inputs:execIn"),
            ("branch.outputs:isNotGreater", "notGreater.inputs:execIn"),
        ],
        keys.SET_VALUES: [
            ("impulse.inputs:onlyPlayback", False),
            ("branch.inputs:a", 5.0),
            ("branch.inputs:b", 3.0),
        ],
    },
)
impulse = og.Controller.attribute("/ActionGraph/impulse.state:enableImpulse")
for _ in range(3):
    og.Controller.set(impulse, True)
    og.Controller.evaluate_sync(agraph)
    app.update()

check("TickCounter fired 3 times", out("/ActionGraph/counter.outputs:count") == 3, out("/ActionGraph/counter.outputs:count"))
check("CompareBranch 5>3 -> isGreater", out("/ActionGraph/greater.outputs:count") == 3, out("/ActionGraph/greater.outputs:count"))
check("CompareBranch not isNotGreater", out("/ActionGraph/notGreater.outputs:count") == 0, out("/ActionGraph/notGreater.outputs:count"))

passed = sum(results.values())
print(f"RESULT {passed}/{len(results)} passed")
app.close()
