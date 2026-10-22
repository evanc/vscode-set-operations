import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    await runTests({
      // Pinned so a new VS Code release can't change results unnoticed. Override
      // with VSCODE_VERSION, e.g. "stable" or the oldest supported "1.85.0".
      version: process.env.VSCODE_VERSION ?? '1.143.0',
      extensionDevelopmentPath: path.resolve(__dirname, '../..'),
      extensionTestsPath: path.resolve(__dirname, './integration'),
      launchArgs: ['--disable-extensions'],
    });
  } catch (err) {
    console.error('Integration tests failed:', err);
    process.exit(1);
  }
}

main();
