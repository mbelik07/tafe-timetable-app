// timetable-download-mode.js
// Direct PDF download - no dialogs, no popups

(function () {
  console.log('Direct PDF download initialized');

  function findDownloadButton() {
    // Look for existing Download PDF button
    const buttons = document.querySelectorAll('button');
    for (let btn of buttons) {
      if (btn.textContent.includes('Download') && btn.textContent.includes('PDF')) {
        return btn;
      }
    }
    return null;
  }

  function createDirectDownloadButton() {
    // Check if button already exists
    if (document.getElementById('directDownloadBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'directDownloadBtn';
    btn.innerHTML = '📥 Download PDF';
    btn.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin: 0 10px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    btn.onmouseover = () => {
      btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      btn.style.transform = 'translateY(-1px)';
    };
    
    btn.onmouseout = () => {
      btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      btn.style.transform = 'translateY(0)';
    };

    // Find the original button and insert after it
    const originalBtn = findDownloadButton();
    if (originalBtn && originalBtn.parentNode) {
      originalBtn.parentNode.insertBefore(btn, originalBtn.nextSibling);
      console.log('✓ Direct Download PDF button added');
    } else {
      // If no original button found, add to top of page
      const header = document.querySelector('header, .header, nav, .navbar, .top-bar') || document.body;
      header.appendChild(btn);
      console.log('✓ Direct Download PDF button added to header');
    }

    // Add click handler - DIRECT download, no dialogs
    btn.addEventListener('click', handleDirectDownload);
  }

  function handleDirectDownload(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Direct PDF download triggered');
    
    // Find the original download button and click it immediately
    const originalBtn = findDownloadButton();
    if (originalBtn) {
      console.log('Triggering original download');
      originalBtn.click();
    } else {
      // Try alternative methods
      console.log('Trying alternative PDF generation methods');
      
      // Method 1: Look for generatePdf function
      if (typeof window.generatePdf === 'function') {
        window.generatePdf();
        return;
      }
      
      // Method 2: Look for html2pdf
      if (typeof window.html2pdf === 'function') {
        const element = document.body; // or specific timetable element
        window.html2pdf(element);
        return;
      }
      
      // Method 3: Look for any PDF-related function
      const pdfFunctions = ['generatePdf', 'downloadPdf', 'exportPdf', 'printPdf', 'createPdf'];
      for (let funcName of pdfFunctions) {
        if (typeof window[funcName] === 'function') {
          console.log(`Found PDF function: ${funcName}`);
          window[funcName]();
          return;
        }
      }
      
      console.log('No PDF generation method found');
    }
  }

  // Remove any existing modal/dialog elements
  function removeExistingDialogs() {
    // Remove any modal overlays
    const modals = document.querySelectorAll('[id*="modal"], [class*="modal"], [id*="dialog"], [class*="dialog"]');
    modals.forEach(modal => {
      if (modal.style.display !== 'none') {
        modal.style.display = 'none';
      }
    });

    // Remove any backdrop overlays
    const backdrops = document.querySelectorAll('[class*="backdrop"], [class*="overlay"]');
    backdrops.forEach(backdrop => {
      if (backdrop.style.display !== 'none') {
        backdrop.style.display = 'none';
      }
    });
  }

  function init() {
    console.log('Initializing direct PDF download (no dialogs)...');
    
    // Remove any existing dialogs first
    removeExistingDialogs();
    
    // Create the button
    createDirectDownloadButton();
    
    // Watch for dynamically added dialogs and remove them
    const observer = new MutationObserver(() => {
      removeExistingDialogs();
      if (!document.getElementById('directDownloadBtn')) {
        createDirectDownloadButton();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('✓ Direct PDF download initialized (no dialogs)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
