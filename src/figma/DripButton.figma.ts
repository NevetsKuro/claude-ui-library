/**
 * Figma Code Connect — DripButton
 * Figma node: 103:10976  (Primary Button / Secondary Button)
 * Component:  <drip-button>
 */

import figma from '@figma/code-connect';

figma.connect(
  'https://www.figma.com/design/blhIivaTore7fjGoFDU8gx/?node-id=103-10976',
  {
    props: {
      variant: figma.enum('Variant', {
        Primary:   'primary',
        Secondary: 'secondary',
      }),
      size: figma.enum('Size', {
        Large:  'large',
        Medium: 'medium',
        Small:  'small',
      }),
      disabled: figma.boolean('Disabled'),
      label:    figma.string('Label'),
    },
    example: ({ variant, size, disabled, label }) => figma.html`
      <drip-button
        variant="${variant}"
        size="${size}"
        ${disabled ? 'disabled' : ''}
      >${label}</drip-button>
    `,
  }
);
