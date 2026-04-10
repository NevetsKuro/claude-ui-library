/**
 * <drip-input> — Drip Capital Text Field Web Component
 * Source: Figma node 103:11016 (Text Field)
 *
 * ── Attributes ────────────────────────────────────────────────────────────────
 * @attr {string}  label        — Field label shown above the input
 * @attr {string}  placeholder  — Placeholder text
 * @attr {string}  type         — text | password | email | tel   Default: text
 * @attr {string}  name         — Input name for form submission
 * @attr {string}  value        — Current value
 * @attr {boolean} disabled     — Disables the field
 * @attr {string}  error        — Error message shown below (triggers error state)
 * @attr {string}  helper       — Helper text shown below field
 *
 * ── Events ────────────────────────────────────────────────────────────────────
 * change — fires when value changes (detail: { value })
 * input  — fires on each keystroke (detail: { value })
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * <drip-input label="Email" placeholder="you@company.com" type="email"></drip-input>
 * <drip-input label="Password" type="password" name="password"></drip-input>
 * <drip-input label="Email" error="Invalid email address"></drip-input>
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

class DripInput extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'placeholder', 'type', 'name', 'value', 'disabled', 'error', 'helper'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._focused = false;
  }

  connectedCallback() {
    ensureFontLoaded();
    this._render();
    this._bindEvents();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this._render();
      this._bindEvents();
    }
  }

  get value() {
    return this.shadowRoot?.querySelector('input')?.value ?? this.getAttribute('value') ?? '';
  }

  set value(v) {
    const input = this.shadowRoot?.querySelector('input');
    if (input) input.value = v;
    this.setAttribute('value', v);
  }

  _bindEvents() {
    const input = this.shadowRoot?.querySelector('input');
    if (!input) return;

    input.addEventListener('focus', () => {
      this._focused = true;
      this._updateState();
    });
    input.addEventListener('blur', () => {
      this._focused = false;
      this._updateState();
    });
    input.addEventListener('input', (e) => {
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: { value: e.target.value } }));
    });
    input.addEventListener('change', (e) => {
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: e.target.value } }));
    });
  }

  _updateState() {
    const wrap = this.shadowRoot?.querySelector('.input-wrap');
    if (!wrap) return;
    const disabled = this.hasAttribute('disabled');
    const error    = this.getAttribute('error');

    wrap.className = 'input-wrap' +
      (disabled        ? ' disabled' :
       error           ? ' error' :
       this._focused   ? ' active' : '');
  }

  _render() {
    const label       = this.getAttribute('label')       || '';
    const placeholder = this.getAttribute('placeholder') || '';
    const type        = this.getAttribute('type')        || 'text';
    const name        = this.getAttribute('name')        || '';
    const value       = this.getAttribute('value')       || '';
    const disabled    = this.hasAttribute('disabled');
    const error       = this.getAttribute('error')       || '';
    const helper      = this.getAttribute('helper')      || '';

    this.shadowRoot.innerHTML = /* html */`
      <style>
        :host { display: block; font-family: 'Nunito Sans', sans-serif; }

        .field { display: flex; flex-direction: column; gap: 4px; width: 100%; }

        .label {
          font-size: 14px;
          font-weight: 400;
          color: ${disabled ? '#6F8298' : '#0A2E57'};
          line-height: 1;
        }

        /* ── wrapper carries state ───────────────────────────────────────── */
        .input-wrap {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1.5px solid #0A2E57;
          border-radius: 8px;
          height: 56px;
          padding: 0 16px;
          gap: 8px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .input-wrap.active {
          border-color: #217DE5;
          box-shadow: 0 0 0 3px rgba(33, 125, 229, 0.15);
        }
        .input-wrap.disabled {
          background: #F4F6F7;
          border-color: #6F8298;
          cursor: not-allowed;
        }
        .input-wrap.error {
          border-color: #CC6340;
        }

        input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #0A2E57;
          line-height: 1;
          min-width: 0;
        }
        input::placeholder { color: #95A3B3; }
        input:disabled     { color: #6F8298; cursor: not-allowed; }

        /* ── toggle icon for password ────────────────────────────────────── */
        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          color: #6F8298;
          flex-shrink: 0;
        }
        .toggle-btn svg { width: 20px; height: 20px; }

        /* ── help / error text ───────────────────────────────────────────── */
        .sub-text {
          font-size: 12px;
          line-height: 1.4;
          margin-top: 2px;
        }
        .sub-text.error-text { color: #CC6340; }
        .sub-text.helper-text { color: #6F8298; }
      </style>

      <div class="field">
        ${label ? `<label class="label">${label}</label>` : ''}

        <div class="input-wrap ${disabled ? 'disabled' : error ? 'error' : ''}">
          <input
            type="${type}"
            name="${name}"
            value="${value}"
            placeholder="${placeholder}"
            ${disabled ? 'disabled' : ''}
            part="input"
          />
          ${type === 'password' ? `
            <button class="toggle-btn" type="button" aria-label="Toggle password visibility">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          ` : ''}
        </div>

        ${error  ? `<span class="sub-text error-text">${error}</span>`   : ''}
        ${helper ? `<span class="sub-text helper-text">${helper}</span>` : ''}
      </div>
    `;

    // Password toggle
    const toggleBtn = this.shadowRoot.querySelector('.toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const inp = this.shadowRoot.querySelector('input');
        inp.type = inp.type === 'password' ? 'text' : 'password';
        toggleBtn.querySelector('circle').style.display =
          inp.type === 'text' ? 'none' : '';
      });
    }

    this._bindEvents();
  }
}

customElements.define('cl-input', DripInput);
export default DripInput;
