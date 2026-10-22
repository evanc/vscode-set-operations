import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

// Runs inside a VS Code instance launched by runIntegration.ts. With exactly two
// tabs open the second one is picked automatically, so no quick pick interaction
// is needed. Single-tab operations ignore tab B.
export async function run(): Promise<void> {
  await check('setOps.intersection', 'b\nc');
  await check('setOps.union', 'a\nb\nc\nd');
  await check('setOps.difference', 'a');
  await check('setOps.difference', 'd', { fromTabB: true });
  await check('setOps.symmetricDifference', 'a\nd');
  await check('setOps.unique', 'a\nb\nc');
  await check('setOps.duplicates', 'b');
  await checkLargeFiles();
  console.log('All integration checks passed');
}

async function check(command: string, expected: string, options: { fromTabB?: boolean } = {}) {
  const docA = await vscode.workspace.openTextDocument({ content: 'a\nb\nc\nb\n' });
  const docB = await vscode.workspace.openTextDocument({ content: 'b\nc\nd\n' });
  await vscode.window.showTextDocument(docB, { preview: false });
  await vscode.window.showTextDocument(docA, { preview: false });

  // Simulates the tab context menu, which passes the clicked tab's URI.
  await vscode.commands.executeCommand(command, ...(options.fromTabB ? [docB.uri] : []));

  const result = vscode.window.activeTextEditor?.document;
  assert.ok(result && result !== docA && result !== docB, `${command}: no result editor opened`);
  assert.strictEqual(result.getText(), expected, `${command}${options.fromTabB ? ' (from B)' : ''}`);

  await closeAllEditors();
}

/**
 * VS Code doesn't share documents over 50MB with extensions. This file is ~62MB:
 * 2M lines, every tenth repeating the one before, so 1.8M unique lines (~56MB)
 * and 200K duplicates (~6MB).
 */
async function checkLargeFiles() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'set-ops-'));
  try {
    const big = vscode.Uri.file(path.join(dir, 'big.txt'));
    const lines: string[] = [];
    for (let i = 0; i < 2_000_000; i++) {
      lines.push(`${String(i % 10 === 9 ? i - 1 : i).padStart(9, '0')}-abcdefghijklmnopqrst`);
    }
    fs.writeFileSync(big.fsPath, lines.join('\n') + '\n');

    // A large input with a small result: read from disk, shown in an untitled editor.
    await vscode.commands.executeCommand('vscode.open', big);
    assert.strictEqual(vscode.window.activeTextEditor, undefined, 'expected VS Code not to share big.txt');
    await vscode.commands.executeCommand('setOps.duplicates');
    const duplicates = activeDocument();
    assert.ok(duplicates?.isUntitled, 'large input: no result editor opened');
    assert.strictEqual(duplicates.lineCount, 200_000);
    assert.strictEqual(duplicates.lineAt(0).text, '000000008-abcdefghijklmnopqrst');
    await closeAllEditors();

    // A result too large for an untitled editor: saved to a file, then opened.
    const target = vscode.Uri.file(path.join(dir, 'unique.txt'));
    const restore = stubWindow({
      showWarningMessage: async () => 'Save As…',
      showSaveDialog: async () => target,
    });
    try {
      await vscode.commands.executeCommand('vscode.open', big);
      await vscode.commands.executeCommand('setOps.unique');
    } finally {
      restore();
    }
    assert.strictEqual(fs.readFileSync(target.fsPath, 'utf8').split('\n').length, 1_800_000);
    const tabs = vscode.window.tabGroups.all.flatMap((g) => g.tabs);
    assert.ok(tabs.some((t) => t.label === 'unique.txt'), 'large result: saved file not opened');
    assert.ok(!tabs.some((t) => t.isDirty), 'large result: left an unsaved tab behind');
    await closeAllEditors();

    // A large file with unsaved changes can't be read, since only the saved version is on disk.
    await vscode.commands.executeCommand('vscode.open', big);
    await vscode.commands.executeCommand('type', { text: 'edit' });
    const errors: string[] = [];
    const restoreErrors = stubWindow({ showErrorMessage: async (message: string) => void errors.push(message) });
    try {
      await vscode.commands.executeCommand('setOps.duplicates');
    } finally {
      restoreErrors();
    }
    assert.match(errors.join('\n'), /unsaved changes/, 'large dirty file: expected an unsaved-changes error');
    await closeAllEditors();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Read through a function so TypeScript doesn't keep an earlier assertion's narrowing. */
function activeDocument(): vscode.TextDocument | undefined {
  return vscode.window.activeTextEditor?.document;
}

/** The extension shares this test's `vscode` API object, so its dialogs can be stubbed here. */
function stubWindow(stubs: Record<string, unknown>): () => void {
  const window = vscode.window as unknown as Record<string, unknown>;
  const originals = Object.fromEntries(Object.keys(stubs).map((key) => [key, window[key]]));
  Object.assign(window, stubs);
  return () => Object.assign(window, originals);
}

async function closeAllEditors() {
  for (let i = 0; i < 10 && vscode.window.tabGroups.all.some((g) => g.tabs.length > 0); i++) {
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
  }
}
