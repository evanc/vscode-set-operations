import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    await runTests({
      extensionDevelopmentPath: path.resolve(__dirname, '../..'),
      extensionTestsPath: path.resolve(__dirname, './integration'),
      launchArgs: ['--disable-extensions'],
    });
  } catch {
    console.error('Integration tests failed');
    process.exit(1);
  }
}

main();
