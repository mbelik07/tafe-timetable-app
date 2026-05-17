// Draft Toggle Feature
// Add this script to enable draft mode with watermark

(function() {
  // Add CSS for draft watermark and toggle
  const style = document.createElement('style');
  style.textContent = `
    .draft-toggle-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.375rem;
    }
    
    .draft-toggle-label {
      font-weight: 600;
      color: white;
      font-size: 0.875rem;
    }
    
    .draft-toggle {
      position: relative;
      width: 48px;
      height: 24px;
      background: #cbd5e0;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.3s;
    }
    
    .draft-toggle.active {
      background: #fbbf24;
    }
    
    .draft-toggle-slider {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .draft-toggle.active .draft-toggle-slider {
      transform: translateX(24px);
    }
    
    .draft-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      font-weight: bold;
      color: rgba(200, 200, 200, 0.15);
      pointer-events: none;
      z-index: 5;
      user-select: none;
      white-space: nowrap;
      display: none;
    }
    
    body.draft-mode .draft-watermark {
      display: block;
    }
    
    @media print {
      .draft-watermark {
        position: absolute;
        color: rgba(200, 200, 200, 0.15) !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      body.draft-mode .draft-watermark {
        display: block !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Add draft toggle to header
  function addDraftToggle() {
    const headerControls = document.querySelector('.header-controls') || 
                          document.querySelector('header .flex.items-center.gap-3');
    
    if (!headerControls) return;
    
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'draft-toggle-container';
    toggleContainer.innerHTML = `
      <span class="draft-toggle-label">DRAFT</span>
      <div class="draft-toggle" id="draftToggle">
        <div class="draft-toggle-slider"></div>
      </div>
    `;
    
    // Insert before the print button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
      headerControls.insertBefore(toggleContainer, printBtn);
    } else {
      headerControls.appendChild(toggleContainer);
    }
    
    // Add watermark element
    const watermark = document.createElement('div');
    watermark.className = 'draft-watermark';
    watermark.textContent = 'DRAFT';
    document.body.appendChild(watermark);
    
    // Load saved state
    loadDraftState();
    
    // Add click handler
    document.getElementById('draftToggle').addEventListener('click', toggleDraftMode);
  }
  
  function toggleDraftMode() {
    const toggle = document.getElementById('draftToggle');
    const isActive = toggle.classList.contains('active');
    
    if (isActive) {
      toggle.classList.remove('active');
      document.body.classList.remove('draft-mode');
    } else {
      toggle.classList.add('active');
      document.body.classList.add('draft-mode');
    }
    
    saveDraftState(!isActive);
  }
  
  function saveDraftState(isDraft) {
    // Save per semester
    const currentSemester = window.db?.currentSemester || 'default';
    const draftStates = JSON.parse(localStorage.getItem('draftStates') || '{}');
    draftStates[currentSemester] = isDraft;
    localStorage.setItem('draftStates', JSON.stringify(draftStates));
  }
  
  function loadDraftState() {
    const currentSemester = window.db?.currentSemester || 'default';
    const draftStates = JSON.parse(localStorage.getItem('draftStates') || '{}');
    const isDraft = draftStates[currentSemester] || false;
    
    const toggle = document.getElementById('draftToggle');
    if (isDraft) {
      toggle.classList.add('active');
      document.body.classList.add('draft-mode');
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDraftToggle);
  } else {
    addDraftToggle();
  }
  
  // Re-load state when semester changes
  const originalChangeSemester = window.changeSemester;
  if (originalChangeSemester) {
    window.changeSemester = function(...args) {
      originalChangeSemester.apply(this, args);
      setTimeout(loadDraftState, 100);
    };
  }
})();
