# Isaac Sim OmniGraph Node Builder

**Create Isaac Sim OmniGraph / Action Graph Python nodes with a GUI, with no build step.**

**[Open the builder](https://hrithik-verma.github.io/isaac-sim-omnigraph-node-builder/)**

![OmniGraph Node Builder screenshot](docs/screenshot.png)

Pick inputs and outputs, write the `compute()` code, preview how the node looks in the Action Graph editor, and
download a ready-to-load extension. Isaac Sim loads it directly: no premake, no `repo build`, no C++ toolchain.

## Features

- Visual editor for node inputs/outputs: scalars, vectors, colors, quaternions, arrays, execution pins
- **Action Graph switch** adds Exec In / Exec Out pins so events (On Playback Tick, On Impulse...) trigger your node
- **Keep state** option for counters, timers and anything that must persist between evaluations
- Live preview of the node and its Property panel, plus every generated file
- Several nodes per extension; examples for multiply, add, clamp, vector length, counter, compare & branch
- **Download .zip** (any browser) or **Save to folder** (Chrome / Edge / Opera)
- **Open** an existing extension (folder or .zip) to keep editing it with the GUI; your Python code is kept
- Validation for names, types and default values before export
- Runs fully in the browser; nothing is uploaded

## Supported Isaac Sim versions

| Isaac Sim | Kit | Python | Status |
|---|---|---|---|
| 5.0 | 107.3 | 3.11 | Tested |
| 5.1 | 107.3 | 3.11 | Same Kit as 5.0 |
| 6.1 | 110.3 | 3.12 | Tested |
| 7.0 (alpha) | 110.3 | 3.12 | Same Kit as 6.1 |

"Tested" means the generated example nodes were loaded and run in headless Isaac Sim, including Action Graph
execution (see [tests](#tests)). Python nodes only; C++ nodes always need a compiled build.

## Use a generated extension

1. Unzip it into a folder that holds your extensions, e.g. `~/isaacsim_exts/my.omnigraph.examples`.
2. In Isaac Sim: **Window > Extensions > (menu) > Settings > Extension Search Paths**, add `~/isaacsim_exts`
   (the **parent** folder).
3. Enable the extension, then find your nodes in **Window > Graph Editors > Action Graph**.

Change node logic in `Ogn<Node>.py` between the `BEGIN/END USER CODE` markers; Isaac Sim reloads it while running.

## How it works

OmniGraph scans an extension's Python module folder for `Ogn*.ogn` + `Ogn*.py` pairs and generates the node
database at startup. The builder writes exactly that layout:

```
my.omnigraph.examples/
├── config/extension.toml          [[python.module]] + omni.graph dependency
├── data/icon.png, preview.png
├── docs/README.md, CHANGELOG.md
├── my/omnigraph/examples/
│   ├── __init__.py
│   └── nodes/
│       ├── OgnMultiplyNumbers.ogn
│       ├── OgnMultiplyNumbers.py
│       ├── config/CategoryDefinition.json
│       └── icons/icon.svg
└── .ogn-builder.json              lets the builder re-open the project
```

## Development

Plain HTML, CSS and JavaScript modules; there is no build step here either.

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

- `assets/generator.js`: pure file generator (no DOM), shared by the page and the tests
- `assets/app.js`: the user interface
- `tests/generate.mjs`: generator, validation and import round-trip tests (Node.js 18+)
- `tests/isaacsim_check.py`: loads generated nodes in Isaac Sim and runs them

### Tests

```bash
node tests/generate.mjs /tmp/ogn_out
conda activate isaacsim6            # any Isaac Sim pip environment
python tests/isaacsim_check.py /tmp/ogn_out builder.test.nodes
```

## Contributing

Issues and pull requests are welcome, especially reports from other Isaac Sim versions.

## License

[MIT](LICENSE). Community project, not affiliated with or endorsed by NVIDIA. Isaac Sim, Omniverse and OmniGraph
are trademarks of NVIDIA Corporation.
