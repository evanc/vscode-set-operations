# Set Ops

Compare the lines of your editor tabs as sets. Find what two files have in common,
what's only in one of them, or which lines repeat, and get the answer in a new editor.

It works on anything with one item per line: IDs, email addresses, package names,
URLs, log lines, CSV rows.

## Install

Install **Set Ops** from the
[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=evancoonrod.set-ops),
or search for "Set Ops" in VS Code's Extensions view (`Ctrl+Shift+X`, or `Cmd+Shift+X` on macOS).

## Quick start

1. Open the two files you want to compare. To compare lists from somewhere else,
   paste each one into a new untitled tab (`Ctrl+N` / `Cmd+N`).
2. Click the tab you want to be **A**.
3. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`), type **Set Ops**, and pick
   an operation.
4. Pick tab **B** from the list. If only one other tab is open, it's used automatically.

The result opens in a new, unsaved editor, and your original tabs are left unchanged.

You can also right-click a tab and choose **Set Ops** and then an operation. The tab
you right-clicked is A.

## Operations

All examples below use these two tabs:

```
Tab A     Tab B
-----     -----
apple     banana
banana    cherry
cherry    date
apple
```

| Command | Gives you | Example result |
| --- | --- | --- |
| **Set Ops: Intersection** | Lines in both A and B | banana, cherry |
| **Set Ops: Union** | Lines in A or B (or both) | apple, banana, cherry, date |
| **Set Ops: Difference** | Lines in A that aren't in B | apple |
| **Set Ops: Symmetric Difference** | Lines in exactly one of A and B | apple, date |
| **Set Ops: Unique** | A's lines with repeats removed | apple, banana, cherry |
| **Set Ops: Duplicates** | A's lines that appear more than once | apple |

Unique and Duplicates work on a single tab, so they don't ask for B.

### Compare

**Set Ops: Compare** gives you a quick summary instead of a new editor. If the
example tabs were saved as `a.txt` and `b.txt`, it would show:

> "a.txt" and "b.txt" share some lines. 2 shared · 1 only in "a.txt" · 1 only in "b.txt".

It also tells you when the two tabs have the same lines, when every line of one is in
the other, or when they have nothing in common. Buttons on the message open the shared
lines, or the lines that are only in either tab.

## How lines are matched

- Matching is exact. `Apple` and `apple` are different lines, and so are lines that
  differ only by leading or trailing spaces. Blank lines count too.
- Each line appears at most once in a result, in the order it first appears (A's
  lines first, then B's).
- A newline at the very end of a file doesn't count as an extra blank line.
- Unsaved edits in your tabs are included.
- Results use A's line endings and, unless the result is very large, A's language mode.

## Tips

- **B − A:** Difference gives you A − B. For the other direction, run it from tab B.
- **More than two files:** results are ordinary tabs, so you can chain operations. For
  example, intersect A with B, then intersect that result with C.
- **Keyboard shortcuts:** there are none by default. To add one, run
  **Preferences: Open Keyboard Shortcuts (JSON)** and add an entry such as:

  ```json
  { "key": "ctrl+alt+i", "command": "setOps.intersection" }
  ```

  The command IDs are `setOps.compare`, `setOps.intersection`, `setOps.union`,
  `setOps.difference`, `setOps.symmetricDifference`, `setOps.unique`, and
  `setOps.duplicates`.

## Large files

- The work runs in the background, so VS Code stays responsive. Comparing two
  million-line files takes about a second.
- VS Code doesn't share files over 50MB with extensions, so Set Ops reads those from
  disk instead (as UTF-8, up to 256MB each). Save any changes to such a file first.
- A result over 50MB is too large for an unsaved editor, so Set Ops asks where to save
  it and then opens the saved file.

## Requirements

- VS Code 1.85 or later, on the desktop. It doesn't run in the browser (vscode.dev).
- Works in Restricted Mode, so you can use it in folders you haven't marked as trusted.

## Feedback

Found a bug or have an idea? [Open an issue](https://github.com/evanc/vscode-set-operations/issues).
To work on Set Ops itself, see [CONTRIBUTING.md](CONTRIBUTING.md).
