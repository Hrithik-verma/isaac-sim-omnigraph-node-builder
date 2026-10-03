"""Load the generated test extension in Isaac Sim (headless) and run its nodes.

Usage (inside an Isaac Sim Python env, e.g. `conda activate isaacsim6`):
    node tests/generate.mjs /tmp/ogn_out
    python tests/isaacsim_check.py /tmp/ogn_out builder.test.nodes [--ros]

--ros also runs the ROS 2 publisher -> subscriber round trip. Isaac Sim must be
started with its internal ROS 2 libraries (see the generated README), e.g.:
    export ROS_DISTRO=humble RMW_IMPLEMENTATION=rmw_fastrtps_cpp
    export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:<isaacsim>/exts/isaacsim.ros2.core/humble/lib
"""

import sys
import time

from isaacsim import SimulationApp

app = SimulationApp({"headless": True})

import omni.graph.core as og  # noqa: E402
import omni.kit.app  # noqa: E402

ext_folder, ext_name = sys.argv[1], sys.argv[2]
with_ros = "--ros" in sys.argv
manager = omni.kit.app.get_app().get_extension_manager()
manager.add_path(ext_folder)
manager.set_extension_enabled_immediate("omni.graph.action", True)
manager.set_extension_enabled_immediate(ext_name, True)
for _ in range(5):
    app.update()

results = {}
keys = og.Controller.Keys


def check(name, ok, detail=""):
    results[name] = bool(ok)
    print(f"{'PASS' if ok else 'FAIL'} {name} {detail}")


def out(path):
    return og.Controller.get(og.Controller.attribute(path))


def fire(graph, impulse_path, times=1):
    impulse = og.Controller.attribute(impulse_path)
    for _ in range(times):
        og.Controller.set(impulse, True)
        og.Controller.evaluate_sync(graph)
        app.update()


types = sorted(t for t in og.get_registered_nodes() if t.startswith(ext_name + "."))
expected = {f"{ext_name}.{n}" for n in
            ["MathOperation", "VectorOperation", "ActionNode", "BranchNode", "RosPublisher", "RosSubscriber",
             "MyNode", "FloatSubscriber", "ImuPublisher", "ImuSubscriber", "CustomMsgPublisher"]}
check("all node types registered", expected <= set(types), str(types))

# Data nodes: a user-edited node and untouched templates
(graph, _, _, _) = og.Controller.edit(
    {"graph_path": "/DataGraph", "evaluator_name": "push"},
    {
        keys.CREATE_NODES: [
            ("math", f"{ext_name}.MathOperation"),
            ("vec", f"{ext_name}.VectorOperation"),
            ("blank", f"{ext_name}.MyNode"),
        ],
        keys.SET_VALUES: [
            ("math.inputs:a", 3.5), ("math.inputs:b", 4.0),
            ("vec.inputs:vector", [3.0, 4.0, 12.0]),
            ("blank.inputs:value", 2.5),
        ],
    },
)
og.Controller.evaluate_sync(graph)
check("edited MathOperation: a * b = 14", abs(out("/DataGraph/math.outputs:result") - 14.0) < 1e-9, out("/DataGraph/math.outputs:result"))
check("template VectorOperation runs (placeholder 0.0)", out("/DataGraph/vec.outputs:value") == 0.0, out("/DataGraph/vec.outputs:value"))
check("template MyNode runs (placeholder 0.0)", out("/DataGraph/blank.outputs:result") == 0.0, out("/DataGraph/blank.outputs:result"))

# Action Graph templates: impulse -> ActionNode -> BranchNode, and a downstream counter-free check
(agraph, _, _, _) = og.Controller.edit(
    {"graph_path": "/ActionGraph", "evaluator_name": "execution"},
    {
        keys.CREATE_NODES: [
            ("impulse", "omni.graph.action.OnImpulseEvent"),
            ("action", f"{ext_name}.ActionNode"),
            ("branch", f"{ext_name}.BranchNode"),
        ],
        keys.CONNECT: [
            ("impulse.outputs:execOut", "action.inputs:execIn"),
            ("action.outputs:execOut", "branch.inputs:execIn"),
        ],
        keys.SET_VALUES: [("impulse.inputs:onlyPlayback", False)],
    },
)
fire(agraph, "/ActionGraph/impulse.state:enableImpulse", 2)
action_node = og.Controller.node("/ActionGraph/action")
branch_node = og.Controller.node("/ActionGraph/branch")
check("template ActionNode computed", action_node.get_compute_count() >= 2, f"computes={action_node.get_compute_count()}")
check("ActionNode execOut triggered BranchNode", branch_node.get_compute_count() >= 2, f"computes={branch_node.get_compute_count()}")

if with_ros:
    (rgraph, _, _, _) = og.Controller.edit(
        {"graph_path": "/RosGraph", "evaluator_name": "execution"},
        {
            keys.CREATE_NODES: [
                ("impulse", "omni.graph.action.OnImpulseEvent"),
                ("pub", f"{ext_name}.RosPublisher"),
                ("sub", f"{ext_name}.FloatSubscriber"),
                ("twist", f"{ext_name}.RosSubscriber"),
                ("imuPub", f"{ext_name}.ImuPublisher"),
                ("imuSub", f"{ext_name}.ImuSubscriber"),
            ],
            keys.CONNECT: [
                ("impulse.outputs:execOut", "pub.inputs:execIn"),
                ("impulse.outputs:execOut", "sub.inputs:execIn"),
                ("impulse.outputs:execOut", "twist.inputs:execIn"),
                ("impulse.outputs:execOut", "imuPub.inputs:execIn"),
                ("impulse.outputs:execOut", "imuSub.inputs:execIn"),
            ],
            keys.SET_VALUES: [
                ("impulse.inputs:onlyPlayback", False),
                ("pub.inputs:value", 2.5),
                ("imuPub.inputs:angular_velocity_vector", [0.0, 0.0, 0.75]),
            ],
        },
    )
    received = None
    for i in range(120):
        fire(rgraph, "/RosGraph/impulse.state:enableImpulse")
        received = out("/RosGraph/sub.outputs:received")
        imu_z = out("/RosGraph/imuSub.outputs:angular_z")
        if received == 2.5 and imu_z == 0.75:
            break
        time.sleep(0.05)
    check("ROS 2 publisher -> subscriber round trip", received == 2.5, f"received={received} after {i + 1} ticks")
    check("ROS 2 sensor_msgs/Imu round trip (underscore attribute names)", imu_z == 0.75, f"angular_velocity.z={imu_z}")
    check("template RosSubscriber (Twist) runs", og.Controller.node("/RosGraph/twist").get_compute_count() > 0,
          f"linearX={out('/RosGraph/twist.outputs:linearX')}")
    # A custom message package that is not installed: the node loads and says what is missing.
    (cgraph, _, _, _) = og.Controller.edit(
        {"graph_path": "/CustomGraph", "evaluator_name": "execution"},
        {
            keys.CREATE_NODES: [("impulse", "omni.graph.action.OnImpulseEvent"), ("pub", f"{ext_name}.CustomMsgPublisher")],
            keys.CONNECT: [("impulse.outputs:execOut", "pub.inputs:execIn")],
            keys.SET_VALUES: [("impulse.inputs:onlyPlayback", False)],
        },
    )
    og.Controller.set(og.Controller.attribute("/CustomGraph/impulse.state:enableImpulse"), True)
    og.Controller.evaluate_sync(cgraph)
    cmsg = og.Controller.node("/CustomGraph/pub").get_compute_messages(og.Severity.ERROR)
    check("missing custom message package explained", any("Message package 'builder_test_msgs'" in m for m in cmsg), str(cmsg)[:150])

    # Deleting the OmniGraph nodes must destroy their ROS 2 nodes (release() -> cleanup_ros()).
    import rclpy

    probe = rclpy.create_node("builder_test_probe")

    def generated_ros_nodes():
        return [n for n in probe.get_node_names() if n.startswith(("og_ros_publisher", "og_float_subscriber", "og_ros_subscriber", "og_imu_"))]

    before = generated_ros_nodes()
    og.Controller.edit("/RosGraph", {keys.DELETE_NODES: ["pub", "sub", "twist", "imuPub", "imuSub"]})
    for _ in range(40):
        app.update()
        if not generated_ros_nodes():
            break
        time.sleep(0.05)
    after = generated_ros_nodes()
    probe.destroy_node()
    check("deleting nodes destroys their ROS 2 nodes", len(before) == 5 and not after, f"before={len(before)} after={after}")

else:
    # Without a usable rclpy the ROS nodes must still load and explain what to do when they run.
    (ngraph, _, _, _) = og.Controller.edit(
        {"graph_path": "/NoRosGraph", "evaluator_name": "execution"},
        {
            keys.CREATE_NODES: [("impulse", "omni.graph.action.OnImpulseEvent"), ("pub", f"{ext_name}.RosPublisher")],
            keys.CONNECT: [("impulse.outputs:execOut", "pub.inputs:execIn")],
            keys.SET_VALUES: [("impulse.inputs:onlyPlayback", False)],
        },
    )
    # Read the compute messages straight after evaluation; the next app.update() clears them.
    og.Controller.set(og.Controller.attribute("/NoRosGraph/impulse.state:enableImpulse"), True)
    og.Controller.evaluate_sync(ngraph)
    messages = og.Controller.node("/NoRosGraph/pub").get_compute_messages(og.Severity.ERROR)

    rclpy_ok = False
    try:
        import rclpy  # noqa: F401

        rclpy_ok = True
    except Exception:
        pass
    if rclpy_ok:
        check("ROS publisher runs (rclpy available)", not messages, str(messages))
    else:
        check("ROS publisher explains missing ROS 2 setup", any("ROS 2 is not available" in m for m in messages), str(messages)[:160])

passed = sum(results.values())
print(f"RESULT {passed}/{len(results)} passed")
app.close()
