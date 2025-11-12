// timetable-download-mode.js
// Adds Draft and Final download buttons with dropdown menus and watermark for Draft PDFs

(function () {
  const STORAGE_KEY = 'timetable_download_mode_v1';
  const DRAFT_BTN_ID = 'downloadPdfDraftBtn';
  const FINAL_BTN_ID = 'downloadPdfFinalBtn';
  const DRAFT_MENU_ID = 'downloadPdfDraftMenu';
  const FINAL_MENU_ID = 'downloadPdfFinalMenu';
  const BUTTONS_CONTAINER_ID = 'downloadModeButtonsContainer';
  const WATERMARK_ID = 'timetableDraftWatermark';

  // CSS
  const css = `
/* Container for both download buttons */
#${BUTTONS_CONTAINER_ID} {
  display: inline-flex !important;
  gap: 8px !important;
  align-items: center !important;
  margin-left: 8px !important;
  position: relative !important;
}

/* Button wrapper for positioning */
.download-btn-wrapper {
  position: relative !important;
  display: inline-block !important;
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
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
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
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
}

#${FINAL_BTN_ID}:hover {
  background: #38a169 !important;
}

#${FINAL_BTN_ID}:active {
  background: #2f855a !important;
}

/* Dropdown menus */
.download-menu {
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  background: #fff !important;
  border: 1px solid #cbd5e0 !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  min-width: 200px !important;
  z-index: 1001 !important;
  display: none !important;
  margin-top: 4px !important;
}

.download-menu.open {
  display: block !important;
}

.download-menu-item {
  padding: 10px 14px !important;
  cursor: pointer !important;
  border: none !important;
  background: none !important;
  width: 100% !important;
  text-align: left !important;
  font-size: 13px !important;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial !important;
  color: #1a202c !important;
  transition: background 0.15s ease !important;
}

.download-menu-item:hover {
  background: #f7fafc !important;
}

.download-menu-item:first-child {
  border-radius: 5px 5px 0 0 !important;
}

.download-menu-item:last-child {
  border-radius: 0 0 5px 5px !important;
}

.download-menu-item-divider {
  height: 1px !important;
  background: #e2e8f0 !important;
  margin: 4px 0 !important;
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

    // Close menus
    closeAllMenus();
  }

  function closeAllMenus() {
    const menus = document.querySelectorAll('.download-menu');
    menus.forEach(menu => menu.classList.remove('open'));
  }

  function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) {
      // Close other menus
      document.querySelectorAll('.download-menu').forEach(m => {
        if (m.id !== menuId) m.classList.remove('open');
      });
      menu.classList.toggle('open');
    }
  }

  function createDownloadButtons() {
    const container = document.createElement('div');
    container.id = BUTTONS_CONTAINER_ID;

    // Draft button wrapper
    const draftWrapper = document.createElement('div');
    draftWrapper.className = 'download-btn-wrapper';

    const draftBtn = document.createElement('button');
    draftBtn.id = DRAFT_BTN_ID;
    draftBtn.type = 'button';
    draftBtn.innerHTML = '📄 Download PDF (Draft) <span style="font-size: 10px;">▼</span>';
    draftBtn.setAttribute('title', 'Download as Draft with watermark');
    draftBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu(DRAFT_MENU_ID);
    });

    const draftMenu = document.createElement('div');
    draftMenu.id = DRAFT_MENU_ID;
    draftMenu.className = 'download-menu';

    const draftOption1 = document.createElement('button');
    draftOption1.className = 'download-menu-item';
    draftOption1.textContent = 'Download as Draft (with watermark)';
    draftOption1.addEventListener('click', () => downloadPdf('draft'));

    const draftOption2 = document.createElement('button');
    draftOption2.className = 'download-menu-item';
    draftOption2.textContent = 'Download as Final (no watermark)';
    draftOption2.addEventListener('click', () => downloadPdf('final'));

    draftMenu.appendChild(draftOption1);
    draftMenu.appendChild(draftOption2);

    draftWrapper.appendChild(draftBtn);
    draftWrapper.appendChild(draftMenu);

    // Final button wrapper
    const finalWrapper = document.createElement('div');
    finalWrapper.className = 'download-btn-wrapper';

    const finalBtn = document.createElement('button');
    finalBtn.id = FINAL_BTN_ID;
    finalBtn.type = 'button';
    finalBtn.innerHTML = '📄 Download PDF (Final) <span style="font-size: 10px;">▼</span>';
    finalBtn.setAttribute('title', 'Download as Final without watermark');
    finalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu(FINAL_MENU_ID);
    });

    const finalMenu = document.createElement('div');
    finalMenu.id = FINAL_MENU_ID;
    finalMenu.className = 'download-menu';

    const finalOption1 = document.createElement('button');
    finalOption1.className = 'download-menu-item';
    finalOption1.textContent = 'Download as Final (no watermark)';
    finalOption1.addEventListener('click', () => downloadPdf('final'));

    const finalOption2 = document.createElement('button');
    finalOption2.className = 'download-menu-item';
    finalOption2.textContent = 'Download as Draft (with watermark)';
    finalOption2.addEventListener('click', () => downloadPdf('draft'));

    finalMenu.appendChild(finalOption1);
    finalMenu.appendChild(finalOption2);

    finalWrapper.appendChild(finalBtn);
    finalWrapper.appendChild(finalMenu);

    container.appendChild(draftWrapper);
    container.appendChild(finalWrapper);

    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        closeAllMenus();
      }
    });

    return container;
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