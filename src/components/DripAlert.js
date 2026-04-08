/**
 * <drip-alert> — Drip Capital Alert Web Component
 * Source: Figma node 104:1231 (Alert)
 *
 * ── Attributes ────────────────────────────────────────────────────────────────
 * @attr {string}  variant  — success | warning | error | info   Default: info
 * @attr {string}  size     — small | large                       Default: small
 * @attr {string}  title    — Alert title / headline
 * @attr {string}  message  — Body text shown in large size only
 * @attr {boolean} dismissible — Show close/dismiss button
 *
 * ── Events ────────────────────────────────────────────────────────────────────
 * dismiss — fires when the user clicks the close button (bubbles)
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * <drip-alert variant="success" title="Profile saved"></drip-alert>
 * <drip-alert variant="error" size="large" title="Login failed"
 *             message="Check your email and password."></drip-alert>
 * <drip-alert variant="warning" title="Session expiring" dismissible></drip-alert>
 */

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&display=swap';

function ensureFontLoaded() {
  if (document.head.querySelector('link[data-drip-font]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONT_URL;
  link.setAttribute('data-drip-font', '');
  document.head.appendChild(link);
}

/** Figma colour tokens per variant */
const VARIANT_MAP = {
  success: { bg: '#D0FAE6', border: '#14B266', icon: successIcon() },
  warning: { bg: '#FCF0D8', border: '#F2B23D', icon: warningIcon() },
  error:   { bg: '#F5E0D9', border: '#CC6340', icon: errorIcon()   },
  info:    { bg: '#DAECF7', border: '#459ED9', icon: infoIcon()    },
};

/* ── SVG icon helpers (20 × 20) ─────────────────────────────────────────── */
function successIcon() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="#14B266" stroke-width="1.5"/>
    <path d="M6 10.5l3 3 5-5" stroke="#14B266" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
function warningIcon() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L18.66 17H1.34L10 2z" stroke="#F2B23D" stroke-width="1.5"
          stroke-linejoin="round"/>
    <path d="M10 8v4" stroke="#F2B23D" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="10" cy="14.5" r="0.75" fill="#F2B23D"/>
  </svg>`;
}
function errorIcon() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="#CC6340" stroke-width="1.5"/>
    <path d="M7 7l6 6M13 7l-6 6" stroke="#CC6340" stroke-width="1.5"
          stroke-linecap="round"/>
  </svg>`;
}
function infoIcon() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="#459ED9" stroke-width="1.5"/>
    <path d="M10 9v5" stroke="#459ED9" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="10" cy="6.5" r="0.75" fill="#459ED9"/>
  </svg>`;
}
function closeIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3l10 10M13 3L3 13" stroke="#6F8298" stroke-width="1.5"
          stroke-linecap="round"/>
  </svg>`;
}

class DripAlert extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'title', 'message', 'dismissible'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    ensureFontLoaded();
    this._render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this._render();
  }

  _render() {
    const variant     = (this.getAttribute('variant') || 'info').toLowerCase();
    const size        = (this.getAttribute('size')    || 'small').toLowerCase();
    const title       = this.getAttribute('title')   || '';
    const message     = this.getAttribute('message') || '';
    const dismissible = this.hasAttribute('dismissible');

    const tokens = VARIANT_MAP[variant] ?? VARIANT_MAP.info;
    const isLarge = size === 'large';

    this.shadowRoot.innerHTML = /* html */`
      <style>
        :host {
          display: block;
          font-family: 'Nunito Sans', sans-serif;
        }

        .alert {
          display: flex;
          align-items: ${isLarge ? 'flex-start' : 'center'};
          gap: 10px;
          background: ${tokens.bg};
          border: 1.5px solid ${tokens.border};
          border-radius: 8px;
          padding: ${isLarge ? '14px 16px' : '10px 14px'};
          width: 100%;
          box-sizing: border-box;
        }

        .icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          margin-top: ${isLarge ? '1px' : '0'};
        }

        .content {
          flex: 1;
          min-width: 0;
        }

        .title {
          font-size: ${isLarge ? '14px' : '13px'};
          font-weight: 700;
          color: #0A2E57;
          line-height: 1.4;
          margin: 0;
        }

        .message {
          font-size: 13px;
          font-weight: 400;
          color: #0A2E57;
          line-height: 1.5;
          margin: 4px 0 0;
        }

        .dismiss {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          opacity: 0.7;
          transition: opacity 0.15s ease;
          margin-left: 4px;
        }
        .dismiss:hover { opacity: 1; }
      </style>

      <div class="alert" role="alert">
        <span class="icon">${tokens.icon}</span>

        <div class="content">
          ${title   ? `<p class="title">${title}</p>`     : ''}
          ${isLarge && message ? `<p class="message">${message}</p>` : ''}
        </div>

        ${dismissible ? `
          <button class="dismiss" type="button" aria-label="Dismiss alert">
            ${closeIcon()}
          </button>
        ` : ''}
      </div>
    `;

    const dismissBtn = this.shadowRoot.querySelector('.dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true }));
        this.remove();
      });
    }
  }
}

customElements.define('drip-alert', DripAlert);
export default DripAlert;
