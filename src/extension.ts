import * as vscode from 'vscode';
import {
  difference,
  duplicates,
  intersection,
  symmetricDifference,
  toLines,
  union,
  unique,
} from './setOperations';

interface Operation {
  command: string;
  name: string;
  /** Receives tab A's lines, plus tab B's for two-tab operations. */
  run: (a: string[], b: string[]) => string[];
  /**
   * Quick pick prompt for choosing tab B, given tab A's name. Operations without
   * one work on a single tab.
   */
  prompt?: (nameA: string) => string;
}

const operations: Operation[] = [
  {
    command: 'setOperations.intersection',
    name: 'Intersection',
    run: intersection,
    prompt: (nameA) => `Lines in both "${nameA}" and…`,
  },
  {
    command: 'setOperations.union',
    name: 'Union',
    run: union,
    prompt: (nameA) => `Lines in either "${nameA}" or…`,
  },
  {
    command: 'setOperations.difference',
    name: 'Difference',
    run: difference,
    prompt: (nameA) => `Lines in "${nameA}" that are not in…`,
  },
  {
    command: 'setOperations.symmetricDifference',
    name: 'Symmetric Difference',
    run: symmetricDifference,
    prompt: (nameA) => `Lines in exactly one of "${nameA}" and…`,
  },
  {
    command: 'setOperations.unique',
    name: 'Unique',
    run: unique,
  },
  {
    command: 'setOperations.duplicates',
    name: 'Duplicates',
    run: duplicates,
  },
];

export function activate(context: vscode.ExtensionContext) {
  for (const op of operations) {
    context.subscriptions.push(
      // When run from a tab's context menu, the first argument is that tab's URI.
      vscode.commands.registerCommand(op.command, (arg?: unknown) => runOperation(op, arg))
    );
  }
}

export function deactivate() {}

async function runOperation(op: Operation, arg: unknown) {
  try {
    const uriA = arg instanceof vscode.Uri ? arg : vscode.window.activeTextEditor?.document.uri;
    if (!uriA) {
      vscode.window.showErrorMessage('Set Operations: open a text editor first.');
      return;
    }

    let uriB: vscode.Uri | undefined;
    if (op.prompt) {
      uriB = await pickOtherTab(op, uriA);
      if (!uriB) {
        return;
      }
    }

    // openTextDocument returns the already-open document, so unsaved edits are included.
    const docA = await vscode.workspace.openTextDocument(uriA);
    const docB = uriB && (await vscode.workspace.openTextDocument(uriB));
    const result = op.run(toLines(docA.getText()), docB ? toLines(docB.getText()) : []);
    const eol = docA.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

    const output = await vscode.workspace.openTextDocument({
      content: result.join(eol),
      language: docA.languageId,
    });
    await vscode.window.showTextDocument(output);
    vscode.window.setStatusBarMessage(
      `${op.name}: ${result.length} line${result.length === 1 ? '' : 's'}`,
      5000
    );
  } catch (err) {
    vscode.window.showErrorMessage(
      `Set Operations: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

async function pickOtherTab(op: Operation, uriA: vscode.Uri): Promise<vscode.Uri | undefined> {
  const seen = new Set([uriA.toString()]);
  const visible = new Set(vscode.window.visibleTextEditors.map((e) => e.document.uri.toString()));
  const items: (vscode.QuickPickItem & { uri: vscode.Uri })[] = [];

  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (!(tab.input instanceof vscode.TabInputText) || seen.has(tab.input.uri.toString())) {
        continue;
      }
      const uri = tab.input.uri;
      seen.add(uri.toString());
      items.push({
        label: tab.label,
        description: uri.scheme === 'file' ? vscode.workspace.asRelativePath(uri) : undefined,
        uri,
      });
    }
  }

  if (items.length === 0) {
    vscode.window.showErrorMessage('Set Operations: open another editor tab to compare against.');
    return undefined;
  }
  if (items.length === 1) {
    return items[0].uri;
  }

  // Editors that are currently on screen (e.g. the other side of a split) are the likeliest picks.
  items.sort((x, y) => Number(visible.has(y.uri.toString())) - Number(visible.has(x.uri.toString())));

  const nameA = uriA.path.split('/').pop() ?? uriA.toString();
  const picked = await vscode.window.showQuickPick(items, {
    title: `Set Operations: ${op.name}`,
    placeHolder: op.prompt?.(nameA),
    matchOnDescription: true,
  });
  return picked?.uri;
}
