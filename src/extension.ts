import * as vscode from 'vscode';
import { BrowserPanel } from './browserPanel';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('chrome-in-code.openBrowser', () => {
      BrowserPanel.create(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('chrome-in-code.openBrowserAt', async () => {
      const url = await vscode.window.showInputBox({
        prompt: 'Enter URL to open',
        value: 'https://',
        placeHolder: 'https://example.com',
      });
      if (!url) {
        return;
      }
      BrowserPanel.create(context.extensionUri, url);
    })
  );
}

export function deactivate(): void {}
