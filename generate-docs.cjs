const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, Header, Footer, ExternalHyperlink, PageBreak
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Colours ──────────────────────────────────────────────────────────────────
const NOBLE_BLUE   = '0A2E57';
const GREEN_LIGHT  = 'CFF5E6';
const GREY_BG      = 'F5F7FA';
const CODE_BG      = '1E293B';
const CODE_FG      = 'E2E8F0';
const WHITE        = 'FFFFFF';
const BORDER_COLOR = 'D0DBE8';

const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// ── Helpers ───────────────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, color: NOBLE_BLUE, size: 40, font: 'Nunito Sans' })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, color: NOBLE_BLUE, size: 32, font: 'Nunito Sans' })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, color: NOBLE_BLUE, size: 26, font: 'Nunito Sans' })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, size: 22, font: 'Nunito Sans', ...opts })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 360 + level * 360, hanging: 260 },
    children: [
      new TextRun({ text: level === 0 ? '▸  ' : '–  ', color: NOBLE_BLUE, size: 22, font: 'Nunito Sans' }),
      new TextRun({ text, size: 22, font: 'Nunito Sans' }),
    ],
  });
}

function codeBlock(lines) {
  const rows = lines.map(line =>
    new TableRow({
      children: [new TableCell({
        borders: noBorders,
        shading: { fill: '1E293B', type: ShadingType.CLEAR },
        margins: { top: 40, bottom: 40, left: 200, right: 200 },
        width: { size: 9360, type: WidthType.DXA },
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18, color: 'A5F3C4' })],
        })],
      })],
    })
  );
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows,
  });
}

function infoBox(text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: '6BA8EE' },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: '6BA8EE' },
          left: { style: BorderStyle.SINGLE, size: 8, color: '6BA8EE' },
          right: { style: BorderStyle.SINGLE, size: 2, color: '6BA8EE' },
        },
        shading: { fill: 'EEF4FC', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        children: [new Paragraph({
          children: [new TextRun({ text, size: 20, font: 'Nunito Sans', color: '1E3A5F' })],
        })],
      })],
    })],
  });
}

function spacer(pts = 1) {
  return new Paragraph({ spacing: { before: pts * 20, after: 0 }, children: [new TextRun('')] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN_LIGHT } },
    children: [new TextRun('')],
  });
}

function stepTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1200, 8160],
    rows: rows.map(([step, desc]) => new TableRow({
      children: [
        new TableCell({
          borders,
          shading: { fill: GREEN_LIGHT, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          width: { size: 1200, type: WidthType.DXA },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: step, bold: true, color: NOBLE_BLUE, size: 22, font: 'Nunito Sans' })],
          })],
        }),
        new TableCell({
          borders,
          margins: { top: 80, bottom: 80, left: 160, right: 120 },
          width: { size: 8160, type: WidthType.DXA },
          children: [new Paragraph({
            children: [new TextRun({ text: desc, size: 21, font: 'Nunito Sans' })],
          })],
        }),
      ],
    })),
  });
}

function fileTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3600, 5760],
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders, shading: { fill: NOBLE_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3600, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: 'File', bold: true, color: WHITE, size: 22, font: 'Nunito Sans' })] })] }),
          new TableCell({ borders, shading: { fill: NOBLE_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 5760, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: 'Purpose', bold: true, color: WHITE, size: 22, font: 'Nunito Sans' })] })] }),
        ],
      }),
      ...rows.map(([file, purpose], i) => new TableRow({
        children: [
          new TableCell({ borders, shading: { fill: i % 2 === 0 ? GREY_BG : WHITE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3600, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: file, font: 'Courier New', size: 19, color: '1E3A5F' })] })] }),
          new TableCell({ borders, shading: { fill: i % 2 === 0 ? GREY_BG : WHITE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 5760, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: purpose, size: 21, font: 'Nunito Sans' })] })] }),
        ],
      })),
    ],
  });
}

// ── Document ──────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Nunito Sans', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 40, bold: true, font: 'Nunito Sans', color: NOBLE_BLUE },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Nunito Sans', color: NOBLE_BLUE },
        paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Nunito Sans', color: NOBLE_BLUE },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN_LIGHT } },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Drip Capital — Typography Design System', bold: true, color: NOBLE_BLUE, size: 20, font: 'Nunito Sans' }),
            new TextRun({ text: '   |   Session Build Documentation', color: '888888', size: 20, font: 'Nunito Sans' }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREEN_LIGHT } },
          spacing: { before: 120 },
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: 'Page ', size: 18, font: 'Nunito Sans', color: '888888' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Nunito Sans', color: '888888' }),
            new TextRun({ text: ' of ', size: 18, font: 'Nunito Sans', color: '888888' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: 'Nunito Sans', color: '888888' }),
          ],
        })],
      }),
    },
    children: [

      // ── COVER ──────────────────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 400, after: 0 },
        children: [new TextRun({ text: 'Drip Capital', bold: true, color: NOBLE_BLUE, size: 72, font: 'Nunito Sans' })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: 'Typography Design System', color: '444444', size: 48, font: 'Nunito Sans' })],
      }),
      spacer(20),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GREEN_LIGHT } },
        children: [new TextRun('')],
      }),
      spacer(20),
      new Paragraph({
        children: [new TextRun({ text: 'Session Build Documentation', bold: true, color: '555555', size: 28, font: 'Nunito Sans' })],
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Figma → Web Component → Local Dev Server', color: '888888', size: 24, font: 'Nunito Sans' })],
      }),
      spacer(20),
      new Paragraph({
        children: [new TextRun({ text: 'Date: April 8, 2026   |   Source: Figma node 103:10896', color: '888888', size: 20, font: 'Nunito Sans' })],
      }),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // ── 1. OVERVIEW ────────────────────────────────────────────────────────
      h1('1. Overview'),
      divider(),
      body('This document records every step taken to build a working local typography design system from a Figma source file. The output is a zero-dependency web component (<drip-text>) that can be embedded in any HTML, Vue, or React project, together with CSS design tokens that drive fully responsive font sizes via media queries — no JavaScript prop required.'),
      spacer(10),
      infoBox('Source Figma file: blhIivaTore7fjGoFDU8gx  |  Node: 103:10896  |  File: Drip Capital — Final Handoff — Local'),
      spacer(10),

      h2('1.1 Goals'),
      bullet('Extract typography tokens (font sizes, weights, colours) directly from Figma.'),
      bullet('Build a reusable <drip-text> web component with zero framework dependencies.'),
      bullet('Make font sizes responsive via CSS @media — not via a prop.'),
      bullet('Wire a Figma Code Connect (.figma.js) template for Dev Mode snippets.'),
      bullet('Serve the result on a local dev server with a live preview.'),

      spacer(10),
      h2('1.2 Final Project Structure'),
      fileTable([
        ['src/tokens/typography.css',     'CSS custom properties + @media breakpoint for responsive sizes'],
        ['src/components/DripText.js',     '<drip-text> custom element (ES module, Shadow DOM)'],
        ['src/figma/DripText.figma.js',    'Parserless Figma Code Connect template (.figma.js)'],
        ['index.html',                     'Demo page showing all type styles in a live table'],
        ['server.cjs',                     'Minimal Node.js HTTP server for local preview'],
        ['package.json',                   'Project manifest (type: module, exports)'],
        ['.claude/launch.json',            'Preview server config for Claude Code'],
      ]),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // ── 2. PREREQUISITES ───────────────────────────────────────────────────
      h1('2. Prerequisites & Tools'),
      divider(),

      h2('2.1 MCP Servers Required'),
      stepTable([
        ['figma-remote-mcp', 'Official Figma MCP server. Provides get_design_context, get_screenshot, get_metadata, generate_diagram, get_code_connect_suggestions, get_context_for_code_connect, and whoami tools.'],
        ['Claude Preview',   'Manages local dev server lifecycle (preview_start, preview_screenshot, preview_snapshot). Requires a .claude/launch.json in the workspace root.'],
      ]),
      spacer(10),
      infoBox('Verify both MCP servers are connected in Claude Code before starting. Use the figma-remote-mcp whoami tool to confirm authentication.'),

      spacer(10),
      h2('2.2 Local Software'),
      bullet('Node.js v23+ at /usr/local/bin/node'),
      bullet('npm (comes with Node) — used to install the docx package globally'),
      bullet('npx serve — used for local static file serving (optional; replaced by server.cjs in this session)'),

      spacer(10),
      h2('2.3 Figma Plan Requirements'),
      bullet('Organization or Enterprise plan — required for Code Connect Dev Mode features.'),
      bullet('Components must be published to a team library for Code Connect suggestions.'),
      bullet('The URL must contain a node-id parameter pointing to a published component.'),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // ── 3. STEP-BY-STEP ────────────────────────────────────────────────────
      h1('3. Step-by-Step Build Log'),
      divider(),

      // STEP 1
      h2('Step 1 — Verify Figma Connection'),
      body('Before doing any design work, confirm the Figma MCP server is authenticated.'),
      spacer(6),
      body('Tool called:', { bold: true }),
      codeBlock(['mcp__figma-remote-mcp__whoami()']),
      spacer(6),
      body('Expected response includes the authenticated user email, display name, and active Figma plans. In this session the authenticated account was steven.fernandes@dripcapital.com with a Full / Expert seat on the Drip Capital organisation plan.'),

      spacer(10),
      // STEP 2
      h2('Step 2 — Fetch Typography Design Context'),
      body('The Figma URL provided was:'),
      codeBlock(['https://www.figma.com/design/blhIivaTore7fjGoFDU8gx/Drip-Capital---Final-Handoff---Local?node-id=103-10896&m=dev']),
      spacer(6),
      body('Parse the URL to extract:'),
      bullet('fileKey:  blhIivaTore7fjGoFDU8gx'),
      bullet('nodeId:   103-10896  →  convert hyphens to colons  →  103:10896'),
      spacer(6),
      body('Tools called in parallel:', { bold: true }),
      codeBlock([
        'mcp__figma-remote-mcp__get_design_context(',
        '  fileKey: "blhIivaTore7fjGoFDU8gx",',
        '  nodeId:  "103:10896",',
        '  clientFrameworks: "unknown",',
        '  clientLanguages:  "unknown"',
        ')',
        '',
        'mcp__figma-remote-mcp__get_screenshot(',
        '  fileKey: "blhIivaTore7fjGoFDU8gx",',
        '  nodeId:  "103:10896"',
        ')',
      ]),
      spacer(6),
      body('The design context response returned:'),
      bullet('Full React + Tailwind reference code for the Typography node.'),
      bullet('Inline styles with exact font families, sizes, weights, colours, and line heights.'),
      bullet('Named design token styles (H1, H2-Bold, Body-Regular, etc.) extracted from Figma variables.'),
      bullet('A screenshot of the node as a visual reference.'),

      spacer(10),
      // STEP 3
      h2('Step 3 — Extract Typography Tokens'),
      body('Key values identified from the get_design_context response:'),
      spacer(6),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 1200, 1200, 1200, 3360],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, shading: { fill: NOBLE_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Style', bold: true, color: WHITE, size: 20, font: 'Nunito Sans' })] })] }),
            new TableCell({ borders, shading: { fill: NOBLE_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Desktop', bold: true, color: WHITE, size: 20, font: 'Nunito Sans' })] })] }),
            new TableCell({ borders, shading: { fill: NOBLE_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Mobile', bold: true, color: WHITE, size: 20, font: 'Nunito Sans' })] })] }),
            new TableCell({ borders, shading: { fill: NOBLE_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Weight', bold: true, color: WHITE, size: 20, font: 'Nunito Sans' })] })] }),
            new TableCell({ borders, shading: { fill: NOBLE_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Color', bold: true, color: WHITE, size: 20, font: 'Nunito Sans' })] })] }),
          ]}),
          ...[ ['Heading 1','44px','32px','Bold','#0A2E57 (Noble Blue 500)'],
               ['Heading 2','32px','28px','Reg / Bold','#0A2E57'],
               ['Heading 3','24px','22px','Reg / Bold','#0A2E57'],
               ['Heading 4','20px','20px','Reg / Bold','#0A2E57'],
               ['Caption','18px','18px','Bold','#0A2E57'],
               ['Body','16px','16px','Reg / Bold','#081C2B'],
               ['Label','14px','14px','Reg / Bold','#081C2B'],
               ['Body Small','12px','12px','Reg / Bold','#081C2B'],
               ['Validation','10px','10px','Reg / Bold','#081C2B'],
          ].map(([style, desktop, mobile, weight, color], i) =>
            new TableRow({ children: [
              new TableCell({ borders, shading: { fill: i%2===0?GREY_BG:WHITE, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: style, bold: true, size: 20, font: 'Nunito Sans', color: NOBLE_BLUE })] })] }),
              new TableCell({ borders, shading: { fill: i%2===0?GREY_BG:WHITE, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: desktop, size: 20, font: 'Courier New' })] })] }),
              new TableCell({ borders, shading: { fill: i%2===0?GREY_BG:WHITE, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: mobile, size: 20, font: 'Courier New' })] })] }),
              new TableCell({ borders, shading: { fill: i%2===0?GREY_BG:WHITE, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: weight, size: 20, font: 'Nunito Sans' })] })] }),
              new TableCell({ borders, shading: { fill: i%2===0?GREY_BG:WHITE, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: color, size: 20, font: 'Courier New' })] })] }),
            ]}),
          ),
        ],
      }),

      spacer(10),
      // STEP 4
      h2('Step 4 — Create Project Directory'),
      body('Commands run:'),
      codeBlock([
        'mkdir -p claude-ui-library/src/tokens',
        'mkdir -p claude-ui-library/src/components',
        'mkdir -p claude-ui-library/src/figma',
      ]),
      spacer(6),
      body('Files written:', { bold: true }),
      bullet('src/tokens/typography.css  —  CSS custom properties for all token values'),
      bullet('src/components/DripText.js  —  Web component definition'),
      bullet('src/figma/DripText.figma.js  —  Code Connect mapping'),
      bullet('index.html  —  Demo page'),
      bullet('package.json  —  Project manifest'),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // STEP 5
      h2('Step 5 — Build the CSS Token File'),
      body('File: src/tokens/typography.css'),
      spacer(6),
      body('Key design decisions:'),
      bullet('All font sizes defined as CSS custom properties (--text-h1-size, etc.).'),
      bullet('Desktop sizes set as the default in :root.'),
      bullet('A single @media (max-width: 767px) block overrides only the 3 heading sizes that change on mobile (h1, h2, h3). Body, label, and utility styles are unchanged.'),
      bullet('No mobile-specific token names — the same token name resolves to a different value at each breakpoint.'),
      spacer(6),
      codeBlock([
        ':root {',
        '  --text-h1-size:  44px;  /* desktop */',
        '  --text-h2-size:  32px;',
        '  --text-h3-size:  24px;',
        '  /* ... body / label / utility unchanged */',
        '}',
        '',
        '@media (max-width: 767px) {',
        '  :root {',
        '    --text-h1-size: 32px;  /* mobile override */',
        '    --text-h2-size: 28px;',
        '    --text-h3-size: 22px;',
        '  }',
        '}',
      ]),

      spacer(10),
      // STEP 6
      h2('Step 6 — Build the <drip-text> Web Component'),
      body('File: src/components/DripText.js'),
      spacer(6),
      body('Architecture:'),
      bullet('Native Custom Element (customElements.define) — zero dependencies, works in any framework.'),
      bullet('Shadow DOM (mode: open) — styles are fully encapsulated.'),
      bullet('Font size is set via var(--text-h1-size) inside the Shadow DOM style tag. Because CSS custom properties inherit through the shadow boundary, the host document\'s @media override flows in automatically.'),
      bullet('A mobile attribute was originally added but later removed — the CSS media query makes it redundant.'),
      spacer(6),
      body('Supported attributes:', { bold: true }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1800, 2400, 5160],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, shading: { fill: NOBLE_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Attribute', bold: true, color: WHITE, size: 20, font: 'Nunito Sans' })] })] }),
            new TableCell({ borders, shading: { fill: NOBLE_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Values', bold: true, color: WHITE, size: 20, font: 'Nunito Sans' })] })] }),
            new TableCell({ borders, shading: { fill: NOBLE_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 5160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'Notes', bold: true, color: WHITE, size: 20, font: 'Nunito Sans' })] })] }),
          ]}),
          ...[ ['variant','h1 h2 h3 h4 caption body label body-small validation','Sets the type style. Default: body'],
               ['weight','regular | bold','Overrides the variant default weight'],
               ['as','Any HTML tag','Overrides the rendered tag (e.g. span, div)'],
               ['color','Any CSS color','Overrides the default token color'],
          ].map(([attr, vals, note], i) => new TableRow({ children: [
            new TableCell({ borders, shading: { fill: i%2===0?GREY_BG:WHITE, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: attr, font: 'Courier New', size: 20, color: NOBLE_BLUE })] })] }),
            new TableCell({ borders, shading: { fill: i%2===0?GREY_BG:WHITE, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: vals, font: 'Courier New', size: 19 })] })] }),
            new TableCell({ borders, shading: { fill: i%2===0?GREY_BG:WHITE, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, width: { size: 5160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: note, size: 20, font: 'Nunito Sans' })] })] }),
          ]})),
        ],
      }),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // STEP 7
      h2('Step 7 — Build the Figma Code Connect File'),
      body('File: src/figma/DripText.figma.js'),
      spacer(6),
      body('This is a parserless Code Connect template (.figma.js). It maps Figma component properties to <drip-text> usage snippets so designers see live code in Figma Dev Mode without running a CLI publish step.'),
      spacer(6),
      codeBlock([
        '// url=https://www.figma.com/design/blhIivaTore7fjGoFDU8gx/...?node-id=103-10896',
        '// source=src/components/DripText.js',
        '// component=drip-text',
        '',
        'const figma    = require("figma")',
        'const instance = figma.selectedInstance',
        '',
        'const variant = instance.getEnum("Variant", {',
        '  "Heading 1": "h1", "Heading 2": "h2", ...',
        '})',
        'const weight = instance.getEnum("Weight", {',
        '  "Regular": "regular", "Bold": "bold"',
        '})',
        '',
        'export default {',
        '  example: figma.html`',
        '    <drip-text variant="${variant}" weight="${weight}">',
        '      ...text...',
        '    </drip-text>`,',
        '  id: "drip-text",',
        '}',
      ]),

      spacer(10),
      // STEP 8
      h2('Step 8 — Build the Demo Page'),
      body('File: index.html'),
      spacer(6),
      body('The demo page loads typography.css and DripText.js then renders two side-by-side tables — one for the desktop type scale and one for the mobile scale — using only <drip-text> tags. A Usage section shows copy-paste HTML snippets. A Code Connect section previews the .figma.js template.'),

      spacer(10),
      // STEP 9
      h2('Step 9 — Responsive CSS Refactor (mobile prop removed)'),
      body('The original component accepted a mobile boolean attribute to switch to the smaller scale. This was replaced with a pure CSS approach:'),
      spacer(6),
      bullet('Before: <drip-text variant="h1" mobile>text</drip-text>'),
      bullet('After:  <drip-text variant="h1">text</drip-text>  — size changes automatically at 767px'),
      spacer(6),
      body('Changes made:'),
      bullet('typography.css — added @media (max-width: 767px) block overriding --text-h1-size, --text-h2-size, --text-h3-size.'),
      bullet('DripText.js — removed mobile from observedAttributes; font-size now reads var(--text-h1-size) via Shadow DOM (CSS custom properties inherit through the shadow boundary).'),
      bullet('DripText.figma.js — removed Mobile boolean property mapping.'),
      bullet('index.html — removed all mobile attributes from every <drip-text> tag.'),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // STEP 10
      h2('Step 10 — Local Dev Server Setup'),
      body('The Claude Preview MCP tool requires a .claude/launch.json config at the workspace root. Several attempts were needed due to environment constraints.'),
      spacer(6),

      h3('Attempt 1 — npx serve with hardcoded port (failed)'),
      codeBlock([
        '// .claude/launch.json',
        '{',
        '  "runtimeExecutable": "/usr/local/bin/npx",',
        '  "runtimeArgs": ["serve", ".", "--listen", "3456"],',
        '  "port": 3456',
        '}',
      ]),
      body('Error: Port 3456 already in use.'),

      spacer(8),
      h3('Attempt 2 — autoPort: true (partially fixed)'),
      body('Added autoPort: true and removed the hardcoded --listen flag. This resolved the port conflict but npx could not find node in the sandbox PATH.'),
      body('Error: env: node: No such file or directory'),

      spacer(8),
      h3('Attempt 3 — Shell wrapper script (failed)'),
      body('Created serve.sh to export the full PATH before calling npx. Blocked by sandbox getcwd restriction.'),
      body('Error: Operation not permitted'),

      spacer(8),
      h3('Attempt 4 — Direct Node.js server (succeeded)'),
      body('Wrote a self-contained CommonJS HTTP server (server.cjs) and ran it directly with the full path to node:'),
      codeBlock([
        '// .claude/launch.json',
        '{',
        '  "runtimeExecutable": "/usr/local/bin/node",',
        '  "runtimeArgs": [".../claude-ui-library/server.cjs"],',
        '  "port": 3456,',
        '  "autoPort": true',
        '}',
      ]),
      body('Note: The file must use the .cjs extension because package.json has "type": "module", which causes require() to fail in .js files.'),
      spacer(6),
      body('Final tool call:', { bold: true }),
      codeBlock(['mcp__Claude_Preview__preview_start(name: "claude-ui-library")']),
      body('Result: Server started on port 65302 (autoPort assigned a free port).'),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // ── 4. FRAMEWORK INTEGRATION ───────────────────────────────────────────
      h1('4. Framework Integration Guide'),
      divider(),

      h2('4.1 Plain HTML'),
      codeBlock([
        '<link rel="stylesheet" href="src/tokens/typography.css" />',
        '<script type="module" src="src/components/DripText.js"></script>',
        '',
        '<drip-text variant="h1">Heading</drip-text>',
        '<drip-text variant="body" weight="bold">Bold body</drip-text>',
      ]),

      spacer(10),
      h2('4.2 Vue 3 (Vite)'),
      body('Register the component globally and tell Vue\'s compiler to treat drip-text as a native custom element.'),
      codeBlock([
        '// vite.config.js',
        'import vue from "@vitejs/plugin-vue"',
        'export default {',
        '  plugins: [vue({',
        '    template: {',
        '      compilerOptions: {',
        '        isCustomElement: (tag) => tag === "drip-text"',
        '      }',
        '    }',
        '  })]',
        '}',
        '',
        '// main.js',
        'import "./design-system/typography.css"',
        'import "./design-system/DripText.js"',
      ]),
      spacer(6),
      codeBlock([
        '<!-- Any .vue file -->',
        '<drip-text variant="h1">Title</drip-text>',
        '<drip-text variant="body" weight="bold">Bold</drip-text>',
      ]),

      spacer(10),
      h2('4.3 React 18+'),
      body('Wrap the custom element in a thin React component to handle boolean attributes and forward refs cleanly.'),
      codeBlock([
        '// src/design-system/DripText.jsx',
        'import { useEffect, useRef } from "react"',
        'import "./typography.css"',
        'import "./DripText.js"',
        '',
        'export function DripText({ variant="body", weight, color, as, children }) {',
        '  return (',
        '    <drip-text variant={variant} weight={weight} color={color} as={as}>',
        '      {children}',
        '    </drip-text>',
        '  )',
        '}',
      ]),
      spacer(6),
      codeBlock([
        '// Usage',
        '<DripText variant="h1">Title</DripText>',
        '<DripText variant="body" weight="bold">Bold</DripText>',
        '<DripText variant="caption" color="#1e7a4e">Green caption</DripText>',
      ]),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // ── 5. TROUBLESHOOTING ─────────────────────────────────────────────────
      h1('5. Troubleshooting Log'),
      divider(),

      stepTable([
        ['Issue',    'get_design_context returned "You currently have nothing selected"'],
        ['Cause',    'The original URL (node-id=101-1255) pointed to a canvas-level group, not a published component frame.'],
        ['Fix',      'Used a URL pointing to the Typography frame (node-id=103-10896) instead.'],
        ['',         ''],
        ['Issue',    'Metadata response too large (758,152 characters)'],
        ['Cause',    'Node 101:1255 was a top-level page containing dozens of frames.'],
        ['Fix',      'Switched to get_design_context on the specific Typography frame (103:10896) which returned a manageable payload.'],
        ['',         ''],
        ['Issue',    'Dev server: env: node: No such file or directory'],
        ['Cause',    'The Claude Preview tool runs commands in a restricted sandbox where /usr/local/bin is not in PATH.'],
        ['Fix',      'Used the full absolute path /usr/local/bin/node as runtimeExecutable.'],
        ['',         ''],
        ['Issue',    'Dev server: require is not defined in ES module scope'],
        ['Cause',    'package.json has "type": "module", treating all .js files as ES modules.'],
        ['Fix',      'Renamed server.js to server.cjs — .cjs files are always treated as CommonJS regardless of package.json.'],
        ['',         ''],
        ['Issue',    'Dev server: getcwd: Operation not permitted'],
        ['Cause',    'Shell wrapper script (serve.sh) attempted to resolve the working directory in the sandbox.'],
        ['Fix',      'Replaced the shell script with a standalone Node.js server that uses __dirname for paths.'],
      ]),

      // PAGE BREAK
      new Paragraph({ children: [new PageBreak()] }),

      // ── 6. QUICK REFERENCE ─────────────────────────────────────────────────
      h1('6. Quick Reference'),
      divider(),

      h2('6.1 All <drip-text> Examples'),
      codeBlock([
        '<!-- Headings (auto-switch desktop/mobile via CSS) -->',
        '<drip-text variant="h1">44px Bold heading</drip-text>',
        '<drip-text variant="h2" weight="regular">32px Regular</drip-text>',
        '<drip-text variant="h2" weight="bold">32px Bold</drip-text>',
        '<drip-text variant="h3">24px heading</drip-text>',
        '<drip-text variant="h4">20px heading</drip-text>',
        '',
        '<!-- Utility -->',
        '<drip-text variant="caption">18px Bold caption</drip-text>',
        '<drip-text variant="body">16px body text</drip-text>',
        '<drip-text variant="label" weight="bold">14px Bold label</drip-text>',
        '<drip-text variant="body-small">12px body small</drip-text>',
        '<drip-text variant="validation">10px validation</drip-text>',
        '',
        '<!-- Overrides -->',
        '<drip-text variant="h3" color="#1e7a4e">Custom colour</drip-text>',
        '<drip-text variant="h2" as="span">Inline heading</drip-text>',
      ]),

      spacer(10),
      h2('6.2 Run the Dev Server'),
      codeBlock([
        'cd /Users/steven/Documents/work/claude-projects/claude-ui-library',
        '',
        '# Option A — Node (built-in server)',
        'node server.cjs',
        '# → http://localhost:3456',
        '',
        '# Option B — Python',
        'python3 -m http.server 3456',
        '# → http://localhost:3456',
        '',
        '# Option C — npx serve',
        'npx serve .',
      ]),

      spacer(10),
      h2('6.3 Key File Paths'),
      codeBlock([
        '/Users/steven/Documents/work/claude-projects/',
        '└── claude-ui-library/',
        '    ├── index.html',
        '    ├── package.json',
        '    ├── server.cjs',
        '    ├── .claude/',
        '    │   └── launch.json',
        '    └── src/',
        '        ├── tokens/typography.css',
        '        ├── components/DripText.js',
        '        └── figma/DripText.figma.js',
      ]),

      spacer(20),
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREEN_LIGHT } },
        spacing: { before: 200, after: 60 },
        children: [new TextRun({ text: 'Generated by Claude Code  |  Drip Capital Typography Design System  |  April 2026', color: '888888', size: 18, font: 'Nunito Sans' })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = path.join(__dirname, 'SESSION_DOCS.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Written:', outPath);
});
