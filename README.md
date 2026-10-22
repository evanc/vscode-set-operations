# Set Operations

Treat the lines of editor tabs as sets and open the result in a new untitled editor.

**Two tabs (A and B)**

| Command | Result |
| --- | --- |
| **Set Operations: Intersection** | Lines that appear in both A and B |
| **Set Operations: Union** | Lines that appear in A or B |
| **Set Operations: Difference** | Lines that appear in A but not in B |
| **Set Operations: Symmetric Difference** | Lines that appear in exactly one of A and B (A's first, then B's) |

**One tab**

| Command | Result |
| --- | --- |
| **Set Operations: Unique** | Each line once, with repeats removed |
| **Set Operations: Duplicates** | Lines that appear more than once, each listed once |

## Usage

- **Command Palette:** focus tab A and run a command. Two-tab commands then ask you to pick tab B.
- **Tab context menu:** right-click tab A → **Set Operations** → pick an operation.

If only one other text tab is open, it is used as B without asking. Otherwise the
picker lists every open text tab, with tabs currently on screen (such as the other
side of a split) first. For B − A, run Difference from tab B instead.

## How lines are compared

- Each line is one element. Lines are compared exactly: case, leading and trailing
  whitespace, and blank lines all count.
- A trailing newline at the end of a file does not add an extra empty line.
- Results contain no duplicates and keep first-seen order (A's lines first, then B's
  for Union).
- Unsaved edits are included. The result uses A's language mode and line endings.

## Development

```sh
npm install
npm test                  # unit tests for the set logic
npm run test:integration  # runs the commands inside a downloaded copy of VS Code
npm run package           # builds set-operations-<version>.vsix
```

Press F5 in VS Code to launch an Extension Development Host with the extension loaded.
