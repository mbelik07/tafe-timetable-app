// timetable-download-mode.js
// Embeds watermark directly into PDF generation

(function () {
  const DRAFT_TOGGLE_ID = 'draftModeToggle';
  const STATUS_INDICATOR_ID = 'downloadStatusIndicator';
  let isDraftMode = false;

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
      position: relative;
      z-index: 1000;
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

    function setDraftMode(draft) {
      isDraftMode = draft;
      if (draft) {
        draftBtn.style.background = '#fff';
        draftBtn.style.border = '1px solid #f6ad55';
        draftBtn.style.color = '#c05621';
        finalBtn.style.background = 'transparent';
        finalBtn.style.border = 'none';
        finalBtn.style.color = '#22543d';
      } else {
        finalBtn.style.background = '#fff';
        finalBtn.style.border = '1px solid #48bb78';
        finalBtn.style.color = '#22543d';
        draftBtn.style.background = 'transparent';
        draftBtn.style.border = 'none';
        draftBtn.style.color = '#c05621';
      }
      updateStatusIndicator();
    }

    draftBtn.addEventListener('click', () => setDraftMode(true));
    finalBtn.addEventListener('click', () => setDraftMode(false));
    setDraftMode(false);

    container.appendChild(draftBtn);
    container.appendChild(finalBtn);

    // Insert after the Download PDF button
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

  // Add watermark to PDF content
  function addWatermarkToPdfContent() {
    if (!isDraftMode) return;

    // Create a temporary watermark element for PDF
    const watermarkDiv = document.createElement('div');
    watermarkDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 100px;
      font-weight: 900;
      color: rgba(160, 160, 160, 0.2);
      z-index: 99999;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      width: 100%;
      text-align: center;
    `;
    watermarkDiv.textContent = 'DRAFT';

    // Add to document body temporarily
    document.body.appendChild(watermarkDiv);
    
    // Return the element so it can be removed after PDF generation
    return watermarkDiv;
  }

  // Modify PDF generation to include watermark
  function modifyPdfGeneration() {
    // Check for html2pdf or similar PDF generation
    if (typeof window.html2pdf !== 'undefined') {
      const originalHtml2pdf = window.html2pdf;
      
      window.html2pdf = function(element, options = {}) {
        console.log('PDF generation detected, mode:', isDraftMode ? 'DRAFT' : 'FINAL');
        
        // Add watermark to options if in draft mode
        if (isDraftMode) {
          // Add watermark to the element before conversion
          const watermark = addWatermarkToPdfContent();
          
          // Modify options to include watermark
          if (!options.jsPDF) options.jsPDF = {};
          if (!options.jsPDF.format) options.jsPDF.format = 'a4';
          if (!options.jsPDF.orientation) options.jsPDF.orientation = 'portrait';
          
          // Add custom callback to handle watermark
          const originalCallback = options.callback;
          options.callback = function(pdf) {
            // Remove temporary watermark
            if (watermark && watermark.parentNode) {
              watermark.parentNode.removeChild(watermark);
            }
            
            if (originalCallback) {
              originalCallback(pdf);
            }
          };
        }
        
        return originalHtml2pdf.call(this, element, options);
      };
    }

    // Also check for direct jsPDF usage
    if (typeof window.jsPDF !== 'undefined') {
      const originalJsPDF = window.jsPDF;
      
      window.jsPDF = function(options = {}) {
        const doc = new originalJsPDF(options);
        
        // Override addPage to add watermark
        const originalAddPage = doc.addPage;
        doc.addPage = function() {
          const result = originalAddPage.apply(this, arguments);
          
          if (isDraftMode) {
            // Add watermark to each page
            this.setFontSize(100);
            this.setTextColor(200, 200, 200);
            this.setFont(undefined, 'bold');
            this.text('DRAFT', this.internal.pageSize.width / 2, this.internal.pageSize.height / 2, {
              align: 'center',
              angle: -45,
              opacity: 0.2
            });
            this.setTextColor(0, 0, 0);
          }
          
          return result;
        };
        
        return doc;
      };
    }

    // Check for generatePdf function
    if (typeof window.generatePdf === 'function') {
      const originalGeneratePdf = window.generatePdf;
      
      window.generatePdf = function() {
        console.log('PDF generation started, mode:', isDraftMode ? 'DRAFT' : 'FINAL');
        
        // Add watermark before generation
        let watermarkElement = null;
        if (isDraftMode) {
          watermarkElement = addWatermarkToPdfContent();
        }
        
        try {
          const result = originalGeneratePdf.apply(this, arguments);
          
          // Clean up watermark after generation
          if (watermarkElement && watermarkElement.parentNode) {
            watermarkElement.parentNode.removeChild(watermarkElement);
          }
          
          return result;
        } catch (error) {
          // Clean up even on error
          if (watermarkElement && watermarkElement.parentNode) {
            watermarkElement.parentNode.removeChild(watermarkElement);
          }
          throw error;
        }
      };
    }
  }

  // Add CSS for print media to ensure watermark appears
  function addPrintStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        .draft-watermark {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) rotate(-45deg) !important;
          font-size: 140px !important;
          font-weight: 900 !important;
          color: rgba(160, 160, 160, 0.2) !important;
          z-index: 99999 !important;
          white-space: nowrap !important;
          pointer-events: none !important;
          user-select: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    console.log('Initializing download mode with PDF watermark...');
    createDraftToggle();
    createStatusIndicator();
    addPrintStyles();
    
    // Wait a bit for other scripts to load, then modify PDF generation
    setTimeout(() => {
      modifyPdfGeneration();
      console.log('✓ PDF generation modified for watermark support');
    }, 1000);
    
    console.log('✓ Download mode initialized with PDF watermark');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
