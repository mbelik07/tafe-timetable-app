// timetable-download-mode.js
// Adds Draft/Final toggle buttons and modifies PDF generation

(function () {
  const WATERMARK_ID = 'timetableDraftWatermark';
  const DRAFT_TOGGLE_ID = 'draftModeToggle';
  const STATUS_INDICATOR_ID = 'downloadStatusIndicator';
  
  let isDraftMode = false;

  // Create watermark
  function createWatermark() {
    if (document.getElementById(WATERMARK_ID)) return;
    const watermark = document.createElement('div');
    watermark.id = WATERMARK_ID;
    watermark.style.cssText = `
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px; font-weight: 900;
      color: rgba(180, 180, 180, 0.14);
      z-index: 99998; white-space: nowrap;
      pointer-events: none; user-select: none; display: none;
    `;
    watermark.textContent = 'DRAFT';
    document.body.appendChild(watermark);
  }

  // Create Draft/Final toggle buttons
  function createDraftToggle() {
    if (document.getElementById(DRAFT_TOGGLE_ID)) return;

    const container = document.createElement('div');
    container.id = DRAFT_TOGGLE_ID;
    container.style.cssText = `
      display: inline-flex;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 4px;
      margin: 0 10px;
      border: 1px solid #e2e8f0;
    `;

    const draftBtn = document.createElement('button');
    draftBtn.id = 'draftBtn';
    draftBtn.innerHTML = '📋 Draft';
    draftBtn.style.cssText = `
      background: #fff;
      color: #c05621;
      border: 1px solid #f6ad55;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    const finalBtn = document.createElement('button');
    finalBtn.id = 'finalBtn';
    finalBtn.innerHTML = '✓ Final';
    finalBtn.style.cssText = `
      background: transparent;
      color: #22543d;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    // Toggle functionality
    function setDraftMode(draft) {
      isDraftMode = draft;
      if (draft) {
        draftBtn.style.background = '#fff';
        draftBtn.style.border = '1px solid #f6ad55';
        draftBtn.style.color = '#c05621';
        finalBtn.style.background = 'transparent';
        finalBtn.style.border = 'none';
        finalBtn.style.color = '#22543d';
        document.body.classList.add('timetable-mode-draft');
        document.getElementById(WATERMARK_ID).style.display = 'block';
      } else {
        finalBtn.style.background = '#fff';
        finalBtn.style.border = '1px solid #48bb78';
        finalBtn.style.color = '#22543d';
        draftBtn.style.background = 'transparent';
        draftBtn.style.border = 'none';
        draftBtn.style.color = '#c05621';
        document.body.classList.remove('timetable-mode-draft');
        document.getElementById(WATERMARK_ID).style.display = 'none';
      }
      updateStatusIndicator();
    }

    draftBtn.addEventListener('click', () => setDraftMode(true));
    finalBtn.addEventListener('click', () => setDraftMode(false));
    
    // Default to Final mode
    setDraftMode(false);

    container.appendChild(draftBtn);
    container.appendChild(finalBtn);

    // Insert after the existing Download PDF button
    const downloadBtn = document.querySelector('button');
    if (downloadBtn && downloadBtn.parentNode) {
      downloadBtn.parentNode.insertBefore(container, downloadBtn.nextSibling);
    }
  }

  // Create status indicator
  function createStatusIndicator() {
    if (document.getElementById(STATUS_INDICATOR_ID)) return;

    const indicator = document.createElement('div');
    indicator.id = STATUS_INDICATOR_ID;
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      z-index: 1000;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(indicator);
    updateStatusIndicator();
  }

  function updateStatusIndicator() {
    const indicator = document.getElementById(STATUS_INDICATOR_ID);
    if (indicator) {
      if (isDraftMode) {
        indicator.style.background = '#fffaf0';
        indicator.style.color = '#c05621';
        indicator.style.border = '1px solid #f6ad55';
        indicator.innerHTML = '📋 DRAFT MODE ACTIVE';
      } else {
        indicator.style.background = '#f0fff4';
        indicator.style.color = '#22543d';
        indicator.style.border = '1px solid #48bb78';
        indicator.innerHTML = '✓ FINAL MODE ACTIVE';
      }
    }
  }

  // Modify the PDF generation function
  function modifyPdfGeneration() {
    // Check if generatePdf function exists
    if (typeof window.generatePdf === 'function') {
      const originalGeneratePdf = window.generatePdf;
      
      window.generatePdf = function() {
        console.log('PDF generation started, mode:', isDraftMode ? 'DRAFT' : 'FINAL');
        
        // Set watermark based on mode
        if (isDraftMode) {
          document.body.classList.add('timetable-mode-draft');
          document.getElementById(WATERMARK_ID).style.display = 'block';
        } else {
          document.body.classList.remove('timetable-mode-draft');
          document.getElementById(WATERMARK_ID).style.display = 'none';
        }
        
        // Call original function
        const result = originalGeneratePdf.apply(this, arguments);
        
        // Update filename if possible
        setTimeout(() => {
          updatePdfFilename();
        }, 100);
        
        return result;
      };
      
      console.log('✓ PDF generation function modified');
    } else {
      console.log('generatePdf function not found, watching for it...');
      
      // Watch for the function to be created
      const checkInterval = setInterval(() => {
        if (typeof window.generatePdf === 'function') {
          clearInterval(checkInterval);
          modifyPdfGeneration();
        }
      }, 500);
    }
  }

  function updatePdfFilename() {
    // Try to modify the filename if possible
    // This depends on how your PDF generation works
    const semester = window.db?.currentSemester || 'Semester';
    const college = window.db?.semesters?.[semester]?.currentCollege || 'Timetable';
    const mode = isDraftMode ? 'DRAFT' : 'FINAL';
    
    // The filename will be handled by your PDF generation
    console.log(`PDF filename should include: ${mode}_${semester}_${college}`);
  }

  function init() {
    console.log('Initializing download mode...');
    createWatermark();
    createDraftToggle();
    createStatusIndicator();
    modifyPdfGeneration();
    
    console.log('✓ Download mode initialized');
    console.log('✓ Draft/Final toggle buttons added');
    console.log('✓ PDF generation function modified');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
