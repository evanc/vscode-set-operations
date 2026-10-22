import * as path from 'path';
import * as vscode from 'vscode';
import { Worker } from 'worker_threads';
import type { Job, JobResult, OperationId } from './worker';

/**
 * VS Code doesn't share documents longer than this many characters with extensions:
 * they can't read them through the editor, or create untitled editors that large.
 */
const SYNC_LIMIT = 50 * 1024 * 1024;

/**
 * Past VS Code's own large-file threshold, results open as plain text rather than in
 * tab A's language, so language tooling isn't run over them.
 */
const LARGE_RESULT_CHARS = 20 * 1024 * 1024;
const LARGE_RESULT_LINES = 300_000;

const SAVE_AS = 'Save As…';

/** Files read from disk past this size are refused, to protect the shared extension host's memory. */
const MAX_DISK_READ = 256 * 1024 * 1024;

interface Operation {
  /** Also the command ID's suffix: `setOps.<id>`. */
  id: OperationId;
  name: string;
  /**
   * Quick pick prompt for choosing tab B, given tab A's name. Operations without
   * one work on a single tab.
   */
  prompt?: (nameA: string) => string;
}

const operations: Operation[] = [
  {
    id: 'intersection',
    name: 'Intersection',
    prompt: (nameA) => `Lines in both "${nameA}" and…`,
  },
  {
    id: 'union',
    name: 'Union',
    prompt: (nameA) => `Lines in either "${nameA}" or…`,
  },
  {
    id: 'difference',
    name: 'Difference',
    prompt: (nameA) => `Lines in "${nameA}" that are not in…`,
  },
  {
    id: 'symmetricDifference',
    name: 'Symmetric Difference',
    prompt: (nameA) => `Lines in exactly one of "${nameA}" and…`,
  },
  { id: 'unique', name: 'Unique' },
  { id: 'duplicates', name: 'Duplicates' },
];

/** A tab's text and the details needed to present a result derived from it. */
interface Source {
  text: string;
  eol: string;
  /** Unknown when the file had to be read from disk. */
  languageId?: string;
}

export function activate(context: vscode.ExtensionContext) {
  for (const op of operations) {
    context.subscriptions.push(
      // When run from a tab's context menu, the first argument is that tab's URI.
      vscode.commands.registerCommand(`setOps.${op.id}`, (arg?: unknown) => runOperation(op, arg))
    );
  }
}

export function deactivate() {}

async function runOperation(op: Operation, arg: unknown) {
  try {
    const uriA = arg instanceof vscode.Uri ? arg : activeTabUri();
    if (!uriA) {
      vscode.window.showErrorMessage('Set Ops: open a text editor first.');
      return;
    }

    let uriB: vscode.Uri | undefined;
    if (op.prompt) {
      uriB = await pickOtherTab(op, uriA);
      if (!uriB) {
        return;
      }
    }

    const { content, lineCount, source } = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Window, title: `Set Ops: ${op.name}` },
      async () => {
        const [a, b] = await Promise.all([read(uriA), uriB && read(uriB)]);
        const result = await runInWorker({ operation: op.id, a: a.text, b: b?.text, eol: a.eol });
        return { ...result, source: a };
      }
    );

    if (content.length > SYNC_LIMIT) {
      await saveLargeResult(op, uriA, content);
    } else {
      const large = content.length > LARGE_RESULT_CHARS || lineCount > LARGE_RESULT_LINES;
      const output = await vscode.workspace.openTextDocument({
        content,
        language: large ? 'plaintext' : source.languageId,
      });
      await vscode.window.showTextDocument(output);
    }
    vscode.window.setStatusBarMessage(
      `${op.name}: ${lineCount} line${lineCount === 1 ? '' : 's'}`,
      5000
    );
  } catch (err) {
    vscode.window.showErrorMessage(`Set Ops: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function runInWorker(job: Job): Promise<JobResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'worker.js'));
    worker.once('message', (result: JobResult) => {
      resolve(result);
      void worker.terminate();
    });
    worker.once('error', (err: Error & { code?: string }) => {
      reject(
        err.code === 'ERR_WORKER_OUT_OF_MEMORY'
          ? new Error('ran out of memory. The files are too large to compare.')
          : err
      );
    });
    // Only reached first if the worker stopped without answering or reporting an error.
    worker.once('exit', (code) => reject(new Error(`the worker stopped unexpectedly (code ${code}).`)));
    worker.postMessage(job);
  });
}

/**
 * The active tab's document. Unlike activeTextEditor, this also finds files too large
 * for VS Code to share with extensions.
 */
function activeTabUri(): vscode.Uri | undefined {
  const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
  return input instanceof vscode.TabInputText ? input.uri : vscode.window.activeTextEditor?.document.uri;
}

async function read(uri: vscode.Uri): Promise<Source> {
  let doc: vscode.TextDocument;
  try {
    // Returns the already-open document, so unsaved edits are included.
    doc = await vscode.workspace.openTextDocument(uri);
  } catch (err) {
    const size = await fileSize(uri);
    if (size === undefined || size <= SYNC_LIMIT) {
      throw err;
    }
    return readFromDisk(uri, size);
  }
  return {
    text: doc.getText(),
    eol: doc.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n',
    languageId: doc.languageId,
  };
}

async function fileSize(uri: vscode.Uri): Promise<number | undefined> {
  try {
    return (await vscode.workspace.fs.stat(uri)).size;
  } catch {
    return undefined;
  }
}

/** Reads a file too large for VS Code to share. Assumes UTF-8. */
async function readFromDisk(uri: vscode.Uri, size: number): Promise<Source> {
  if (isDirty(uri)) {
    throw new Error(
      `"${baseName(uri)}" is over 50MB and has unsaved changes, which VS Code doesn't share with extensions. Save it and try again.`
    );
  }
  if (size > MAX_DISK_READ) {
    throw new Error(`"${baseName(uri)}" is over the 256MB limit.`);
  }
  const bytes = await vscode.workspace.fs.readFile(uri);
  // Like VS Code, treat files with null bytes near the start as binary.
  if (bytes.subarray(0, 512).includes(0)) {
    throw new Error(`"${baseName(uri)}" seems to be binary.`);
  }
  const text = new TextDecoder().decode(bytes);
  const firstNewline = text.indexOf('\n');
  return { text, eol: firstNewline > 0 && text[firstNewline - 1] === '\r' ? '\r\n' : '\n' };
}

function isDirty(uri: vscode.Uri): boolean {
  return vscode.window.tabGroups.all.some((group) =>
    group.tabs.some(
      (tab) =>
        tab.isDirty &&
        tab.input instanceof vscode.TabInputText &&
        tab.input.uri.toString() === uri.toString()
    )
  );
}

/** Results too large for an untitled editor are saved to a file instead, which VS Code can open. */
async function saveLargeResult(op: Operation, uriA: vscode.Uri, content: string) {
  const size = Math.round(content.length / 1024 / 1024);
  const choice = await vscode.window.showWarningMessage(
    `The ${op.name.toLowerCase()} result is ${size}MB, too large for an unsaved editor. Save it to a file instead?`,
    { modal: true },
    SAVE_AS
  );
  if (choice !== SAVE_AS) {
    return;
  }
  const fileName = `${op.name.toLowerCase().replace(/ /g, '-')}.txt`;
  const target = await vscode.window.showSaveDialog({
    defaultUri: uriA.scheme === 'file' ? vscode.Uri.joinPath(uriA, '..', fileName) : undefined,
    saveLabel: 'Save Result',
  });
  if (!target) {
    return;
  }
  await vscode.workspace.fs.writeFile(target, new TextEncoder().encode(content));
  await vscode.commands.executeCommand('vscode.open', target);
}

function baseName(uri: vscode.Uri): string {
  return uri.path.split('/').pop() || uri.toString();
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
    vscode.window.showErrorMessage('Set Ops: open another editor tab to compare against.');
    return undefined;
  }
  if (items.length === 1) {
    return items[0].uri;
  }

  // Editors that are currently on screen (e.g. the other side of a split) are the likeliest picks.
  items.sort((x, y) => Number(visible.has(y.uri.toString())) - Number(visible.has(x.uri.toString())));

  const picked = await vscode.window.showQuickPick(items, {
    title: `Set Ops: ${op.name}`,
    placeHolder: op.prompt?.(baseName(uriA)),
    matchOnDescription: true,
  });
  return picked?.uri;
}
