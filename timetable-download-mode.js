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
  display: block
