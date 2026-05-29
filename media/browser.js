/* global acquireVsCodeApi */
(function () {
  'use strict';

  const vscode = acquireVsCodeApi();

  const iframe     = /** @type {HTMLIFrameElement} */ (document.getElementById('browser'));
  const urlbar     = /** @type {HTMLInputElement}  */ (document.getElementById('urlbar'));
  const btnBack    = document.getElementById('btn-back');
  const btnForward = document.getElementById('btn-forward');
  const btnReload  = document.getElementById('btn-reload');
  const btnGo      = document.getElementById('btn-go');
  const loadingBar = document.getElementById('loading-bar');

  // ── History stack (we maintain our own since iframe cross-origin blocks access) ──
  const history = [iframe.src];
  let idx = 0;

  function updateButtons() {
    btnBack.disabled    = idx <= 0;
    btnForward.disabled = idx >= history.length - 1;
  }

  // ── Loading bar animation ─────────────────────────────────────────────────
  let loadTimer = null;
  function startLoading() {
    loadingBar.style.transition = 'none';
    loadingBar.style.width = '0';
    loadingBar.style.opacity = '1';
    requestAnimationFrame(() => {
      loadingBar.style.transition = 'width 8s cubic-bezier(0.1, 0.4, 0.6, 1)';
      loadingBar.style.width = '85%';
    });
  }
  function finishLoading() {
    loadingBar.style.transition = 'width 0.15s ease';
    loadingBar.style.width = '100%';
    if (loadTimer) clearTimeout(loadTimer);
    loadTimer = setTimeout(() => {
      loadingBar.style.transition = 'opacity 0.4s ease';
      loadingBar.style.opacity = '0';
    }, 250);
  }

  // ── Smart URL normalisation ───────────────────────────────────────────────
  function normalise(raw) {
    const s = raw.trim();
    if (!s) return null;
    if (/^(https?:\/\/|about:|file:|data:)/i.test(s)) return s;
    if (/^localhost(:\d+)?(\/|$)/.test(s)) return 'http://' + s;
    if (/\.[a-z]{2,}(\/|$)/i.test(s) && !s.includes(' ')) return 'https://' + s;
    return 'https://www.google.com/search?q=' + encodeURIComponent(s);
  }

  // ── Core navigate function ────────────────────────────────────────────────
  function navigateTo(url, pushHistory = true) {
    if (!url) return;
    urlbar.value = url;
    startLoading();
    if (pushHistory) {
      history.splice(idx + 1);
      history.push(url);
      idx = history.length - 1;
    }
    iframe.src = url;
    updateButtons();
  }

  // ── Toolbar buttons ───────────────────────────────────────────────────────
  btnBack.addEventListener('click', () => {
    if (idx > 0) {
      idx--;
      navigateTo(history[idx], false);
    }
  });

  btnForward.addEventListener('click', () => {
    if (idx < history.length - 1) {
      idx++;
      navigateTo(history[idx], false);
    }
  });

  btnReload.addEventListener('click', () => {
    startLoading();
    // eslint-disable-next-line no-self-assign
    iframe.src = iframe.src;
  });

  btnGo.addEventListener('click', () => {
    const url = normalise(urlbar.value);
    if (url) navigateTo(url);
  });

  urlbar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const url = normalise(urlbar.value);
      if (url) navigateTo(url);
    }
  });

  // ── Iframe load / title tracking ──────────────────────────────────────────
  iframe.addEventListener('load', () => {
    finishLoading();

    // For same-origin loads we can read URL + title
    try {
      const loc = iframe.contentWindow.location.href;
      if (loc && loc !== 'about:blank') {
        urlbar.value = loc;
        if (loc !== history[idx]) {
          history.splice(idx + 1);
          history.push(loc);
          idx = history.length - 1;
          updateButtons();
        }
      }
    } catch (_) { /* cross-origin – URL bar already correct from navigateTo */ }

    try {
      const title = iframe.contentDocument && iframe.contentDocument.title;
      if (title) {
        vscode.postMessage({ type: 'titleChanged', title });
      }
    } catch (_) {}
  });

  updateButtons();
})();
