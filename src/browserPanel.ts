import * as vscode from 'vscode';

export class BrowserPanel {
  static create(extensionUri: vscode.Uri, url?: string): void {
    const config = vscode.workspace.getConfiguration('chrome-in-code');
    const startUrl: string = url ?? (config.get('startUrl') as string) ?? 'https://www.google.com';

    const panel = vscode.window.createWebviewPanel(
      'chromeBrowser',
      'Browser',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    panel.webview.html = buildHtml(panel.webview, extensionUri, startUrl);

    panel.webview.onDidReceiveMessage((msg: { type: string; title?: string; url?: string }) => {
      if (msg.type === 'titleChanged' && msg.title) {
        panel.title = msg.title;
      }
    });
  }
}

function buildHtml(webview: vscode.Webview, extensionUri: vscode.Uri, startUrl: string): string {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'browser.js'));
  const nonce = getNonce();
  const escapedUrl = startUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; frame-src *; img-src * data: blob:;">
  <title>Browser</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%; display: flex; flex-direction: column; overflow: hidden;
      background: #1e1e1e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #toolbar {
      display: flex; align-items: center; gap: 4px;
      padding: 5px 8px; background: #2d2d2d; border-bottom: 1px solid #444;
      flex-shrink: 0;
    }
    .btn {
      background: #3c3c3c; border: 1px solid #555; color: #ccc;
      border-radius: 4px; padding: 4px 9px; cursor: pointer;
      font-size: 14px; line-height: 1; user-select: none;
    }
    .btn:hover { background: #505050; }
    .btn:disabled { opacity: 0.35; cursor: default; pointer-events: none; }
    #urlbar {
      flex: 1; background: #1e1e1e; border: 1px solid #555; color: #eee;
      border-radius: 4px; padding: 4px 10px; font-size: 13px; outline: none;
    }
    #urlbar:focus { border-color: #007acc; }
    #loading-bar {
      height: 2px; background: #007acc;
      transition: width 0.2s ease, opacity 0.4s ease;
      width: 0; opacity: 0; flex-shrink: 0;
    }
    #browser {
      flex: 1; width: 100%; border: none; background: #fff;
      display: block;
    }
  </style>
</head>
<body>
  <div id="toolbar">
    <button class="btn" id="btn-back" title="Back" disabled>&#8592;</button>
    <button class="btn" id="btn-forward" title="Forward" disabled>&#8594;</button>
    <button class="btn" id="btn-reload" title="Reload">&#8635;</button>
    <input id="urlbar" type="text" value="${escapedUrl}" spellcheck="false" autocomplete="off" />
    <button class="btn" id="btn-go">Go</button>
  </div>
  <div id="loading-bar"></div>
  <iframe
    id="browser"
    src="${escapedUrl}"
    sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-downloads"
    allow="accelerometer; camera; clipboard-read; clipboard-write; display-capture; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; picture-in-picture; usb; web-share">
  </iframe>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
