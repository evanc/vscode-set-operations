# Set Ops

Treat the lines of editor tabs as sets and open the result in a new editor.

**Two tabs (A and B)**

| Command | Result |
| --- | --- |
| **Set Ops: Intersection** | Lines that appear in both A and B |
| **Set Ops: Union** | Lines that appear in A or B |
| **Set Ops: Difference** | Lines that appear in A but not in B |
| **Set Ops: Symmetric Difference** | Lines that appear in exactly one of A and B (A's first, then B's) |

**One tab**

| Command | Result |
| --- | --- |
| **Set Ops: Unique** | Each line once, with repeats removed |
| **Set Ops: Duplicates** | Lines that appear more than once, each listed once |

## Usage

- **Command Palette:** focus tab A and run a command. Two-tab commands then ask you to pick tab B.
- **Tab context menu:** right-click tab A → **Set Ops** → pick an operation.

If only one other text tab is open, it is used as B without asking. Otherwise the
picker lists every open text tab, with tabs currently on screen (such as the other
side of a split) first. For B − A, run Difference from tab B instead.

## How lines are compared

- Each line is one element. Lines are compared exactly: case, leading and trailing
  whitespace, and blank lines all count.
- A trailing newline at the end of a file does not add an extra empty line.
- Results contain no duplicates and keep first-seen order (A's lines first, then B's
  for Union).
- Unsaved edits are included. The result uses A's line endings, and A's language
  mode unless the result is large.

## Large files

- The work runs in the background, so VS Code and other extensions stay responsive.
- VS Code doesn't share files over 50MB with extensions, so Set Ops reads those from
  disk instead (as UTF-8, up to 256MB). Save any unsaved changes in them first.
- Results over 50MB are too large for an unsaved editor. Set Ops offers to save them
  to a file and opens that instead.

## Development

```sh
npm install
npm test                  # unit tests for the set logic and the worker
npm run test:integration  # runs the commands inside a downloaded copy of VS Code
npm run package           # builds set-ops-<version>.vsix
```

`npm run test:integration` uses a pinned VS Code version; set `VSCODE_VERSION` to test
another (e.g. `1.85.0`, the oldest supported). Press F5 in VS Code to launch an
Extension Development Host with the extension loaded. `images/icon.png` is rendered
from `images/icon.svg` at 256×256.
