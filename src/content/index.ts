// Content script for GenovaAI Extension
import type { GenovaMessage, BubbleAppearance } from '../shared/types';
import bubbleStyles from './bubble.css?inline';

const BUBBLE_ID = 'genovaai-bubble-container';
const BUBBLE_DISPLAY_DURATION = 3000; // 3 seconds

let shadowHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let hideTimeout: number | null = null;

/**
 * Initialize Shadow DOM for bubble
 */
function initShadowDOM(): ShadowRoot {
  if (shadowRoot) return shadowRoot;
  
  // Create shadow host
  shadowHost = document.createElement('div');
  shadowHost.id = BUBBLE_ID;
  shadowHost.style.position = 'fixed';
  shadowHost.style.zIndex = '2147483647'; // Maximum z-index
  shadowHost.style.pointerEvents = 'none';
  
  // Attach shadow root
  shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  
  // Add styles to shadow DOM
  const styleEl = document.createElement('style');
  styleEl.textContent = bubbleStyles;
  shadowRoot.appendChild(styleEl);
  
  document.body.appendChild(shadowHost);
  
  return shadowRoot;
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message: GenovaMessage) => {
  if (message.type === 'GENOVA_RESULT' && message.answer) {
    showBubble(message.answer, message.bubbleAppearance);
  } else if (message.type === 'GENOVA_ERROR' && message.error) {
    showBubble(`❌ ${message.error}`, {
      position: 'br',
      bgColor: '#dc2626',
      textColor: '#ffffff',
    });
  }
});

/**
 * Show answer bubble on the page
 */
function showBubble(text: string, appearance?: BubbleAppearance): void {
  // Remove existing bubble
  removeBubble();
  
  // Initialize shadow DOM
  const shadow = initShadowDOM();
  
  // Create bubble element
  const bubble = document.createElement('div');
  bubble.className = 'genovaai-bubble';
  bubble.textContent = text;

  // Apply appearance settings
  if (appearance) {
    bubble.style.backgroundColor = appearance.bgColor;
    bubble.style.color = appearance.textColor;
    
    // Position classes: bl, br, tl, tr
    bubble.classList.add(`position-${appearance.position}`);
  } else {
    // Default appearance
    bubble.classList.add('position-bl');
  }

  // Add to shadow DOM
  shadow.appendChild(bubble);
  
  // Enable pointer events on shadow host
  if (shadowHost) {
    shadowHost.style.pointerEvents = 'auto';
  }

  // Trigger animation
  requestAnimationFrame(() => {
    bubble.classList.add('show');
  });

  // Auto-hide after duration
  hideTimeout = window.setTimeout(() => {
    hideBubble();
  }, BUBBLE_DISPLAY_DURATION);

  // Allow manual close on click
  bubble.addEventListener('click', hideBubble);
}

/**
 * Hide and remove bubble with animation
 */
function hideBubble(): void {
  if (!shadowRoot) return;
  
  const bubble = shadowRoot.querySelector('.genovaai-bubble');
  if (bubble) {
    bubble.classList.remove('show');
    
    // Wait for animation to complete
    setTimeout(() => {
      removeBubble();
    }, 300);
  }
}

/**
 * Remove bubble from DOM
 */
function removeBubble(): void {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  if (shadowRoot) {
    const bubble = shadowRoot.querySelector('.genovaai-bubble');
    if (bubble) {
      bubble.remove();
    }
  }
  
  // Disable pointer events when no bubble
  if (shadowHost) {
    shadowHost.style.pointerEvents = 'none';
  }
}

console.log('GenovaAI Content Script loaded');
