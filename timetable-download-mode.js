// timetable-download-mode.js
// Adds single Download PDF button with dropdown for Draft/Final options
// Intercepts the actual download mechanism

(function () {
  const STORAGE_KEY = 'timetable_download_mode_v1';
  const DOWNLOAD_BTN_ID = 'downloadPdfMainBtn';
  const DOWNLOAD_MENU_ID = 'downloadPdfMenu';
  const BUTTONS_CONTAINER_ID = 'downloadModeButtonsContainer';
  const WATERMARK_ID = 'timetableDraftWatermark';

  // Store current mode globally
  let currentDownloadMode = 'final';

  // CSS - matches Semester/View button styling
  const css = `
/* Container for download button */
#${BUTTONS_CONTAINER_ID} {
  display: inline-block !important;
  position: relative !important;
}

/* Main Download PDF Button - matches Semester/View styling */
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
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
}

#${DOWNLOAD_BTN_ID}:hover {
  background: linear-gradient(135deg, #5568d3 0%, #6a3a8f 100%) !important;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
  transform: translateY(-1px) !important;
}

#${DOWNLOAD_BTN_ID}:active {
  transform: translateY(0) !important;
}

/* Dropdown menu - matches existing menu styling */
#${DOWNLOAD_MENU_ID} {
  position: absolute !important;
  top: 100% !important;
  right: 0 !important;
  background: #fff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
  min-width: 240px !important;
  z-index: 1001 !important;
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
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial !important;
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

  function getCurrentSemesterData() {
    try {
      if (window.db && window.db.semesters && window.db.currentSemester) {
        return window.db.semesters[window.db.currentSemester] || {};
      }
    } catch (e) {}
    return {};
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
    
    // Try to get course and teacher information
    const semesterData = getCurrentSemesterData();
    
    // Get current view and additional context
    const currentView = window.currentView || 'main-timetable';
    const viewLabels = {
      'main-timetable': 'Main Timetable',
      'staff-summary': 'Staff Summary',
      'dispute-log': 'Dispute Log',
      'course-print': 'Course Print',
      'teacher-print': 'Teacher Print',
      'tasks': 'Tasks'
    };

    // Determine course and teacher info based on current view
    let courseInfo = '';
    let teacherInfo = '';

    if (currentView === 'course-print') {
      const courseCode = document.querySelector('[data-course-code].active')?.dataset.courseCode;
      const course = semesterData.courses && semesterData.courses.find(c => c.Code === courseCode);
      courseInfo = course ? `${course.Code} - ${course.Name}` : '';
    }

    if (currentView === 'teacher-print') {
      const teacherInitials = document.querySelector('[data-teacher-initials].active')?.dataset.teacherInitials;
      const teacher = semesterData.teachers && semesterData.teachers.find(t => t.Initials === teacherInitials);
      teacherInfo = teacher ? `${teacher.Name} ${teacher.Surname}` : '';
    }

    // Construct filename
    let name = `${window.db && window.db.currentSemester ? window.db.currentSemester : sem} - ${semesterData.currentCollege || 'Timetable'}`;
    
    if (courseInfo) {
      name += ` - ${courseInfo}`;
    }
    
    if (teacherInfo) {
      name += ` - ${teacherInfo}`;
    }
    
    name += ` - ${viewLabels[currentView]}`;

    // Conditionally add "Draft" only when in draft mode
    if (mode === 'draft') {
      name = `Draft - ${name}`;
    }

    // Ensure .pdf extension and sanitize filename
    name = name.replace(/[^a-z0-9\s\-]/gi, '_').replace(/\s+/g, '_') + '.pdf';

    return name;
  }

  function findOriginalDownloadButton() {
    const candidates = [];

    // Try multiple selector strategies
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
      'a[data-testid*="download"]',
      'button[onclick*="download"]',
      'button[onclick*="pdf"]'
    ];
    
    selectors.forEach(s => {
      try {
        document.querySelectorAll(s).forEach(el => {
          if (el.id !== DOWNLOAD_BTN_ID) candidates.push(el);
        });
      } catch (e) {}
    });

    // Text-based search
    const textRegex = /\b(download|export|save).*pdf|\bpdf.*(download|export|save)/i;
    document.querySelectorAll('button, a, input[type="button"], input[type="submit"]').forEach(el => {
      const txt = (el.textContent || el.value || '').trim();
      if (textRegex.test(txt) && el.id !== DOWNLOAD_BTN_ID) candidates.push(el);
    });

    // Aria-label search
    document.querySelectorAll('[aria-label]').forEach(el => {
      const al = el.getAttribute('aria-label') || '';
      if (/\bdownload.*pdf|\bpdf.*download/i.test(al) && el.id !== DOWNLOAD_BTN_ID) candidates.push(el);
    });

    // Remove duplicates
    const unique = Array.from(new Set(candidates));
    return unique.length > 0 ? unique[0] : null;
  }

  function setupDownloadInterception() {
    // Intercept window.open for PDF downloads
    const originalOpen = window.open;
    window.open = function(url, target, features) {
      console.log('window.open called with:', url);
      if (url && url.includes('pdf')) {
        if (currentDownloadMode === 'draft') {
          document.body.classList.add('timetable-mode-draft');
        } else {
          document.body.classList.remove('timetable-mode-draft');
        }
      }
      return originalOpen.apply(this, arguments);
    };

    // Intercept fetch for PDF downloads
    const originalFetch = window.fetch;
    window.fetch = function(resource, config) {
      console.log('fetch called with:', resource);
      if (typeof resource === 'string' && resource.includes('pdf')) {
        if (currentDownloadMode === 'draft') {
          document.body.classList.add('timetable-mode-draft');
        } else {
          document.body.classList.remove('timetable-mode-draft');
        }
      }
      return originalFetch.apply(this, arguments);
    };

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      console.log('XMLHttpRequest.open called with:', method, url);
      if (typeof url === 'string' && url.includes('pdf')) {
        if (currentDownloadMode === 'draft') {
          document.body.classList.add('timetable-mode-draft');
        } else {
          document.body.classList.remove('timetable-mode-draft');
        }
      }
      return originalXHROpen.apply(this, arguments);
    };
  }

  function downloadPdf(mode) {
    console.log('=== Download PDF triggered:', mode, '===');
    currentDownloadMode = mode;

    // Set watermark mode
    if (mode === 'draft') {
      document.body.classList.add('timetable-mode-draft');
      console.log('Added draft watermark');
    } else {
      document.body.classList.remove('timetable-mode-draft');
      console.log('Removed draft watermark');
    }

    // Find and click the original button
    const originalBtn = findOriginalDownloadButton();
    console.log('Original button found:', originalBtn);
    
    if (originalBtn) {
      console.log('Clicking button:', originalBtn.tagName, originalBtn.textContent);
      originalBtn.click();
    } else {
      console.warn('Original download button not found');
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
    btn.innerHTML = '📥 Download PDF <span style="font-size: 12px; margin-left: 4px;">▼</span>';
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
    draftOption.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      downloadPdf('draft');
    });

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
    finalOption.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      downloadPdf('final');
    });

    menu.appendChild(draftOption);
    menu.appendChild(finalOption);

    container.appendChild(btn);
    container.appendChild(menu);

    // Close menu when clicking outside
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
      console.warn('Could not find original download button');
      return false;
    }

    const buttonContainer = createDownloadButton();

    try {
      if (originalBtn.parentNode) {
        originalBtn.parentNode.insertBefore(buttonContainer, originalBtn.nextSibling);
        // Hide original button
        originalBtn.style.display = 'none';
        console.log('Successfully inserted new download button');
        return true;
      }
    } catch (e) {
      console.error('Error inserting button:', e);
    }

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
    console.log('=== Initializing timetable download mode ===');
    ensureWatermark();
    setupDownloadInterception();
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
    getCurrentSemester,
    findOriginalDownloadButton,
    setMode: (mode) => { currentDownloadMode = mode; }
  };
})();
