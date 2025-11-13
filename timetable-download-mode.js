// timetable-download-mode.js
// Simple Draft/Final selector for PDF downloads

(function () {
  const WATERMARK_ID = 'timetableDraftWatermark';
  const MODAL_ID = 'downloadModeModal';
  let currentMode = 'final';
  let lastClickedButton = null;

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

  // Create modal
  function createModal() {
    if (document.getElementById(MODAL_ID)) return;

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5); display: none; z-index: 10000;
      align-items: center; justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white; border-radius: 12px; padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center; min-width: 450px;
    `;

    content.innerHTML = `
      <h2 style="margin: 0 0 15px 0; color: #333; font-size: 22px; font-weight: 700;">Download PDF</h2>
      <p style="margin: 0 0 35px 0; color: #666; font-size: 15px;">Select download format:</p>
      
      <div style="display: flex; gap: 20px; justify-content: center;">
        <button id="draftBtn" style="
          background: linear-gradient(135deg, #f6ad55 0%, #c05621 100%);
          color: white; border: none; padding: 14px 28px;
          border-radius: 8px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(192, 86, 33, 0.3);
        " onmouseover="this.style.boxShadow='0 6px 16px rgba(192, 86, 33, 0.4)'" onmouseout="this.style.boxShadow='0 4px 12px rgba(192, 86, 33, 0.3)'">
          📋 Draft (with watermark)
        </button>
        
        <button id="finalBtn" style="
          background: linear-gradient(135deg, #48bb78 0%, #22543d 100%);
          color: white; border: none; padding: 14px 28px;
          border-radius: 8px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(34, 84, 61, 0.3);
        " onmouseover="this.style.boxShadow='0 6px 16px rgba(34, 84, 61, 0.4)'" onmouseout="this.style.boxShadow='0 4px 12px rgba(34, 84, 61, 0.3)'">
          ✓ Final (no watermark)
        </button>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('draftBtn').addEventListener('click', () => {
      currentMode = 'draft';
      document.body.classList.add('timetable-mode-draft');
      document.getElementById(WATERMARK_ID).style.display = 'block';
      closeModal();
      if (lastClickedButton) {
        setTimeout(() => lastClickedButton.click(), 50);
      }
    });

    document.getElementById('finalBtn').addEventListener('click', () => {
      currentMode = 'final';
      document.body.classList.remove('timetable-mode-draft');
      document.getElementById(WATERMARK_ID).style.display = 'none';
      closeModal();
      if (lastClickedButton) {
        setTimeout(() => lastClickedButton.click(), 50);
      }
    });
  }

  function showModal() {
    document.getElementById(MODAL_ID).style.display = 'flex';
  }

  function closeModal() {
    document.getElementById(MODAL_ID).style.display = 'none';
  }

  function interceptDownloadButton() {
    // Find button by looking for "Download" text
    const allButtons = document.querySelectorAll('button');
    
    for (let btn of allButtons) {
      const text = btn.textContent.trim();
      if (text.includes('Download') && text.includes('PDF')) {
        // Store original onclick
        const originalOnClick = btn.onclick;
        
        // Replace with our handler
        btn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          lastClickedButton = btn;
          showModal();
          return false;
        };
        
        console.log('✓ Download button intercepted:', text);
        return;
      }
    }
  }

  function init() {
    console.log('Initializing download mode...');
    createWatermark();
    createModal();
    interceptDownloadButton();

    // Watch for new buttons
    const observer = new MutationObserver(() => {
      if (!lastClickedButton) {
        interceptDownloadButton();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
