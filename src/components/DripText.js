/**
 * <drip-text> — Drip Capital Typography Web Component
 *
 * A zero-dependency, framework-agnostic custom element that renders any
 * text style from the Drip Capital typography design system.
 *
 * Font sizes switch automatically at the 768px breakpoint via CSS custom
 * properties defined in typography.css — no `mobile` attribute needed.
 *
 * ── Attributes ────────────────────────────────────────────────────────────────
 * @attr {string} variant — Typography style to apply.
 *                          One of: h1 | h2 | h3 | h4 | caption |
 *                                  body | label | body-small | validation
 *                          Default: body
 *
 * @attr {string} weight  — Font weight override: regular | bold
 *                          If omitted, the variant's default weight is used.
 *
 * @attr {string} as      — HTML tag to render the slot inside.
 *                          Default is derived from variant (h1–h4, p, span).
 *
 * @attr {string} color   — CSS color override (any valid CSS value).
 *                          Overrides the variant's default color token.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * <script type="module" src="DripText.js"></script>
 *
 * <drip-text variant="h1">The seamless trade platform</drip-text>
 * <drip-text variant="h2" weight="regular">Solution to your cashflow needs</drip-text>
 * <drip-text variant="body" weight="bold">of clean aesthetic design</drip-text>
 * <drip-text variant="caption">Developed with precision</drip-text>
 * <drip-text variant="validation" weight="regular">to global trade finance</drip-text>
 */

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&display=swap';

/**
 * Map variant → { tag, CSS size token, default weight, CSS color token }
 * Sizes are CSS custom properties from typography.css so @media overrides
 * flow in automatically — no JavaScript breakpoint logic needed.
 */
const VARIANT_MAP = {
  h1:           { tag: 'h1',    sizeVar: '--text-h1-size',         colorVar: '--text-h1-color',         weight: 'bold'    },
  h2:           { tag: 'h2',    sizeVar: '--text-h2-size',         colorVar: '--text-h2-color',         weight: 'regular' },
  h3:           { tag: 'h3',    sizeVar: '--text-h3-size',         colorVar: '--text-h3-color',         weight: 'regular' },
  h4:           { tag: 'h4',    sizeVar: '--text-h4-size',         colorVar: '--text-h4-color',         weight: 'regular' },
  caption:      { tag: 'p',     sizeVar: '--text-caption-size',    colorVar: '--text-caption-color',    weight: 'bold'    },
  body:         { tag: 'p',     sizeVar: '--text-body-size',       colorVar: '--text-body-color',       weight: 'regular' },
  label:        { tag: 'span',  sizeVar: '--text-label-size',      colorVar: '--text-label-color',      weight: 'regular' },
  'body-small': { tag: 'small', sizeVar: '--text-body-small-size', colorVar: '--text-body-small-color', weight: 'regular' },
  validation:   { tag: 'span',  sizeVar: '--text-validation-size', colorVar: '--text-validation-color', weight: 'regular' },
};

const WEIGHT_VALUES = { regular: 400, bold: 700 };

/** Inject the Google Fonts stylesheet into <head> once. */
function ensureFontLoaded() {
  if (document.head.querySelector('link[data-drip-font]')) return;
  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = FONT_URL;
  link.setAttribute('data-drip-font', '');
  document.head.appendChild(link);
}

class DripText extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'weight', 'as', 'color'];
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
    const variantKey = (this.getAttribute('variant') || 'body').toLowerCase();
    const config     = VARIANT_MAP[variantKey] ?? VARIANT_MAP['body'];

    const weightAttr = this.getAttribute('weight')?.toLowerCase();
    const colorAttr  = this.getAttribute('color');
    const tag        = this.getAttribute('as') ?? config.tag;
    const fontWeight = WEIGHT_VALUES[weightAttr] ?? WEIGHT_VALUES[config.weight];

    // If a color override is passed use it directly, otherwise inherit
    // the CSS custom property from the host document (including any
    // @media overrides defined in typography.css).
    const colorStyle = colorAttr
      ? `color: ${colorAttr};`
      : `color: var(${config.colorVar});`;

    this.shadowRoot.innerHTML = /* html */ `
      <style>
        :host {
          display: contents;
        }
        .drip-text {
          font-family: 'Nunito Sans', sans-serif;
          /*
           * font-size reads the CSS custom property from the host document.
           * typography.css redefines these tokens inside @media (max-width: 767px)
           * so the size switches automatically at the breakpoint — no JS needed.
           */
          font-size: var(${config.sizeVar});
          font-weight: ${fontWeight};
          line-height: 1;
          ${colorStyle}
          margin: 0;
          padding: 0;
        }
      </style>
      <${tag} class="drip-text" part="text">
        <slot></slot>
      </${tag}>
    `;
  }
}

customElements.define('drip-text', DripText);

export default DripText;
