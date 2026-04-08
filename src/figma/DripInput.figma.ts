/**
 * Figma Code Connect — DripInput
 * Figma node: 103:11016  (Text Field)
 * Component:  <drip-input>
 */

import figma from '@figma/code-connect';

figma.connect(
  'https://www.figma.com/design/blhIivaTore7fjGoFDU8gx/?node-id=103-11016',
  {
    props: {
      label:       figma.string('Label'),
      placeholder: figma.string('Placeholder'),
      type: figma.enum('Type', {
        Text:     'text',
        Password: 'password',
        Email:    'email',
        Tel:      'tel',
      }),
      error:    figma.string('Error'),
      helper:   figma.string('Helper'),
      disabled: figma.boolean('Disabled'),
    },
    example: ({ label, placeholder, type, error, helper, disabled }) => figma.html`
      <drip-input
        label="${label}"
        placeholder="${placeholder}"
        type="${type}"
        ${error    ? `error="${error}"`   : ''}
        ${helper   ? `helper="${helper}"` : ''}
        ${disabled ? 'disabled'          : ''}
      ></drip-input>
    `,
  }
);
