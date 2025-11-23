// Content script for GenovaAI Extension
import bubbleStyles from './bubble.css?inline';

const BUBBLE_ID = 'genovaai-bubble-container';
const STORAGE_KEY = 'genovaai_bubble_preferences';

interface BubblePreferences {
  position: 'bl' | 'br' | 'tl' | 'tr';
  bgColor: string;
  textColor: string;
  bgTransparent: boolean;
  duration: number;
}

const DEFAULT_PREFERENCES: BubblePreferences = {
  position: 'bl',
  bgColor: '#000000',
  textColor: '#ffffff',
  bgTransparent: false,
  duration: 3000,
};

let shadowHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let hideTimeout: number | null = null;
let bubblePreferences: BubblePreferences = DEFAULT_PREFERENCES;

// Load bubble preferences from storage
async function loadBubblePreferences(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (result[STORAGE_KEY]) {
      bubblePreferences = result[STORAGE_KEY] as BubblePreferences;
      console.log('✅ Bubble preferences loaded:', bubblePreferences);
    }
  } catch (error) {
    console.error('❌ Error loading bubble preferences:', error);
  }
}

// Load preferences on script initialization
loadBubblePreferences();

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
chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  // Handle old format messages (GENOVA_RESULT, GENOVA_ERROR, GENOVA_LOADING)
  if (message.type === 'GENOVA_RESULT' && message.answer) {
    showBubble(message.answer, false);
    sendResponse({ success: true });
    return true;
  } else if (message.type === 'GENOVA_ERROR' && message.error) {
    showBubble('Error', true);
    sendResponse({ success: true });
    return true;
  } else if (message.type === 'GENOVA_LOADING') {
    showLoadingBubble();
    sendResponse({ success: true });
    return true;
  }
  
  // Handle auth errors
  if (message.type === 'AUTH_ERROR') {
    showBubble(message.message || 'Session expired. Please login again.', true);
    sendResponse({ success: true });
    return true;
  }
  
  // Handle logout
  if (message.type === 'LOGOUT') {
    showBubble('You have been logged out.', false);
    sendResponse({ success: true });
    return true;
  }
  
  // Handle direct answer messages (new format)
  if (message.answer) {
    showBubble(message.answer, message.type === 'error');
    sendResponse({ success: true });
    return true;
  }
  
  return false;
});

/**
 * Show loading bubble
 */
function showLoadingBubble(): void {
  // Remove existing bubble
  removeBubble();
  
  // Initialize shadow DOM
  const shadow = initShadowDOM();
  
  // Create bubble element
  const bubble = document.createElement('div');
  bubble.className = 'genovaai-bubble loading';
  bubble.innerHTML = '<div class="loading-spinner"></div>';

  // Apply user preferences
  if (bubblePreferences.bgTransparent) {
    bubble.style.backgroundColor = 'transparent';
    bubble.style.border = 'none';
    bubble.style.boxShadow = 'none';
    bubble.style.backdropFilter = 'none';
  } else {
    bubble.style.backgroundColor = bubblePreferences.bgColor;
  }
  bubble.style.color = bubblePreferences.textColor;
  bubble.classList.add(`position-${bubblePreferences.position}`);

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
}

/**
 * Show answer bubble on the page
 */
function showBubble(text: string, isError: boolean = false): void {
  // Remove existing bubble
  removeBubble();
  
  // Initialize shadow DOM
  const shadow = initShadowDOM();
  
  // Create bubble element
  const bubble = document.createElement('div');
  bubble.className = 'genovaai-bubble';
  if (isError) {
    bubble.classList.add('error');
  }
  bubble.textContent = text;

  // Apply user preferences
  if (bubblePreferences.bgTransparent) {
    bubble.style.backgroundColor = 'transparent';
    bubble.style.border = 'none';
    bubble.style.boxShadow = 'none';
    bubble.style.backdropFilter = 'none';
  } else {
    bubble.style.backgroundColor = bubblePreferences.bgColor;
  }
  bubble.style.color = bubblePreferences.textColor;
  
  // Add red border for errors
  if (isError) {
    bubble.style.border = '2px solid #dc2626';
    bubble.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
  }
  
  // Position from preferences
  bubble.classList.add(`position-${bubblePreferences.position}`);

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

  // Auto-hide after user-configured duration
  hideTimeout = window.setTimeout(() => {
    hideBubble();
  }, bubblePreferences.duration);

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
