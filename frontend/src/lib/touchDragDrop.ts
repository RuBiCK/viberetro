/**
 * Touch-enabled drag and drop utility
 * Adds touch event handling to standard HTML5 drag and drop
 */

export interface TouchDragDropHandlers {
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onTouchCancel?: (e: React.TouchEvent) => void;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  element: HTMLElement | null;
  clone: HTMLElement | null;
  dropTargets: HTMLElement[];
  currentDropTarget: HTMLElement | null;
}

const dragState: DragState = {
  isDragging: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  element: null,
  clone: null,
  dropTargets: [],
  currentDropTarget: null
};

/**
 * Create touch drag handlers for a draggable element
 */
export function createTouchDragHandlers(
  onDragStart?: () => void,
  onDragEnd?: () => void,
  onDrop?: (target: HTMLElement) => void
): TouchDragDropHandlers {

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    const touch = e.touches[0];

    dragState.isDragging = true;
    dragState.startX = touch.clientX;
    dragState.startY = touch.clientY;
    dragState.currentX = touch.clientX;
    dragState.currentY = touch.clientY;
    dragState.element = target;

    // Create visual clone
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.top = `${touch.clientY - target.offsetHeight / 2}px`;
    clone.style.left = `${touch.clientX - target.offsetWidth / 2}px`;
    clone.style.width = `${target.offsetWidth}px`;
    clone.style.height = `${target.offsetHeight}px`;
    clone.style.opacity = '0.8';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.transform = 'rotate(5deg) scale(1.05)';
    clone.style.transition = 'transform 0.2s ease';

    document.body.appendChild(clone);
    dragState.clone = clone;

    // Make original semi-transparent
    target.style.opacity = '0.3';

    // Find all potential drop targets
    dragState.dropTargets = Array.from(
      document.querySelectorAll('[data-drop-target="true"]')
    ) as HTMLElement[];

    if (onDragStart) {
      onDragStart();
    }

    // Prevent default to avoid scrolling
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDragging || !dragState.clone) return;

    const touch = e.touches[0];
    dragState.currentX = touch.clientX;
    dragState.currentY = touch.clientY;

    // Update clone position
    dragState.clone.style.top = `${touch.clientY - dragState.clone.offsetHeight / 2}px`;
    dragState.clone.style.left = `${touch.clientX - dragState.clone.offsetWidth / 2}px`;

    // Check for drop targets under touch point
    const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    let dropTarget: HTMLElement | null = null;

    if (elementAtPoint) {
      // Find if element or any parent is a drop target
      let current: HTMLElement | null = elementAtPoint;
      while (current && current !== document.body) {
        if (current.dataset.dropTarget === 'true') {
          dropTarget = current;
          break;
        }
        current = current.parentElement;
      }
    }

    // Update drop target highlighting
    if (dropTarget !== dragState.currentDropTarget) {
      // Remove highlight from previous
      if (dragState.currentDropTarget) {
        dragState.currentDropTarget.classList.remove('touch-drop-over');
      }

      // Add highlight to new
      if (dropTarget) {
        dropTarget.classList.add('touch-drop-over');
      }

      dragState.currentDropTarget = dropTarget;
    }

    // Prevent scrolling
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragState.isDragging) return;

    // Restore original element opacity
    if (dragState.element) {
      dragState.element.style.opacity = '1';
    }

    // Remove clone
    if (dragState.clone) {
      dragState.clone.remove();
    }

    // Remove drop target highlighting
    if (dragState.currentDropTarget) {
      dragState.currentDropTarget.classList.remove('touch-drop-over');

      // Trigger drop callback
      if (onDrop) {
        onDrop(dragState.currentDropTarget);
      }
    }

    if (onDragEnd) {
      onDragEnd();
    }

    // Reset state
    resetDragState();

    e.preventDefault();
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    if (!dragState.isDragging) return;

    // Restore original element
    if (dragState.element) {
      dragState.element.style.opacity = '1';
    }

    // Remove clone
    if (dragState.clone) {
      dragState.clone.remove();
    }

    // Remove highlighting
    if (dragState.currentDropTarget) {
      dragState.currentDropTarget.classList.remove('touch-drop-over');
    }

    if (onDragEnd) {
      onDragEnd();
    }

    resetDragState();

    e.preventDefault();
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  };
}

function resetDragState() {
  dragState.isDragging = false;
  dragState.startX = 0;
  dragState.startY = 0;
  dragState.currentX = 0;
  dragState.currentY = 0;
  dragState.element = null;
  dragState.clone = null;
  dragState.dropTargets = [];
  dragState.currentDropTarget = null;
}

/**
 * Props for drop target elements
 */
export function getDropTargetProps(): { 'data-drop-target': string } {
  return { 'data-drop-target': 'true' };
}
