// timetable-download-mode.js
// Adds single Download PDF button with dropdown for Draft/Final options

(function () {
  const STORAGE_KEY = 'timetable_download_mode_v1';
  const DOWNLOAD_BTN_ID = 'downloadPdfMainBtn';
  const DOWNLOAD_MENU_ID = 'downloadPdfMenu';
  const BUTTONS_CONTAINER_ID = 'downloadModeButtonsContainer';
  const WATERMARK_ID = 'timetableDraftWatermark';

  // CSS
  const css = `
/* Container for download button */
#${BUTTONS_CONTAINER_ID} {
  display: inline-block !important;
  margin-left: 8px !important;
  position: relative !important;
}

/* Main Download PDF Button */
#${DOWNLOAD_BTN_ID} {
  background: #4299e1 !important;
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

#${DOWNLOAD_BTN_ID}:hover {
  background: #3182ce !important;
}

#${DOWNLOAD_BTN_ID}:active {
  background: #2c5aa0 !important;
}

/* Dropdown menu */
#${DOWNLOAD_MENU_ID} {
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  background: #fff !important;
  border: 1px solid #cbd5e0 !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  min-width: 220px !important;
  z-index: 1001 !important;
  display: none !important;
  margin-top: 4px !important;
  overflow: hidden !important;
}

#${DOWNLOAD_MENU_ID}.open {
  display: block !important;
}

.download-menu-item {
  padding: 12px 14px !important;
  cursor: pointer !important;
  border: none !important;
  background: none !important;
  width: 100% !important;
  text-align: left !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial !important;
  transition: background 0.15s ease !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.download-menu-item:hover {
  background: #f7fafc !important;
}

.download-menu-item.draft {
  color: #c05621 !important;
  border-left: 4px solid #f6ad55 !important;
}

.download-menu-item.draft:hover {
  background: #fffaf0 !important;
}

.download-menu-item.final {
  color: #22543d !important;
  border-left: 4px solid #48bb78 !important;
}

.download-menu-item.final:hover {
  background: #f0fff4 !important;
}

.menu-item-icon {
  font-size: 16px !important;
}

.menu-item-text {
  flex: 1 !important;
}

.menu-item-label {
  font-size: 11px !important;
  opacity: 0.7 !important;
  margin-top: 2px !important;
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

    // Close menu
    closeMenu();
  }

  function closeMenu() {
    const menu = document.getElementById(DOWNLOAD_MENU_ID);
    if (menu) menu.classList.remove('open');
  }

  function toggleMenu() {
    const menu = document.getElementById(DOWNLOAD_MENU_ID);
    if (menu) {
      menu.classList.toggle('open');
    }
  }

  function createDownloadButton() {
    const container = document.createElement('div');
    container.id = BUTTONS_CONTAINER_ID;

    const btn = document.createElement('button');
    btn.id = DOWNLOAD_BTN_ID;
    btn.type = 'button';
    btn.innerHTML = '📄 Download PDF <span style="font-size: 10px;">▼</span>';
    btn.setAttribute('title', 'Download PDF as Draft or Final');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    const menu = document.createElement('div');
    menu.id = DOWNLOAD_MENU_ID;
    menu.className = 'download-menu';

    // Draft option
    const draftOption = document.createElement('button');
    draftOption.className = 'download-menu-item draft';
    draftOption.innerHTML = `
      <span class="menu-item-icon">📋</span>
      <div class="menu-item-text">
        <div>Download as Draft</div>
        <div class="menu-item-label">with watermark</div>
      </div>
    `;
    draftOption.addEventListener('click', () => downloadPdf('draft'));

    // Final option
    const finalOption = document.createElement('button');
    finalOption.className = 'download-menu-item final';
    finalOption.innerHTML = `
      <span class="menu-item-icon">✓</span>
      <div class="menu-item-text">
        <div>Download as Final</div>
        <div class="menu-item-label">no watermark</div>
      </div>
    `;
    finalOption.addEventListener('click', () => downloadPdf('final'));

    menu.appendChild(draftOption);
    menu.appendChild(finalOption);

    container.appendChild(btn);
    container.appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        closeMenu();
      }
    });

    return container;
  }

  function insertButton() {
    if (document.getElementById(BUTTONS_CONTAINER_ID)) return true;

    const originalBtn = findOriginalDownloadButton();
    if (!originalBtn) return false;

    const buttonContainer = createDownloadButton();

    try {
      if (originalBtn.parentNode) {
        originalBtn.parentNode.insertBefore(buttonContainer, originalBtn.nextSibling);
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
        insertButton();
      }
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  function init() {
    ensureWatermark();
    insertButton();
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