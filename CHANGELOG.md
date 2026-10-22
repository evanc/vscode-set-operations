# Changelog

## 0.1.1

- Expanded the README into a user guide with a quick start, examples for each
  operation, tips, and large-file notes.

## 0.1.0

First Marketplace release.

- Two-tab operations: Intersection, Union, Difference, Symmetric Difference.
- One-tab operations: Unique, Duplicates.
- Run from the Command Palette or a tab's right-click menu.
- Large files: work runs off the main extension host thread; files over 50MB are
  read from disk; results over 50MB are saved to a file.
- Works in Restricted Mode and virtual workspaces.
