// url=https://www.figma.com/design/blhIivaTore7fjGoFDU8gx/Drip-Capital---Final-Handoff---Local?node-id=103-10896
// source=src/components/DripText.js
// component=drip-text
//
// Drip Capital — Typography Web Component Code Connect
// Maps Figma Typography variants → <drip-text> web component usage snippets.

const figma = require('figma')
const instance = figma.selectedInstance

// ── Extract Figma properties ────────────────────────────────────────────────

/** Which typographic role is selected in Figma */
const variant = instance.getEnum('Variant', {
  'Heading 1':   'h1',
  'Heading 2':   'h2',
  'Heading 3':   'h3',
  'Heading 4':   'h4',
  'Caption':     'caption',
  'Body':        'body',
  'Label':       'label',
  'Body Small':  'body-small',
  'Validation':  'validation',
})

/** Font weight toggle exposed in Figma (Regular / Bold) */
const weight = instance.getEnum('Weight', {
  'Regular': 'regular',
  'Bold':    'bold',
})

/** Text content from the specimen layer */
const textContent = instance.getString('Text') || 'Your text here'

// ── Build the HTML snippet ──────────────────────────────────────────────────

export default {
  example: figma.html`
    <drip-text
      variant="${variant}"
      weight="${weight}"
    >${textContent}</drip-text>
  `,

  imports: [
    `<!-- Load once in your HTML -->`,
    `<script type="module" src="path/to/DripText.js"></script>`,
  ],

  id: 'drip-text',

  metadata: {
    nestable: false,
    props: {
      variant,
      weight,
    },
  },
}
