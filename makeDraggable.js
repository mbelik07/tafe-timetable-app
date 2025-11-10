/**
 * Improved makeDraggable function with cell-level drop indicators
 * Eliminates row/column highlighting and shows only a subtle border on target cell
 */

function makeDraggable(config) {
  const {
    container,
    sessionSelector = '.session-block',
    cellSelector = '.time-slot',
    onDrop = () => {}
  } = config;

  // Inject high-specificity style override to suppress row/column highlighting during drag
  const styleId = 'drag-override-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      body.dragging .day-column:hover,
      body.dragging .time-slot:hover,
      body.dragging .day-column,
      body.dragging .time-slot {
        background-color: transparent !important;
        box-shadow: none !important;
      }
      body.dragging .day-column {
        border-color: #d1d5db !important;
      }
      .drop-indicator {
        position: fixed;
        border: 2px dashed #3b82f6;
        background-color: rgba(59, 130, 246, 0.05);
        pointer-events: none;
        z-index: 9999;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  // Create drop indicator element
  const dropIndicator = document.createElement('div');
  dropIndicator.className = 'drop-indicator';
  dropIndicator.style.display = 'none';
  document.body.appendChild(dropIndicator);

  // Attach drag listeners to all session blocks
  const sessions = container.querySelectorAll(sessionSelector);
  sessions.forEach(session => {
    session.addEventListener('mousedown', handleDragStart);
  });

  function handleDragStart(e) {
    if (e.button !== 0) return; // Only left mouse button
    if (e.target.classList.contains('resize-handle')) return;

    e.preventDefault();
    e.stopPropagation();

    const sessionEl = e.currentTarget;
    let isDragging = false;
    let clone = null;
    let startX = e.clientX;
    let startY = e.clientY;

    function handleMouseMove(e) {
      // Start dragging after 5px movement
      if (!isDragging && (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5)) {
        isDragging = true;
        document.body.classList.add('dragging');

        // Create ghost clone
        clone = sessionEl.cloneNode(true);
        clone.classList.add('drag-clone');
        Object.assign(clone.style, {
          position: 'fixed',
          zIndex: '10000',
          opacity: '0.8',
          pointerEvents: 'none',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
        });
        document.body.appendChild(clone);
        sessionEl.style.visibility = 'hidden';
      }

      if (isDragging) {
        // Update clone position
        const rect = sessionEl.getBoundingClientRect();
        const offsetX = startX - rect.left;
        const offsetY = startY - rect.top;
        clone.style.left = `${e.clientX - offsetX}px`;
        clone.style.top = `${e.clientY - offsetY}px`;

        // Find exact cell under cursor
        dropIndicator.style.display = 'none';
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        let targetCell = null;

        for (let el of elements) {
          if (el.matches(cellSelector) && el.closest('.day-column')) {
            targetCell = el;
            break;
          }
        }

        if (targetCell) {
          const rect = targetCell.getBoundingClientRect();
          Object.assign(dropIndicator.style, {
            display: 'block',
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`
          });
        }
      }
    }

    function handleMouseUp(e) {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('dragging');
      dropIndicator.style.display = 'none';

      if (isDragging && clone) {
        clone.remove();
        sessionEl.style.visibility = 'visible';

        // Find drop target
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        let targetCell = null;

        for (let el of elements) {
          if (el.matches(cellSelector) && el.closest('.day-column')) {
            targetCell = el;
            break;
          }
        }

        if (targetCell) {
          onDrop(sessionEl, targetCell, 0);
        }
      } else {
        sessionEl.style.visibility = 'visible';
      }
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  return {
    destroy: () => {
      sessions.forEach(session => {
        session.removeEventListener('mousedown', handleDragStart);
      });
      dropIndicator.remove();
    }
  };
}
