/**
 * Figma Code Connect — DripAlert
 * Figma node: 104:1231  (Alert)
 * Component:  <drip-alert>
 */

import figma from '@figma/code-connect';

figma.connect(
  'https://www.figma.com/design/blhIivaTore7fjGoFDU8gx/?node-id=104-1231',
  {
    props: {
      variant: figma.enum('Variant', {
        Success: 'success',
        Warning: 'warning',
        Error:   'error',
        Info:    'info',
      }),
      size: figma.enum('Size', {
        Small: 'small',
        Large: 'large',
      }),
      title:       figma.string('Title'),
      message:     figma.string('Message'),
      dismissible: figma.boolean('Dismissible'),
    },
    example: ({ variant, size, title, message, dismissible }) => figma.html`
      <drip-alert
        variant="${variant}"
        size="${size}"
        title="${title}"
        ${message     ? `message="${message}"` : ''}
        ${dismissible ? 'dismissible'          : ''}
      ></drip-alert>
    `,
  }
);
