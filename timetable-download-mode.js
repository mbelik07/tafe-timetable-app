// timetable-download-mode.js
// Adds single Download PDF button with dropdown for Draft/Final options

(function () {
  const DOWNLOAD_BTN_ID = 'downloadPdfMainBtn';
  const DOWNLOAD_MENU_ID = 'downloadPdfMenu';
  const BUTTONS_CONTAINER_ID = 'downloadModeButtonsContainer';
  const WATERMARK_ID = 'timetableDraftWatermark';

  let currentDownloadMode = 'final';

  const css = `
#${BUTTONS_CONTAINER_ID} {
  display: inline-block !important;
  position: relative !important;
  margin: 0 5px !important;
}

#${DOWNLOAD_BTN_ID} {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: #fff !important;
  border: none !important;
  padding: 8px 16px !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
  z-index: 1000 !important;
}

#${DOWNLOAD_BTN_ID}:hover {
  background: linear-gradient(135deg, #5568d3 0%, #6a3a8f 100%) !important;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
  transform: translateY(-1px) !important;
}

#${DOWNLOAD_MENU_ID} {
  position: absolute !important;
  top: 100% !important;
  right: 0 !important;
  background: #fff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
  min-width: 240px !important;
  z-index: 10001 !important;
  display: none !important;
  margin-top: 8px !important;
  overflow: hidden !important;
}

#${DOWNLOAD_MENU_ID}.open {
  display: block !important;
}

.download-menu-item {
  padding: 14px 16px !important;
  cursor: pointer !important;
  border: none !important;
  background: none !important;
  width: 100% !important;
  text-align: left !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  transition: all 0.15s ease !important;
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  border-left: 4px solid transparent !important;
}

.download-menu-item:hover {
  background: #f8f9fa !important;
}

.download-menu-item.draft {
  color: #c05621 !important;
  border-left-color: #f6ad55 !important;
}

.download-menu-item.draft:hover {
  background: #fffaf0 !important;
}

.download-menu-item.final {
  color: #22543d !important;
  border-left-color: #48bb78 !important;
}

.download-menu-item.final:hover {
  background: #f0fff4 !important;
}

.menu-item-icon {
  font-size: 18px !important;
  min-width: 24px !important;
}

.menu-item-text {
  flex: 1 !important;
}

.menu-item-label {
  font-size: 12px !important;
  opacity: 0.65 !important;
  margin-top: 2px !important;
  font-weight: 400 !important;
}

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
}

body.timetable-mode-draft #${WATERMARK_ID} {
  display: block !important;
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
  }
}
`;

  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-name', 'timetable-download-mode-styles');
  styleEl.appendChild(document.createTextNode(css));
  document.head.appendChild(styleEl);

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

  function findOriginalDownloadButton() {
    // Look for button with "Download PDF" text
    const buttons = document.querySelectorAll('button');
    for (let btn of buttons) {
      if (btn.textContent.includes('Download') && btn.textContent.includes('PDF')) {
        if (btn.id !== DOWNLOAD_BTN_ID) {
          return btn;
        }
      }
    }
    
    // Look for any button with download-related attributes
    const downloadBtn = document.querySelector('[data-action*="download"], [onclick*="download"], [onclick*="pdf"]');
    if (downloadBtn && downloadBtn.id !== DOWNLOAD_BTN_ID) {
      return downloadBtn;
    }
    
    return null;
  }

  function downloadPdf(mode) {
    console.log('Download triggered:', mode);
    currentDownloadMode = mode;

    if (mode === 'draft') {
      document.body.classList.add('timetable-mode-draft');
    } else {
      document.body.classList.remove('timetable-mode-draft');
    }

    const originalBtn = findOriginalDownloadButton();
    if (originalBtn) {
      console.log('Clicking original button');
      originalBtn.click();
    } else {
      console.warn('Original download button not found');
    }

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
    btn.innerHTML = '📥 Download PDF <span style="font-size: 12px; margin-left: 4px;">▼</span>';
    btn.setAttribute('title', 'Download PDF as Draft or Final');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleMenu();
    });

    const menu = document.createElement('div');
    menu.id = DOWNLOAD_MENU_ID;

    const draftOption = document.createElement('button');
    draftOption.className = 'download-menu-item draft';
    draftOption.innerHTML = `
      <span class="menu-item-icon">📋</span>
      <div class="menu-item-text">
        <div>Download as Draft</div>
        <div class="menu-item-label">with watermark</div>
      </div>
    `;
    draftOption.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      downloadPdf('draft');
    });

    const finalOption = document.createElement('button');
    finalOption.className = 'download-menu-item final';
    finalOption.innerHTML = `
      <span class="menu-item-icon">✓</span>
      <div class="menu-item-text">
        <div>Download as Final</div>
        <div class="menu-item-label">no watermark</div>
      </div>
    `;
    finalOption.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      downloadPdf('final');
    });

    menu.appendChild(draftOption);
    menu.appendChild(finalOption);
    container.appendChild(btn);
    container.appendChild(menu);

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        closeMenu();
      }
    }, true);

    return container;
  }

  function insertButton() {
    if (document.getElementById(BUTTONS_CONTAINER_ID)) return true;

    const originalBtn = findOriginalDownloadButton();
    if (!originalBtn) {
      console.warn('Original download button not found yet');
      return false;
    }

    const buttonContainer = createDownloadButton();
    originalBtn.parentNode.insertBefore(buttonContainer, originalBtn.nextSibling);
    originalBtn.style.display = 'none';
    console.log('Download button inserted successfully');
    return true;
  }

  function init() {
    console.log('Initializing download mode');
    ensureWatermark();
    
    // Try to insert button immediately
    if (!insertButton()) {
      // If not found, wait for DOM to be ready
      setTimeout(() => {
        insertButton();
      }, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
