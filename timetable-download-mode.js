// timetable-download-mode.js
// Adds Draft and Final download buttons with watermark for Draft PDFs
// Two separate buttons instead of toggle for cleaner UX

(function () {
  const STORAGE_KEY = 'timetable_download_mode_v1';
  const DRAFT_BTN_ID = 'downloadPdfDraftBtn';
  const FINAL_BTN_ID = 'downloadPdfFinalBtn';
  const BUTTONS_CONTAINER_ID = 'downloadModeButtonsContainer';
  const WATERMARK_ID = 'timetableDraftWatermark';
  const POLL_INTERVAL_MS = 800;

  // CSS
  const css = `
/* Container for both download buttons */
#${BUTTONS_CONTAINER_ID} {
  display: inline-flex !important;
  gap: 8px !important;
  align-items: center !important;
  margin-left: 8px !important;
}

/* Draft Download Button */
#${DRAFT_BTN_ID} {
  background: #f6ad55 !important;
  color: #fff !important;
  border: none !important;
  padding: 8px 14px !important;
  border-radius: 6px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: background 0.2s ease !important;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial !important;
}

#${DRAFT_BTN_ID}:hover {
  background: #ed8936 !important;
}

#${DRAFT_BTN_ID}:active {
  background: #dd6b20 !important;
}

/* Final Download Button */
#${FINAL_BTN_ID} {
  background: #48bb78 !important;
  color: #fff !important;
  border: none !important;
  padding: 8px 14px !important;
  border-radius: 6px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: background 0.2s ease !important;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial !important;
}

#${FINAL_BTN_ID}:hover {
  background: #38a169 !important;
}

#${FINAL_BTN_ID}:active {
  background: #2f855a !important;
}

/* Watermark - visible on screen and in print/PDF */
#${WATERMARK_ID} {
  pointer-events: none !important;
  user-select: none !important;
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%,-50%) rotate(-45deg) !important;
  font-size: 120px !important;
  font-weight: 900 !important;
  color: rgba(180,180,180,0.14) !important;
  z-index: 99998 !important;
  white-space: nowrap !important;
  display: none !important;
  font-family: Arial, sans-serif !important;
  letter-spacing: 2px !important;
}

body.timetable-mode-draft #${WATERMARK_ID} {
  display: block !important;
}

/* Ensure dropdown menus appear ABOVE session boxes */
[role="menu"],
[role="listbox"],
.dropdown,
[class*="dropdown"],
[class*="menu"],
[class*="popover"],
[class*="popup"] {
  z-index: 1000 !important;
}

@media print {
  #${WATERMARK_ID} {
    display: block !important;
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%,-50%) rotate(-45deg) !important;
    color: rgba(160,160,160,0.16) !important;
    font-size: 140px !important;
    z-index: 99998 !important;
    page-break-inside: avoid !important;
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

  function findOriginalDownloadButton() {
    const candidates = [];

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
    selectors.forEach(s => document.querySelectorAll(s).forEach(el => candidates.push(el)));

    const textRegex = /\b(download|export|save).*pdf|\bpdf.*(download|export|save)/i;
    document.querySelectorAll('button, a, input[type="button"], input[type="submit"]').forEach(el => {
      const txt = (el.textContent || el.value || '').trim();
      if (textRegex.test(txt)) candidates.push(el);
    });

    document.querySelectorAll('[aria-label]').forEach(el => {
      const al = el.getAttribute('aria-label') || '';
      if (/\bdownload.*pdf|\bpdf.*download/i.test(al)) candidates.push(el);
    });

    return candidates.length > 0 ? candidates[0] : null;
  }

  function createDownloadButtons() {
    const container = document.createElement('div');
    container.id = BUTTONS_CONTAINER_ID;

    const draftBtn = document.createElement('button');
    draftBtn.id = DRAFT_BTN_ID;
    draftBtn.type = 'button';
    draftBtn.textContent = '📄 Download PDF (Draft)';
    draftBtn.setAttribute('title', 'Download as Draft with watermark');
    draftBtn.addEventListener('click', () => {
      downloadPdf('draft');
    });

    const finalBtn = document.createElement('button');
    finalBtn.id = FINAL_BTN_ID;
    finalBtn.type = 'button';
    finalBtn.textContent = '📄 Download PDF (Final)';
    finalBtn.setAttribute('title', 'Download as Final without watermark');
    finalBtn.addEventListener('click', () => {
      downloadPdf('final');
    });

    container.appendChild(draftBtn);
    container.appendChild(finalBtn);

    return container;
  }

  function downloadPdf(mode) {
    // Set watermark mode
    if (mode === 'draft') {
      document.body.classList.add('timetable-mode-draft');
    } else {
      document.body.classList.remove('timetable-mode-draft');
    }

    // Try to find and trigger original download button
    const originalBtn = findOriginalDownloadButton();
    if (originalBtn) {
      // Adjust filename if it's an anchor with download attribute
      try {
        if (originalBtn.tagName.toLowerCase() === 'a' && originalBtn.hasAttribute('download')) {
          const cur = originalBtn.getAttribute('download') || '';
          originalBtn.setAttribute('download', adjustedFilename(cur || undefined, mode));
        }
      } catch (e) {}

      // Trigger click
      originalBtn.click();

      // Small delay before removing watermark if final
      setTimeout(() => {
        if (mode === 'final') {
          document.body.classList.remove('timetable-mode-draft');
        }
      }, 500);
    }
  }

  function insertButtons() {
    if (document.getElementById(BUTTONS_CONTAINER_ID)) return true;

    const originalBtn = findOriginalDownloadButton();
    if (!originalBtn) return false;

    const buttonsContainer = createDownloadButtons();

    try {
      if (originalBtn.parentNode) {
        originalBtn.parentNode.insertBefore(buttonsContainer, originalBtn.nextSibling);
        // Hide original button
        originalBtn.style.display = 'none';
        return true;
      }
    } catch (e) {}

    return false;
  }

  let observer = null;
  function startHeaderObserver() {
    if (observer) return;
    const target = document.documentElement || document.body;
    observer = new MutationObserver(() => {
      if (!document.getElementById(BUTTONS_CONTAINER_ID)) {
        insertButtons();
      }
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  function init() {
    ensureWatermark();
    insertButtons();
    startHeaderObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window._timetableDownloadModeAPI = {
    downloadPdf,
    adjustedFilename,
    getCurrentSemester
  };
})();