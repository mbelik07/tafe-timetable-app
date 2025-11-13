// timetable-download-mode.js
// Simple Download PDF button - no draft/watermark functionality

(function () {
  console.log('Simple Download PDF button initialized');

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

  function createSimpleDownloadButton() {
    // Check if button already exists
    if (document.getElementById('simpleDownloadBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'simpleDownloadBtn';
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
      console.log('✓ Simple Download PDF button added');
    } else {
      // If no original button found, add to top of page
      const header = document.querySelector('header, .header, nav, .navbar, .top-bar') || document.body;
      header.appendChild(btn);
      console.log('✓ Simple Download PDF button added to header');
    }

    // Add click handler
    btn.addEventListener('click', handleDownload);
  }

  function handleDownload(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Download PDF clicked');
    
    // Find the original download button and click it
    const originalBtn = findDownloadButton();
    if (originalBtn) {
      console.log('Clicking original download button');
      originalBtn.click();
    } else {
      console.log('No original button found, triggering PDF generation');
      // Try to trigger PDF generation directly
      if (typeof window.generatePdf === 'function') {
        window.generatePdf();
      } else if (typeof window.html2pdf === 'function') {
        window.html2pdf();
      } else {
        console.log('PDF generation method not found');
        alert('PDF download functionality not available');
      }
    }
  }

  function init() {
    console.log('Initializing simple Download PDF button...');
    createSimpleDownloadButton();
    
    // Watch for dynamically added buttons
    const observer = new MutationObserver(() => {
      if (!document.getElementById('simpleDownloadBtn')) {
        createSimpleDownloadButton();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('✓ Simple Download PDF button initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
