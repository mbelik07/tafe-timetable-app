// timetable-download-mode.js
// Adds Draft/Final mode UI with watermark for Draft PDFs
// Persists mode per-semester and ensures watermark appears in PDF exports

(function () {
  const STORAGE_KEY = 'timetable_download_mode_v1';
  const MODE_TOGGLE_ID = 'timetableModeToggle';
  const MODE_LABEL_ID = 'timetableModeLabel';
  const WATERMARK_ID = 'timetableDraftWatermark';
  const MODE_BUTTON_CLASS = 'timetable-download-mode-btn';
  const POLL_INTERVAL_MS = 800;

  // CSS with very high z-index to stay on top
  const css = `
/* Mode toggle styles - VERY HIGH Z-INDEX */
#${MODE_TOGGLE_ID} {
  display:inline-flex;
  align-items:center;
  gap:10px;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  font-size: 13px;
  margin-left: 8px;
  margin-right: 8px;
  position: relative;
  z-index: 999999 !important;
}
#${MODE_TOGGLE_ID} .mode-checkbox {
  width: 42px;
  height: 24px;
  background: #e2e8f0;
  border-radius: 999px;
  position: relative;
  cursor: pointer;
  display: inline-block;
  vertical-align: middle;
  border: none;
  padding: 0;
  z-index: 999999 !important;
}
#${MODE_TOGGLE_ID} .mode-checkbox .knob {
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  transition: transform 0.18s ease, left 0.18s ease;
}
#${MODE_TOGGLE_ID}[data-mode="draft"] .mode-checkbox {
  background: #f6ad55;
}
#${MODE_TOGGLE_ID}[data-mode="draft"] .mode-checkbox .knob {
  transform: translateX(18px);
}
#${MODE_TOGGLE_ID}[data-mode="final"] .mode-checkbox {
  background: #68d391;
}
#${MODE_TOGGLE_ID} .mode-text {
  min-width: 140px;
  font-weight: 600;
  color: #1a202c;
  z-index: 999999 !important;
}

/* Download button custom class */
.${MODE_BUTTON_CLASS}.draft {
  background: #f6ad55 !important;
  color: #fff !important;
  border-color: transparent !important;
}
.${MODE_BUTTON_CLASS}.final {
  background: #48bb78 !important;
  color: #fff !important;
  border-color: transparent !important;
}

/* Watermark - visible on screen and in print/PDF */
#${WATERMARK_ID} {
  pointer-events: none;
  user-select: none;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%) rotate(-45deg);
  font-size: 120px;
  font-weight: 900;
  color: rgba(180,180,180,0.14);
  z-index: 99998;
  white-space: nowrap;
  display: none;
  font-family: Arial, sans-serif;
  letter-spacing: 2px;
}
body.timetable-mode-draft #${WATERMARK_ID} {
  display: block !important;
}

@media print {
  #${WATERMARK_ID} {
    display: block !important;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%) rotate(-45deg);
    color: rgba(160,160,160,0.16);
    font-size: 140px;
    z-index: 99998 !important;
    page-break-inside: avoid;
  }
}
`;

  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-name', 'timetable-download-mode-styles');
  styleEl.appendChild(document.createTextNode(css));
  document.head.appendChild(styleEl);

  function safeJSONParse(s, fallback) {
    try { return JSON.parse(s); } catch (e) { return fallback; }
  }

  function readStates() {
    return safeJSONParse(localStorage.getItem(STORAGE_KEY) || '{}', {});
  }
  function writeStates(states) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(states)); } catch (e) {}
  }

  function getCurrentSemester() {
    try {
      if (window.db && window.db.currentSemester) return String(window.db.currentSemester);
      const el = document.querySelector('[data-semester]');
      const ds = el && el.dataset && el.dataset.semester;
      if (ds) return String(ds);
      const params = new URLSearchParams(window.location.search);
      if (params.has('semester')) return params.get('semester');
    } catch (e) {}
    return 'default';
  }

  function ensureWatermark() {
    let wm = document.getElementById(WATERMARK_ID);
    if (!wm) {
      wm = document.createElement('div');
      wm.id = WATERMARK_ID;
      wm.setAttribute('aria-hidden', 'true');
      wm.textContent = 'DRAFT';
      document.body.appendChild(wm);
    }
    return wm;
  }

  function loadModeForSemester() {
    const sem = getCurrentSemester();
    const states = readStates();
    return states[sem] === 'draft' ? 'draft' : 'final';
  }
  function saveModeForSemester(mode) {
    const sem = getCurrentSemester();
    const states = readStates();
    states[sem] = mode;
    writeStates(states);
  }

  const HEADER_SELECTORS = [
    '.header-controls .flex.items-center.gap-3',
    '.header-controls',
    'header',
    '.app-header',
    '.topbar',
    '.navbar',
    '.controls',
    '.toolbar',
    '[role="banner"]'
  ];

  function findHeaderContainer() {
    for (const sel of HEADER_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return document.body;
  }

  function createToggleElement() {
    const container = document.createElement('div');
    container.id = MODE_TOGGLE_ID;
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Timetable download mode');

    const checkboxWrap = document.createElement('button');
    checkboxWrap.className = 'mode-checkbox';
    checkboxWrap.type = 'button';
    checkboxWrap.setAttribute('aria-pressed', 'false');
    checkboxWrap.setAttribute('title', 'Toggle Draft / Final mode');

    const knob = document.createElement('span');
    knob.className = 'knob';
    checkboxWrap.appendChild(knob);

    const text = document.createElement('div');
    text.className = 'mode-text';
    text.id = MODE_LABEL_ID;
    text.textContent = '';

    checkboxWrap.addEventListener('click', () => {
      const cur = container.getAttribute('data-mode') === 'draft' ? 'draft' : 'final';
      const next = cur === 'draft' ? 'final' : 'draft';
      setMode(next, { persist: true });
    });

    container.appendChild(checkboxWrap);
    container.appendChild(text);

    return container;
  }

  function findDownloadButtons() {
    const candidates = new Set();

    const selectors = [
      'button[id*="download"]',
      'button[id*="pdf"]',
      'a[id*="download"]',
      'a[id*="pdf"]',
      'button[data-action*="download"]',
      'button[data-action*="pdf"]',
      'a[data-action*="download"]',
      'a[data-action*="pdf"]',
      'button[data-testid*="download"]',
      'a[data-testid*="download"]'
    ];
    selectors.forEach(s => document.querySelectorAll(s).forEach(el => candidates.add(el)));

    const textRegex = /\b(download|export|save).*pdf|\bpdf.*(download|export|save)/i;
    document.querySelectorAll('button, a, input[type="button"], input[type="submit"]').forEach(el => {
      const txt = (el.textContent || el.value || '').trim();
      if (textRegex.test(txt)) candidates.add(el);
    });

    document.querySelectorAll('[aria-label]').forEach(el => {
      const al = el.getAttribute('aria-label') || '';
      if (/\bdownload.*pdf|\bpdf.*download/i.test(al)) candidates.add(el);
    });

    return Array.from(candidates);
  }

  function updateDownloadButtons(mode) {
    const buttons = findDownloadButtons();
    const label = mode === 'draft' ? '📄 Download PDF (Draft)' : '📄 Download PDF (Final)';
    buttons.forEach(el => {
      el.classList.add(MODE_BUTTON_CLASS);
      el.classList.remove(mode === 'draft' ? 'final' : 'draft');
      el.classList.add(mode === 'draft' ? 'draft' : 'final');

      try {
        if (el.tagName && el.tagName.toLowerCase() === 'a' && el.hasAttribute('download')) {
          const cur = el.getAttribute('download') || '';
          el.setAttribute('download', adjustedFilename(cur || undefined, mode));
        }
      } catch (e) {}

      const txt = (el.textContent || el.value || '').trim();
      if (txt && /pdf/i.test(txt)) {
        const onlyText = el.children.length === 0;
        if (onlyText) {
          if (el.tagName.toLowerCase() === 'input') el.value = label;
          else el.textContent = label;
        } else {
          let sub = el.querySelector('.timetable-mode-inline-label');
          if (!sub) {
            sub = document.createElement('span');
            sub.className = 'timetable-mode-inline-label';
            sub.style.marginLeft = '8px';
            sub.style.fontWeight = '700';
            sub.style.fontSize = '13px';
            el.appendChild(sub);
          }
          sub.textContent = mode === 'draft' ? '(Draft)' : '(Final)';
        }
      }
      try {
        el.setAttribute('title', `${el.getAttribute('title') || ''} [Mode: ${mode}]`.trim());
      } catch (e) {}
    });

    tryPlaceToggleNearDownloadButton();
  }

  function adjustedFilename(originalFilename, mode) {
    const sem = getCurrentSemester() || 'semester';
    const addition = mode === 'draft' ? '_DRAFT_' : '_FINAL_';
    let name = originalFilename || `timetable_${sem}.pdf`;
    const hasPdf = /\.pdf$/i.test(name);
    if (!hasPdf) {
      name = name + '.pdf';
    }
    name = name.replace(/(_DRAFT_|_FINAL_)/i, '');
    name = name.replace(/\.pdf$/i, `${addition}.pdf`);
    return name;
  }

  function tryPlaceToggleNearDownloadButton() {
    const toggle = document.getElementById(MODE_TOGGLE_ID);
    const buttons = findDownloadButtons();
    if (!toggle) return;
    if (buttons.length > 0) {
      const btn = buttons[0];
      try {
        if (btn.parentNode) {
          btn.parentNode.insertBefore(toggle, btn.nextSibling);
          return;
        }
      } catch (e) {}
    }
    const header = findHeaderContainer();
    if (header && !header.contains(toggle)) {
      header.appendChild(toggle);
    }
  }

  function setMode(mode, opts = { persist: true }) {
    mode = mode === 'draft' ? 'draft' : 'final';
    const container = document.getElementById(MODE_TOGGLE_ID);
    if (container) container.setAttribute('data-mode', mode);
    const labelEl = document.getElementById(MODE_LABEL_ID);
    if (labelEl) labelEl.textContent = mode === 'draft' ? 'Draft (watermark shown)' : 'Final (no watermark)';
    if (mode === 'draft') {
      document.body.classList.add('timetable-mode-draft');
    } else {
      document.body.classList.remove('timetable-mode-draft');
    }
    ensureWatermark();
    updateDownloadButtons(mode);
    if (opts.persist) saveModeForSemester(mode);
    window._timetableDownloadMode = mode;
  }

  function insertToggle() {
    if (document.getElementById(MODE_TOGGLE_ID)) return true;
    const toggle = createToggleElement();
    const header = findHeaderContainer();
    if (!header) return false;
    header.appendChild(toggle);
    const saved = loadModeForSemester();
    setMode(saved, { persist: false });
    return true;
  }

  let observer = null;
  function startHeaderObserver() {
    if (observer) return;
    const target = document.documentElement || document.body;
    observer = new MutationObserver(() => {
      if (!document.getElementById(MODE_TOGGLE_ID)) {
        insertToggle();
      }
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  let lastSemester = getCurrentSemester();
  function startSemesterPoll() {
    setInterval(() => {
      const cur = getCurrentSemester();
      if (cur !== lastSemester) {
        lastSemester = cur;
        const saved = loadModeForSemester();
        setMode(saved, { persist: false });
      }
    }, POLL_INTERVAL_MS);
  }

  function interceptDownloads() {
    document.addEventListener('click', function (ev) {
      try {
        const mode = window._timetableDownloadMode || loadModeForSemester();
        const path = ev.composedPath ? ev.composedPath() : (ev.path || []);
        if ((!path || path.length === 0) && ev.target) path.push(ev.target);

        for (const node of path) {
          if (!node || !node.getAttribute) continue;
          if (node.tagName && node.tagName.toLowerCase() === 'a' && node.hasAttribute('download')) {
            const cur = node.getAttribute('download') || undefined;
            node.setAttribute('download', adjustedFilename(cur, mode));
          }
        }
      } catch (e) {}
    }, true);

    try {
      if (typeof window.saveAs === 'function') {
        const origSaveAs = window.saveAs;
        window.saveAs = function (blob, filename, disableAutoBOM) {
          try {
            const mode = window._timetableDownloadMode || loadModeForSemester();
            filename = adjustedFilename(filename, mode);
          } catch (e) {}
          return origSaveAs.call(this, blob, filename, disableAutoBOM);
        };
      }
    } catch (e) {}

    try {
      if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.prototype && !window.jspdf.jsPDF.prototype._timetableWrappedSave) {
        const proto = window.jspdf.jsPDF.prototype;
        const orig = proto.save;
        proto.save = function (filename, options) {
          try {
            const mode = window._timetableDownloadMode || loadModeForSemester();
            filename = adjustedFilename(filename, mode);
          } catch (e) {}
          return orig.call(this, filename, options);
        };
        proto._timetableWrappedSave = true;
      } else if (typeof window.jsPDF === 'function' && window.jsPDF.prototype && !window.jsPDF.prototype._timetableWrappedSave) {
        const proto = window.jsPDF.prototype;
        const orig = proto.save;
        proto.save = function (filename, options) {
          try {
            const mode = window._timetableDownloadMode || loadModeForSemester();
            filename = adjustedFilename(filename, mode);
          } catch (e) {}
          return orig.call(this, filename, options);
        };
        proto._timetableWrappedSave = true;
      }
    } catch (e) {}

    window._getTimetableDownloadFilename = function (preferredName) {
      return adjustedFilename(preferredName, window._timetableDownloadMode || loadModeForSemester());
    };
  }

  function init() {
    ensureWatermark();
    insertToggle();
    startHeaderObserver();
    startSemesterPoll();
    interceptDownloads();
    const m = loadModeForSemester();
    setMode(m, { persist: false });
    tryPlaceToggleNearDownloadButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window._timetableDownloadModeAPI = {
    setMode: (m, persist = true) => setMode(m === 'draft' ? 'draft' : 'final', { persist }),
    getMode: () => window._timetableDownloadMode || loadModeForSemester(),
    adjustedFilename,
    getCurrentSemester
  };
})();