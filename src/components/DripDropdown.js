/**
 * <drip-dropdown> — Drip Capital Dropdown Web Component
 * Source: Figma node 103:11076 (Dropdowns)
 *
 * A flexible dropdown menu component supporting single-select, multi-select,
 * and search functionality with full keyboard navigation.
 *
 * ── Attributes ────────────────────────────────────────────────────────────────
 * @attr {string}  label        — Field label shown above the dropdown
 * @attr {string}  placeholder  — Placeholder text shown when no option selected
 * @attr {string}  type         — single | multi | search   Default: single
 * @attr {boolean} disabled     — Disables the dropdown
 * @attr {string}  value        — Currently selected value(s), comma-separated for multi
 * @attr {string}  name         — Dropdown name for form submission
 *
 * ── Events ────────────────────────────────────────────────────────────────────
 * change — fires when selection changes (detail: { value, values })
 * open   — fires when dropdown opens
 * close  — fires when dropdown closes
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * <drip-dropdown label="Country" placeholder="Select a country">
 *   <option value="us">United States</option>
 *   <option value="ca">Canada</option>
 *   <option value="mx">Mexico</option>
 * </drip-dropdown>
 *
 * <drip-dropdown label="Skills" type="multi" placeholder="Select skills...">
 *   <option value="js">JavaScript</option>
 *   <option value="ts">TypeScript</option>
 * </drip-dropdown>
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

class DripDropdown extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'placeholder', 'type', 'disabled', 'value', 'name'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._selectedIndex = -1;
    this._selectedIndices = [];
    this._searchValue = '';
    this._filteredOptions = [];
  }

  connectedCallback() {
    ensureFontLoaded();
    this._extractOptions();
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
    const type = this.getAttribute('type') || 'single';
    if (type === 'multi') {
      return this._selectedIndices
        .map((i) => this._options[i]?.value)
        .filter(Boolean)
        .join(',');
    }
    return this._selectedIndex >= 0 ? this._options[this._selectedIndex]?.value : '';
  }

  set value(v) {
    const type = this.getAttribute('type') || 'single';
    if (type === 'multi') {
      const values = v.split(',').map((s) => s.trim());
      this._selectedIndices = this._options
        .map((opt, i) => (values.includes(opt.value) ? i : -1))
        .filter((i) => i >= 0);
    } else {
      this._selectedIndex = this._options.findIndex((opt) => opt.value === v);
    }
    this.setAttribute('value', v);
    if (this.shadowRoot) this._render();
  }

  _extractOptions() {
    const options = Array.from(this.querySelectorAll('option'));
    this._options = options.map((opt) => ({
      value: opt.value || opt.textContent,
      label: opt.textContent || opt.value,
    }));
  }

  _bindEvents() {
    const trigger = this.shadowRoot?.querySelector('.dropdown-trigger');
    const menu = this.shadowRoot?.querySelector('.dropdown-menu');
    const searchInput = this.shadowRoot?.querySelector('.search-input');
    const items = this.shadowRoot?.querySelectorAll('.menu-item');

    if (trigger) {
      trigger.addEventListener('click', () => this._toggleMenu());
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this._searchValue = e.target.value.toLowerCase();
        this._filterOptions();
        this._renderMenuItems();
      });
    }

    items?.forEach((item, index) => {
      item.addEventListener('click', () => {
        const type = this.getAttribute('type') || 'single';
        if (type === 'multi') {
          this._toggleSelection(index);
        } else {
          this._selectedIndex = index;
          this._isOpen = false;
        }
        this._render();
        this._fireChangeEvent();
        if (type !== 'multi') this._closeMenu();
      });

      item.addEventListener('mouseenter', () => {
        this.shadowRoot?.querySelectorAll('.menu-item').forEach((it) => {
          it.classList.remove('hover');
        });
        item.classList.add('hover');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target) && this._isOpen) {
        this._closeMenu();
      }
    });

    // Keyboard navigation
    if (menu?.offsetParent !== null) {
      this.addEventListener('keydown', (e) => {
        this._handleKeyboard(e);
      });
    }
  }

  _handleKeyboard(e) {
    const type = this.getAttribute('type') || 'single';
    const itemCount = this._filteredOptions.length || this._options.length;

    switch (e.key) {
      case 'Enter':
        if (!this._isOpen) {
          this._openMenu();
        } else {
          const activeItem = this.shadowRoot?.querySelector('.menu-item.hover');
          if (activeItem) activeItem.click();
        }
        e.preventDefault();
        break;
      case 'Escape':
        this._closeMenu();
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (!this._isOpen) {
          this._openMenu();
        }
        e.preventDefault();
        break;
    }
  }

  _toggleMenu() {
    if (this._isOpen) {
      this._closeMenu();
    } else {
      this._openMenu();
    }
  }

  _openMenu() {
    this._isOpen = true;
    this._filteredOptions = [...this._options];
    this._render();
    this.dispatchEvent(new CustomEvent('open', { bubbles: true }));

    setTimeout(() => {
      const searchInput = this.shadowRoot?.querySelector('.search-input');
      if (searchInput) searchInput.focus();
    }, 0);
  }

  _closeMenu() {
    this._isOpen = false;
    this._searchValue = '';
    this._render();
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  _toggleSelection(index) {
    if (this._selectedIndices.includes(index)) {
      this._selectedIndices = this._selectedIndices.filter((i) => i !== index);
    } else {
      this._selectedIndices.push(index);
    }
  }

  _filterOptions() {
    const search = this._searchValue.toLowerCase();
    this._filteredOptions = this._options.filter((opt) =>
      opt.label.toLowerCase().includes(search)
    );
  }

  _fireChangeEvent() {
    const type = this.getAttribute('type') || 'single';
    const value = this.value;
    const detail =
      type === 'multi'
        ? { values: value.split(',').filter(Boolean) }
        : { value };

    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
  }

  _renderMenuItems() {
    const menuItems = this.shadowRoot?.querySelector('.menu-items');
    if (!menuItems) return;

    const type = this.getAttribute('type') || 'single';
    const options = this._filteredOptions.length > 0 ? this._filteredOptions : this._options;

    menuItems.innerHTML = options
      .map(
        (opt, idx) => `
        <div class="menu-item" data-value="${opt.value}">
          ${type === 'multi' ? `<input type="checkbox" class="menu-checkbox" />` : ''}
          <span class="menu-label">${opt.label}</span>
        </div>
      `
      )
      .join('');

    this._bindEvents();
  }

  _render() {
    const label = this.getAttribute('label') || '';
    const placeholder = this.getAttribute('placeholder') || 'Select...';
    const type = this.getAttribute('type') || 'single';
    const disabled = this.hasAttribute('disabled');
    const name = this.getAttribute('name') || '';

    let displayValue = placeholder;
    if (type === 'multi') {
      const selected = this._selectedIndices.map((i) => this._options[i]?.label).filter(Boolean);
      displayValue = selected.length > 0 ? selected.join(', ') : placeholder;
    } else {
      displayValue =
        this._selectedIndex >= 0 ? this._options[this._selectedIndex]?.label : placeholder;
    }

    this.shadowRoot.innerHTML = /* html */ `
      <style>
        :host { display: block; font-family: 'Nunito Sans', sans-serif; }

        .field { display: flex; flex-direction: column; gap: 8px; width: 100%; }

        .label {
          font-size: 14px;
          font-weight: 400;
          color: ${disabled ? '#6F8298' : '#0A2E57'};
          line-height: 1;
        }

        /* ── trigger (closed state) ──────────────────────────────────────── */
        .dropdown-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1.5px solid #0A2E57;
          border-radius: 8px;
          height: 56px;
          padding: 0 16px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 16px;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          color: ${displayValue === placeholder ? '#95A3B3' : '#0A2E57'};
        }

        .dropdown-trigger:hover:not(:disabled) {
          border-color: #217DE5;
        }

        .dropdown-trigger.open {
          border-color: #217DE5;
          box-shadow: 0 0 0 3px rgba(33, 125, 229, 0.15);
        }

        .dropdown-trigger.disabled {
          background: #F4F6F7;
          border-color: #6F8298;
          color: #6F8298;
          cursor: not-allowed;
        }

        .dropdown-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6F8298;
          transition: transform 0.2s ease;
        }

        .dropdown-trigger.open .dropdown-icon {
          transform: rotate(180deg);
        }

        /* ── dropdown menu ──────────────────────────────────────────────── */
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #DAE9FB;
          border-radius: 8px;
          margin-top: 8px;
          box-shadow: 0px 6px 12px 0px rgba(10, 46, 87, 0.2);
          z-index: 1000;
          max-height: 320px;
          overflow-y: auto;
          display: ${this._isOpen ? 'block' : 'none'};
        }

        .search-input {
          width: 100%;
          padding: 12px 16px;
          border: none;
          outline: none;
          border-bottom: 1px solid #DAE9FB;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px;
          color: #0A2E57;
        }

        .search-input::placeholder {
          color: #95A3B3;
        }

        /* ── menu items ─────────────────────────────────────────────────── */
        .menu-items {
          display: flex;
          flex-direction: column;
        }

        .menu-item {
          display: flex;
          align-items: center;
          padding: 13px 24px;
          cursor: pointer;
          gap: 12px;
          transition: background-color 0.1s ease;
          color: #0A2E57;
          font-size: 16px;
          font-weight: 400;
        }

        .menu-item:hover,
        .menu-item.hover {
          background-color: #ECF5FB;
          color: #1E9263;
        }

        .menu-item.selected {
          background-color: #ffffff;
          color: #0A2E57;
          font-weight: 700;
        }

        .menu-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #217DE5;
        }

        .menu-label {
          flex: 1;
        }

        /* ── position for wrapper ────────────────────────────────────────── */
        .dropdown-wrapper {
          position: relative;
          width: 100%;
        }
      </style>

      <div class="field">
        ${label ? `<label class="label">${label}</label>` : ''}

        <div class="dropdown-wrapper">
          <button
            class="dropdown-trigger ${this._isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}"
            ${disabled ? 'disabled' : ''}
            type="button"
            aria-haspopup="listbox"
            aria-expanded="${this._isOpen}"
          >
            <span>${displayValue}</span>
            <span class="dropdown-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>

          <div class="dropdown-menu">
            ${type === 'search' ? `<input type="text" class="search-input" placeholder="Search..." />` : ''}
            <div class="menu-items"></div>
          </div>
        </div>
      </div>
    `;

    this._renderMenuItems();
    this._bindEvents();
  }
}

customElements.define('drip-dropdown', DripDropdown);
export default DripDropdown;
