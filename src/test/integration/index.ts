import * as assert from 'assert';
import * as vscode from 'vscode';

// Runs inside a VS Code instance launched by runIntegration.ts. With exactly two
// tabs open the second one is picked automatically, so no quick pick interaction
// is needed. Single-tab operations ignore tab B.
export async function run(): Promise<void> {
  await check('setOperations.intersection', 'b\nc');
  await check('setOperations.union', 'a\nb\nc\nd');
  await check('setOperations.difference', 'a');
  await check('setOperations.difference', 'd', { fromTabB: true });
  await check('setOperations.symmetricDifference', 'a\nd');
  await check('setOperations.unique', 'a\nb\nc');
  await check('setOperations.duplicates', 'b');
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

async function closeAllEditors() {
  for (let i = 0; i < 10 && vscode.window.tabGroups.all.some((g) => g.tabs.length > 0); i++) {
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
  }
}
