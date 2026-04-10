/**
 * <cl-dropdown> — Drip Capital Dropdown Web Component
 * Source: Figma node 103:11076 (Dropdowns)
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

// ── SVG assets ────────────────────────────────────────────────────────────────
const chevronDown = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 7.5L10 12.5L15 7.5" stroke="#26B67F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const chevronUp = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 12.5L10 7.5L5 12.5" stroke="#26B67F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const closeIcon = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 2L8 8M8 2L2 8" stroke="#26B67F" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

class DripDropdown extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'placeholder', 'type', 'disabled', 'value', 'name'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State
    this._isOpen = false;
    this._selectedIndex = -1;
    this._selectedIndices = new Set(); // O(1) lookup
    this._searchValue = '';
    this._options = [];
    this._filteredOptions = [];

    // Stored handler references for proper cleanup — prevents listener accumulation
    this._closeHandler = null;
    this._triggerClickHandler = null;
    this._triggerKeyHandler = null;
    this._searchInputHandler = null;
    // Delegated handlers for stable container elements
    this._menuClickHandler = null;
    this._menuMouseoverHandler = null;
    this._menuMouseleaveHandler = null;
    this._tagsClickHandler = null;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  connectedCallback() {
    ensureFontLoaded();
    this._extractOptions();
    this._render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.shadowRoot.innerHTML) return;

    // Fine-grained updates avoid full Shadow DOM teardown for simple attribute changes
    if (name === 'disabled') {
      this._updateDisabledState();
    } else if (name === 'label') {
      this._updateLabel();
    } else {
      // type, placeholder, value, name require full re-render
      this._render();
    }
  }

  disconnectedCallback() {
    // Clean up global document listener to prevent memory leak
    if (this._closeHandler) {
      document.removeEventListener('click', this._closeHandler);
      this._closeHandler = null;
    }
  }

  // ── Fine-grained attribute updates ────────────────────────────────────────────

  _updateDisabledState() {
    const trigger = this.shadowRoot?.querySelector('.dropdown-trigger');
    const labelEl = this.shadowRoot?.querySelector('.label');
    const disabled = this.hasAttribute('disabled');
    if (!trigger) return;

    trigger.disabled = disabled;
    trigger.setAttribute('aria-disabled', String(disabled));
    trigger.style.cursor   = disabled ? 'not-allowed' : 'pointer';
    trigger.style.background = disabled ? '#F4F6F7' : '#ffffff';
    trigger.style.borderColor = disabled ? '#6F8298' : '#0A2E57';
    trigger.style.color    = disabled ? '#6F8298' : '';
    if (labelEl) labelEl.style.color = disabled ? '#6F8298' : '#0A2E57';
  }

  _updateLabel() {
    const labelEl = this.shadowRoot?.querySelector('.label');
    if (labelEl) labelEl.textContent = this.getAttribute('label') || '';
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  get value() {
    const type = this.getAttribute('type') || 'single';
    if (type === 'multi') {
      return [...this._selectedIndices]
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
      this._selectedIndices = new Set(
        this._options
          .map((opt, i) => (values.includes(opt.value) ? i : -1))
          .filter((i) => i >= 0)
      );
    } else {
      this._selectedIndex = this._options.findIndex((opt) => opt.value === v);
    }
    this.setAttribute('value', v);
    if (this.shadowRoot.innerHTML) this._render();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  /** Escape user-provided strings before injecting into innerHTML (XSS prevention) */
  _escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  _extractOptions() {
    this._options = Array.from(this.querySelectorAll('option')).map((o) => ({
      value: o.value || o.textContent.trim(),
      label: o.textContent.trim() || o.value,
    }));
    this._filteredOptions = [...this._options];
  }

  _filterOptions() {
    const q = this._searchValue.toLowerCase();
    this._filteredOptions = this._options.filter((o) =>
      o.label.toLowerCase().includes(q)
    );
  }

  _fireChangeEvent() {
    const type = this.getAttribute('type') || 'single';
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        detail: type === 'multi'
          ? { values: this.value.split(',').filter(Boolean) }
          : { value: this.value },
      })
    );
  }

  // ── Open / close ──────────────────────────────────────────────────────────────
  _toggleMenu() {
    this._isOpen ? this._closeMenu() : this._openMenu();
  }

  _openMenu() {
    this._isOpen = true;
    this._filteredOptions = [...this._options];
    this._searchValue = '';
    this._updateMenuVisibility();
    this.dispatchEvent(new CustomEvent('open', { bubbles: true }));
    setTimeout(() => this.shadowRoot?.querySelector('.search-input')?.focus(), 0);
  }

  _closeMenu() {
    this._isOpen = false;
    this._searchValue = '';
    this._updateMenuVisibility();
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  /** Lightweight open/close toggle — no full re-render */
  _updateMenuVisibility() {
    const trigger = this.shadowRoot?.querySelector('.dropdown-trigger');
    const menu    = this.shadowRoot?.querySelector('.dropdown-menu');
    const icon    = this.shadowRoot?.querySelector('.dropdown-icon');
    if (!trigger || !menu) return;

    if (this._isOpen) {
      trigger.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      menu.style.display = 'block';
      if (icon) icon.innerHTML = chevronUp;
    } else {
      trigger.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      menu.style.display = 'none';
      if (icon) icon.innerHTML = chevronDown;
    }

    this._renderMenuItems();
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────────
  _handleKeyboard(e) {
    switch (e.key) {
      case 'Enter':
        if (!this._isOpen) {
          this._openMenu();
        } else {
          this.shadowRoot?.querySelector('.menu-item.hover')?.click();
        }
        e.preventDefault();
        break;

      case 'Escape':
        this._closeMenu();
        e.preventDefault();
        break;

      case 'ArrowDown': {
        if (!this._isOpen) { this._openMenu(); e.preventDefault(); break; }
        const items = [...(this.shadowRoot?.querySelectorAll('.menu-item') || [])];
        // Guard: prevent % 0 → NaN when list is empty
        if (items.length === 0) { e.preventDefault(); break; }
        const current = items.findIndex((el) => el.classList.contains('hover'));
        items.forEach((el) => el.classList.remove('hover'));
        const next = items[(current + 1) % items.length];
        if (next) { next.classList.add('hover'); next.scrollIntoView({ block: 'nearest' }); }
        e.preventDefault();
        break;
      }

      case 'ArrowUp': {
        if (!this._isOpen) { this._openMenu(); e.preventDefault(); break; }
        const itemsUp = [...(this.shadowRoot?.querySelectorAll('.menu-item') || [])];
        // Guard: prevent % 0 → NaN when list is empty
        if (itemsUp.length === 0) { e.preventDefault(); break; }
        const curUp = itemsUp.findIndex((el) => el.classList.contains('hover'));
        itemsUp.forEach((el) => el.classList.remove('hover'));
        const prev = itemsUp[(curUp - 1 + itemsUp.length) % itemsUp.length];
        if (prev) { prev.classList.add('hover'); prev.scrollIntoView({ block: 'nearest' }); }
        e.preventDefault();
        break;
      }
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────────────
  _toggleSelection(index) {
    if (this._selectedIndices.has(index)) {
      this._selectedIndices.delete(index);
    } else {
      this._selectedIndices.add(index);
    }
  }

  _removeTag(index) {
    this._selectedIndices.delete(index);
    this._renderTags();
    this._renderMenuItems();
    this._fireChangeEvent();
  }

  // ── Tag pills (multi-select) — innerHTML only, no listener attachment ──────────
  _renderTags() {
    const tagsEl = this.shadowRoot?.querySelector('.tags-row');
    if (!tagsEl) return;

    if (this._selectedIndices.size === 0) {
      tagsEl.innerHTML = '';
      return;
    }

    tagsEl.innerHTML = [...this._selectedIndices]
      .map((i) => {
        const label = this._escapeHtml(this._options[i]?.label || '');
        return /* html */ `
          <span class="tag" data-index="${i}">
            <span class="tag-label">${label}</span>
            <button class="tag-remove" type="button" aria-label="Remove ${label}">${closeIcon}</button>
          </span>`;
      })
      .join('');
    // Clicks handled by delegated listener on .tags-row set up in _bindEvents()
  }

  // ── Menu items — innerHTML only, no listener attachment ───────────────────────
  _renderMenuItems() {
    const menuItems = this.shadowRoot?.querySelector('.menu-items');
    if (!menuItems) return;

    const type = this.getAttribute('type') || 'single';
    const opts = this._filteredOptions.length > 0 ? this._filteredOptions : this._options;

    menuItems.innerHTML = opts
      .map((opt) => {
        const globalIdx  = this._options.indexOf(opt);
        const isSelected = type === 'multi'
          ? this._selectedIndices.has(globalIdx)
          : globalIdx === this._selectedIndex;

        const safeValue = this._escapeHtml(opt.value);
        const safeLabel = this._escapeHtml(opt.label);

        const checkBox = type === 'multi'
          ? /* html */ `<span class="check-box ${isSelected ? 'checked' : ''}">
              ${isSelected
                ? `<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#26B67F" stroke-width="1.5"
                      stroke-linecap="round" stroke-linejoin="round"/>
                   </svg>`
                : ''}
            </span>`
          : '';

        return /* html */ `
          <div class="menu-item ${isSelected ? 'selected' : ''}"
               role="option"
               aria-selected="${isSelected}"
               data-value="${safeValue}">
            ${checkBox}
            <span class="menu-label">${safeLabel}</span>
          </div>`;
      })
      .join('');
    // Clicks and hover handled by delegated listeners on .menu-items set up in _bindEvents()
  }

  // ── Event binding — called once per render, uses stored refs for cleanup ───────
  _bindEvents() {
    const trigger          = this.shadowRoot?.querySelector('.dropdown-trigger');
    const searchInput      = this.shadowRoot?.querySelector('.search-input');
    const menuItemsContainer = this.shadowRoot?.querySelector('.menu-items');
    const tagsContainer    = this.shadowRoot?.querySelector('.tags-row');
    const disabled         = this.hasAttribute('disabled');
    const type             = this.getAttribute('type') || 'single';

    // ── Trigger click ──────────────────────────────────────────────────────────
    if (trigger && !disabled) {
      if (this._triggerClickHandler) {
        trigger.removeEventListener('click', this._triggerClickHandler);
      }
      this._triggerClickHandler = (e) => { e.stopPropagation(); this._toggleMenu(); };
      trigger.addEventListener('click', this._triggerClickHandler);

      // ── Keyboard navigation ────────────────────────────────────────────────
      if (this._triggerKeyHandler) {
        trigger.removeEventListener('keydown', this._triggerKeyHandler);
      }
      this._triggerKeyHandler = (e) => this._handleKeyboard(e);
      trigger.addEventListener('keydown', this._triggerKeyHandler);
    }

    // ── Search input ───────────────────────────────────────────────────────────
    if (searchInput) {
      if (this._searchInputHandler) {
        searchInput.removeEventListener('input', this._searchInputHandler);
      }
      this._searchInputHandler = (e) => {
        this._searchValue = e.target.value;
        this._filterOptions();
        this._renderMenuItems();
      };
      searchInput.addEventListener('input', this._searchInputHandler);
    }

    // ── Delegated listener on .menu-items (stable container) ──────────────────
    // Handles all click and hover events for dynamically re-rendered menu items
    // without re-attaching listeners on every render.
    if (menuItemsContainer) {
      if (this._menuClickHandler) {
        menuItemsContainer.removeEventListener('click', this._menuClickHandler);
      }
      if (this._menuMouseoverHandler) {
        menuItemsContainer.removeEventListener('mouseover', this._menuMouseoverHandler);
      }
      if (this._menuMouseleaveHandler) {
        menuItemsContainer.removeEventListener('mouseleave', this._menuMouseleaveHandler);
      }

      this._menuClickHandler = (e) => {
        const item = e.target.closest('.menu-item');
        if (!item) return;
        e.stopPropagation();

        const val    = item.getAttribute('data-value');
        const optIdx = this._options.findIndex((o) => o.value === val);

        if (type === 'multi') {
          this._toggleSelection(optIdx);
          this._renderTags();
          this._renderMenuItems();
          this._fireChangeEvent();
        } else {
          this._selectedIndex = optIdx;
          const triggerText = this.shadowRoot?.querySelector('.trigger-text');
          if (triggerText) triggerText.textContent = this._options[optIdx]?.label ?? '';
          this._closeMenu();
          this._fireChangeEvent();
        }
      };

      this._menuMouseoverHandler = (e) => {
        const item = e.target.closest('.menu-item');
        if (!item) return;
        menuItemsContainer.querySelectorAll('.menu-item').forEach((el) => el.classList.remove('hover'));
        item.classList.add('hover');
      };

      this._menuMouseleaveHandler = () => {
        menuItemsContainer.querySelectorAll('.menu-item').forEach((el) => el.classList.remove('hover'));
      };

      menuItemsContainer.addEventListener('click',      this._menuClickHandler);
      menuItemsContainer.addEventListener('mouseover',  this._menuMouseoverHandler);
      menuItemsContainer.addEventListener('mouseleave', this._menuMouseleaveHandler);
    }

    // ── Delegated listener on .tags-row (stable container) ────────────────────
    // Handles × button clicks for dynamically re-rendered tag pills.
    if (tagsContainer) {
      if (this._tagsClickHandler) {
        tagsContainer.removeEventListener('click', this._tagsClickHandler);
      }
      this._tagsClickHandler = (e) => {
        const btn = e.target.closest('.tag-remove');
        if (!btn) return;
        e.stopPropagation();
        this._removeTag(Number(btn.closest('.tag').dataset.index));
      };
      tagsContainer.addEventListener('click', this._tagsClickHandler);
    }

    // ── Global close-on-outside-click ─────────────────────────────────────────
    if (this._closeHandler) {
      document.removeEventListener('click', this._closeHandler);
    }
    this._closeHandler = (e) => {
      if (!this.contains(e.target) && this._isOpen) this._closeMenu();
    };
    document.addEventListener('click', this._closeHandler);
  }

  // ── Full render (called once on connect / non-trivial attribute change) ────────
  _render() {
    const label       = this._escapeHtml(this.getAttribute('label')       || '');
    const placeholder = this._escapeHtml(this.getAttribute('placeholder') || 'Select...');
    const type        = this.getAttribute('type') || 'single';
    const disabled    = this.hasAttribute('disabled');

    const triggerText = this._selectedIndex >= 0 && type !== 'multi'
      ? this._escapeHtml(this._options[this._selectedIndex]?.label || placeholder)
      : placeholder;
    const isPlaceholder = triggerText === placeholder;

    this.shadowRoot.innerHTML = /* html */ `
      <style>
        :host { display: block; font-family: 'Nunito Sans', sans-serif; }

        .field { display: flex; flex-direction: column; gap: 4px; width: 100%; }

        .label {
          font-size: 14px;
          font-weight: 400;
          color: ${disabled ? '#6F8298' : '#0A2E57'};
          line-height: 1;
        }

        /* ── Trigger ──────────────────────────────────────────────────────── */
        .dropdown-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: ${disabled ? '#F4F6F7' : '#ffffff'};
          border: 1px solid ${disabled ? '#6F8298' : '#0A2E57'};
          border-radius: 8px;
          height: 56px;
          padding: 0 16px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: ${disabled ? '#6F8298' : isPlaceholder ? '#95A3B3' : '#0A2E57'};
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
          text-align: left;
        }

        /* Open state — Noble Blue/200 (#6BA8EE) per Figma */
        .dropdown-trigger.open {
          border-color: #6BA8EE;
          box-shadow: 0 0 0 3px rgba(107, 168, 238, 0.2);
        }

        .dropdown-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Tags row (multi-select filled state) ─────────────────────────── */
        .tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #26B67F;
          border-radius: 12px;
          padding: 3px 8px 3px 10px;
          background: #ffffff;
        }

        .tag-label {
          font-size: 10px;
          font-weight: 400;
          color: #26B67F;
          white-space: nowrap;
        }

        .tag-remove {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          line-height: 0;
        }

        /* ── Dropdown menu ────────────────────────────────────────────────── */
        .dropdown-wrapper { position: relative; width: 100%; }

        .dropdown-menu {
          display: none;
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #DAE9FB;
          border-radius: 8px;
          box-shadow: 0px 6px 12px 0px rgba(10, 46, 87, 0.2);
          z-index: 1000;
          max-height: 320px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #6AB1E1 transparent;
        }

        .dropdown-menu::-webkit-scrollbar { width: 4px; }
        .dropdown-menu::-webkit-scrollbar-thumb {
          background: #6AB1E1;
          border-radius: 4px;
        }

        /* ── Search input (sibling to listbox, not inside it — ARIA-correct) ─ */
        .search-input {
          width: 100%;
          padding: 12px 16px;
          border: none;
          border-bottom: 1px solid #DAE9FB;
          outline: none;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px;
          color: #0A2E57;
          box-sizing: border-box;
        }
        .search-input::placeholder { color: #95A3B3; }

        /* ── Menu items ───────────────────────────────────────────────────── */
        .menu-items { display: flex; flex-direction: column; }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 24px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 400;
          color: #0A2E57;
          transition: background-color 0.1s ease, color 0.1s ease;
          outline: none;
        }

        /* Hover, keyboard-focus, and selected share the same highlight */
        .menu-item:hover,
        .menu-item.hover,
        .menu-item.selected {
          background-color: #ECF5FB;
          color: #1E9263;
        }

        /* ── Custom checkbox (multi-select) ───────────────────────────────── */
        .check-box {
          width: 16px;
          height: 16px;
          border: 1.5px solid #95A3B3;
          border-radius: 3px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
        }
        .check-box.checked { border-color: #26B67F; }
      </style>

      <div class="field">
        ${label ? `<label class="label">${label}</label>` : ''}

        <div class="dropdown-wrapper">
          <button
            class="dropdown-trigger ${this._isOpen ? 'open' : ''}"
            type="button"
            ${disabled ? 'disabled' : ''}
            aria-haspopup="listbox"
            aria-expanded="${this._isOpen}"
            aria-disabled="${disabled}"
          >
            <span class="trigger-text">${triggerText}</span>
            <span class="dropdown-icon">${this._isOpen ? chevronUp : chevronDown}</span>
          </button>

          <div class="dropdown-menu" style="display:${this._isOpen ? 'block' : 'none'}">
            ${type === 'search'
              ? `<input class="search-input" type="text" placeholder="Search..."
                   value="${this._escapeHtml(this._searchValue)}" aria-label="Search options" />`
              : ''}
            <div class="menu-items" role="listbox" aria-multiselectable="${type === 'multi'}"></div>
          </div>
        </div>

        ${type === 'multi' ? `<div class="tags-row" aria-label="Selected items"></div>` : ''}
      </div>
    `;

    this._bindEvents();
    this._renderMenuItems();
    if (type === 'multi') this._renderTags();
  }
}

customElements.define('cl-dropdown', DripDropdown);
export default DripDropdown;
