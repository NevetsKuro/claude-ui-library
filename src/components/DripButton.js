/**
 * <cl-button> — Drip Capital Button Web Component
 * Source: Figma node 103:10976 (Primary Button, Secondary Button, Tertiary Button)
 *
 * ── Attributes ────────────────────────────────────────────────────────────────
 * @attr {string}  variant  — primary | secondary | tertiary   Default: primary
 * @attr {string}  size     — large | medium | small            Default: large
 * @attr {boolean} disabled — disables the button
 * @attr {string}  type     — submit | button | reset           Default: button
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * <cl-button>Sign In</cl-button>
 * <cl-button variant="secondary" size="medium">Cancel</cl-button>
 * <cl-button variant="tertiary">Learn More</cl-button>
 * <cl-button disabled>Loading…</cl-button>
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

/** Size → height + padding + font-size from Figma */
const SIZE_MAP = {
  large:  { height: '56px', padding: '0 24px', fontSize: '16px' },
  medium: { height: '48px', padding: '0 20px', fontSize: '16px' },
  small:  { height: '40px', padding: '0 16px', fontSize: '14px' },
};

class DripButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'type'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // Stored reference for cleanup — prevents listener accumulation
    this._clickHandler = null;
  }

  connectedCallback() {
    ensureFontLoaded();
    this._render();
    this._bindClick();
  }

  disconnectedCallback() {
    // Clean up click listener when element is removed from DOM
    const btn = this.shadowRoot?.querySelector('button');
    if (btn && this._clickHandler) {
      btn.removeEventListener('click', this._clickHandler);
    }
    this._clickHandler = null;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.shadowRoot.innerHTML) return;

    // Fine-grained updates — avoid full re-render for single-attribute changes
    if (name === 'disabled') {
      this._updateDisabledState();
    } else {
      // variant, size, type require full style recalculation
      this._render();
      this._bindClick();
    }
  }

  // ── Fine-grained disabled toggle (no Shadow DOM teardown) ─────────────────────
  _updateDisabledState() {
    const btn     = this.shadowRoot?.querySelector('button');
    const disabled = this.hasAttribute('disabled');
    if (!btn) return;

    btn.disabled = disabled;
    btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }

  // ── Bind click — stored ref prevents accumulation across re-renders ───────────
  _bindClick() {
    const btn = this.shadowRoot?.querySelector('button');
    if (!btn) return;

    // Remove old listener before attaching new one
    if (this._clickHandler) {
      btn.removeEventListener('click', this._clickHandler);
    }
    this._clickHandler = () => {
      if (!this.hasAttribute('disabled')) {
        this.dispatchEvent(new Event('click', { bubbles: true }));
      }
    };
    btn.addEventListener('click', this._clickHandler);
  }

  _render() {
    const variant  = (this.getAttribute('variant') || 'primary').toLowerCase();
    const size     = (this.getAttribute('size')    || 'large').toLowerCase();
    const disabled = this.hasAttribute('disabled');
    const type     = this.getAttribute('type') || 'button';
    const s        = SIZE_MAP[size] ?? SIZE_MAP.large;

    // ── Color tokens from Figma ──────────────────────────────────────────────
    // Primary:   bg #26B67F  text white         hover: #1d8f64
    // Secondary: bg white    border/text #26b67c hover: bg #e7faf2
    // Tertiary:  bg transparent text #26b67c    hover: bg #F4F6F7
    // Disabled (all): bg #F4F6F7 (transparent for tertiary)  text #95A3B3

    let bg, textColor, border, hoverBg, hoverBorder;

    if (disabled) {
      bg        = variant === 'tertiary' ? 'transparent' : '#F4F6F7';
      textColor = '#95A3B3';
      border    = variant === 'secondary' ? '2px solid #95A3B3' : 'none';
      hoverBg   = bg; hoverBorder = border;
    } else if (variant === 'secondary') {
      bg = '#ffffff'; textColor = '#26b67c';
      border = '2px solid #26b67c';
      hoverBg = '#e7faf2'; hoverBorder = border;
    } else if (variant === 'tertiary') {
      bg = 'transparent'; textColor = '#26b67c';
      border = 'none';
      hoverBg = '#F4F6F7'; hoverBorder = 'none';
    } else {
      bg = '#26B67F'; textColor = '#ffffff';
      border = 'none';
      hoverBg = '#1d8f64'; hoverBorder = 'none';
    }

    this.shadowRoot.innerHTML = /* html */`
      <style>
        :host { display: inline-block; }

        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: ${s.fontSize};
          font-weight: 700;
          height: ${s.height};
          padding: ${s.padding};
          background: ${bg};
          color: ${textColor};
          border: ${border};
          border-radius: 8px;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          width: 100%;
          line-height: 1;
          transition: background 0.15s ease, box-shadow 0.15s ease;
          outline: none;
          white-space: nowrap;
        }

        button:hover:not(:disabled) {
          background: ${hoverBg};
          border: ${hoverBorder};
        }

        button:focus-visible {
          box-shadow: 0 0 0 3px rgba(38, 182, 127, 0.35);
        }

        button:active:not(:disabled) {
          transform: translateY(1px);
        }
      </style>
      <button type="${type}" ${disabled ? 'disabled' : ''}>
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('cl-button', DripButton);
export default DripButton;
