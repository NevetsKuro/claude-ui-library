# claude-ui-library

A reusable UI component library built with native Web Components — framework-agnostic, lightweight, and easy to integrate into any project.

---

## What are Web Components?

Web Components are a set of browser-native APIs that let you define custom, reusable HTML elements with encapsulated logic and styles. They work in any framework (React, Vue, Angular) or plain HTML without dependencies.

The three core APIs are:

| API | Purpose |
|-----|---------|
| **Custom Elements** | Define new HTML tags with custom behaviour |
| **Shadow DOM** | Encapsulate styles and markup inside the element |
| **HTML Templates** | Declare inert, reusable markup with `<template>` |

---

## Getting Started

### Installation

```bash
npm install claude-ui-library
```

### Usage

Import the library once in your entry point:

```js
import 'claude-ui-library';
```

Then use the components anywhere in your HTML:

```html
<cl-button variant="primary">Click me</cl-button>
<cl-card title="Hello">Card content goes here.</cl-card>
```

No build step or framework required — components register themselves as custom elements on import.

---

## Building a Component

Each component follows the same pattern: extend `HTMLElement`, define a Shadow DOM, and register the tag.

```js
// src/components/cl-button.js

class ClButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'disabled'];
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this.render();
  }

  render() {
    const variant = this.getAttribute('variant') ?? 'default';
    const disabled = this.hasAttribute('disabled');

    this.shadowRoot.innerHTML = `
      <style>
        button {
          padding: 0.5rem 1.25rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          background: ${variant === 'primary' ? '#0057ff' : '#e0e0e0'};
          color: ${variant === 'primary' ? '#fff' : '#333'};
          opacity: ${disabled ? '0.5' : '1'};
          pointer-events: ${disabled ? 'none' : 'auto'};
        }
      </style>
      <button ?disabled="${disabled}">
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('cl-button', ClButton);
```

### Key Concepts

- **`connectedCallback`** — runs when the element is added to the DOM. Use it to set up your Shadow DOM.
- **`observedAttributes` + `attributeChangedCallback`** — react to attribute changes the same way props work in frameworks.
- **`<slot>`** — project light DOM content (children) into your component's template.
- **`mode: 'open'`** — makes the shadow root accessible via `element.shadowRoot` for testing.

---

## Project Structure

```
src/
  components/
    cl-button.js
    cl-card.js
    cl-input.js
  index.js          # re-exports all components
dist/               # built output
```

`index.js` simply imports every component so consumers get everything in one import:

```js
import './components/cl-button.js';
import './components/cl-card.js';
import './components/cl-input.js';
```

---

## Framework Integration

Web Components drop into any framework without wrappers.

**React**
```jsx
import 'claude-ui-library';

export default function App() {
  return <cl-button variant="primary">Save</cl-button>;
}
```

**Vue**
```vue
<template>
  <cl-button variant="primary">Save</cl-button>
</template>

<script setup>
import 'claude-ui-library';
</script>
```

**Plain HTML**
```html
<script type="module" src="node_modules/claude-ui-library/dist/index.js"></script>
<cl-button variant="primary">Save</cl-button>
```

---

## Contributing

1. Fork the repo and create a feature branch.
2. Add your component under `src/components/`.
3. Register it in `src/index.js`.
4. Open a PR — component name must be prefixed with `cl-`.

---

## License

MIT
