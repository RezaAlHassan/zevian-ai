# CLAUDE.md — Design System & Architecture Guide
# Project: zevian-ai Performance Tracker
# Stack: Vite 6 + React 19 + TypeScript 5 + Tailwind CSS + Preline UI + Supabase + Gemini AI

> Drop this file in the root of the repo. It is the authoritative rules doc for all AI-assisted coding.
> When implementing UI from Figma (Moon Design System v1 Community), always follow
> these rules to ensure token-consistent, architecturally correct output.

---

## 1. Project Stack Overview

| Layer | Technology | Version |
|---|---|---|
| Build Tool | Vite | 6.2.0 |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.8.2 |
| Router | React Router DOM | 7.9.6 |
| UI Components | Preline UI | (latest) |
| Styling | Tailwind CSS | v3 |
| Icons | Lucide React | (latest) |
| Charts | Recharts | (latest) |
| Backend | Supabase (PostgreSQL) | — |
| AI | Google Gemini 2.5 Flash + Pro | — |

**Important:** Preline UI is a **Tailwind CSS class library** — not a React component library.
It works by applying pre-designed Tailwind class combinations to standard HTML/JSX elements,
plus optional JavaScript plugins (`preline.js`) for interactive elements like dropdowns, modals, etc.
There are no `import { Button } from 'preline'` statements. You copy Preline's class patterns onto your elements.

---

## 2. Moon Design System Token Integration

Moon DS v1 tokens are injected as **CSS custom properties** into `src/index.css` and
extended as **Tailwind utilities** in `tailwind.config.ts`. This lets you write
`bg-piccolo`, `text-bulma`, `rounded-moon-s-md`, etc. as normal Tailwind classes
that work seamlessly alongside Preline's class patterns.

### 2.1 src/index.css — Moon DS CSS Variables

Add this to your existing `src/index.css` (keep any existing Tailwind imports):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ─── Moon DS Color Tokens — Light Theme ─── */

    /* Surfaces */
    --goku:   220 14% 96%;    /* lightest page background */
    --gohan:  220 14% 93%;    /* secondary/section background */
    --goten:  0 0% 100%;      /* card / white surface */

    /* Text */
    --bulma:  222 25% 12%;    /* primary text (near-black) */
    --trunks: 220 10% 55%;    /* secondary / muted text */
    --popo:   0 0% 0%;        /* pure black */

    /* Brand */
    --piccolo: 237 90% 66%;   /* #5C62F5 — primary brand, CTAs */
    --hit:     48 100% 50%;   /* #FFD000 — accent yellow */

    /* Semantic */
    --roshi:   149 87% 33%;   /* #0D9B54 — success / positive */
    --dodoria: 1 83% 63%;     /* #EF5451 — error / destructive */
    --krillin: 32 100% 56%;   /* #FF8F1F — warning / caution */

    /* Borders */
    --beerus:  220 13% 88%;   /* dividers and input borders */

    /* ─── Moon DS Border Radius Tokens ─── */
    --moon-i-xs:  0.25rem;   /* 4px  — interactive / small */
    --moon-i-sm:  0.5rem;    /* 8px  — interactive / medium (buttons, inputs) */
    --moon-i-md:  0.75rem;   /* 12px — interactive / large */
    --moon-s-xs:  0.25rem;   /* 4px  — surface / xsmall */
    --moon-s-sm:  0.5rem;    /* 8px  — surface / small */
    --moon-s-md:  0.75rem;   /* 12px — surface / medium (standard cards) */
    --moon-s-lg:  1rem;      /* 16px — surface / large */
    --moon-s-xl:  1.25rem;   /* 20px — surface / xlarge */
    --moon-s-2xl: 1.5rem;    /* 24px — surface / 2xlarge (modals, hero cards) */
  }

  .dark {
    /* ─── Moon DS Dark Theme ─── */
    --goku:   222 25% 10%;
    --gohan:  222 25% 14%;
    --goten:  222 25% 18%;
    --bulma:  210 20% 92%;
    --trunks: 220 10% 55%;
    --piccolo: 237 90% 70%;
    --beerus:  222 20% 26%;
    /* hit / roshi / dodoria / krillin remain the same in dark mode */
  }

  /* ─── Base typography ─── */
  body {
    @apply bg-goku text-bulma antialiased;
    font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
  }
}
```

### 2.2 tailwind.config.ts — Moon DS Token Extension

Merge this into your existing `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Include preline for purging
    './node_modules/preline/dist/*.js',
  ],
  theme: {
    extend: {
      // ─── Moon DS Color Utilities ────────────────────────────
      colors: {
        piccolo:  'hsl(var(--piccolo) / <alpha-value>)',
        hit:      'hsl(var(--hit) / <alpha-value>)',
        roshi:    'hsl(var(--roshi) / <alpha-value>)',
        dodoria:  'hsl(var(--dodoria) / <alpha-value>)',
        krillin:  'hsl(var(--krillin) / <alpha-value>)',
        goku:     'hsl(var(--goku) / <alpha-value>)',
        gohan:    'hsl(var(--gohan) / <alpha-value>)',
        goten:    'hsl(var(--goten) / <alpha-value>)',
        bulma:    'hsl(var(--bulma) / <alpha-value>)',
        trunks:   'hsl(var(--trunks) / <alpha-value>)',
        beerus:   'hsl(var(--beerus) / <alpha-value>)',
        popo:     'hsl(var(--popo) / <alpha-value>)',
        heles:    'hsl(var(--piccolo) / 0.08)',   /* hover overlay */
        jiren:    'hsl(var(--piccolo) / 0.16)',   /* active overlay */
      },

      // ─── Moon DS Typography Scale ────────────────────────────
      fontSize: {
        'moon-12': ['0.75rem',  { lineHeight: '1rem' }],
        'moon-14': ['0.875rem', { lineHeight: '1.25rem' }],
        'moon-16': ['1rem',     { lineHeight: '1.5rem' }],
        'moon-18': ['1.125rem', { lineHeight: '1.75rem' }],
        'moon-20': ['1.25rem',  { lineHeight: '1.75rem' }],
        'moon-24': ['1.5rem',   { lineHeight: '2rem' }],
        'moon-32': ['2rem',     { lineHeight: '2.5rem' }],
        'moon-40': ['2.5rem',   { lineHeight: '3rem' }],
        'moon-48': ['3rem',     { lineHeight: '3.5rem' }],
        'moon-56': ['3.5rem',   { lineHeight: '4rem' }],
      },

      // ─── Moon DS Border Radius Tokens ────────────────────────
      borderRadius: {
        'moon-i-xs':  'var(--moon-i-xs)',
        'moon-i-sm':  'var(--moon-i-sm)',
        'moon-i-md':  'var(--moon-i-md)',
        'moon-s-xs':  'var(--moon-s-xs)',
        'moon-s-sm':  'var(--moon-s-sm)',
        'moon-s-md':  'var(--moon-s-md)',
        'moon-s-lg':  'var(--moon-s-lg)',
        'moon-s-xl':  'var(--moon-s-xl)',
        'moon-s-2xl': 'var(--moon-s-2xl)',
      },

      // ─── Moon DS Shadows ─────────────────────────────────────
      boxShadow: {
        'moon-xs': '0 2px 4px rgb(0 0 0 / 0.08)',
        'moon-sm': '0 4px 8px rgb(0 0 0 / 0.10)',
        'moon-md': '0 8px 16px rgb(0 0 0 / 0.12)',
        'moon-lg': '0 16px 32px rgb(0 0 0 / 0.14)',
        'moon-xl': '0 24px 48px rgb(0 0 0 / 0.16)',
      },

      // ─── Font Family ─────────────────────────────────────────
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('preline/plugin'),           // Preline UI plugin
    require('@tailwindcss/forms'),        // Required by Preline forms
  ],
};

export default config;
```

### 2.3 Font — DM Sans

Add to `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
```

---

## 3. Design Token Reference

### 3.1 Color Tokens — Figma → Tailwind

| Figma Token | Purpose | Use As |
|---|---|---|
| `piccolo` | Primary brand / CTAs / active states | `bg-piccolo` `text-piccolo` `border-piccolo` |
| `hit` | Accent / highlights | `bg-hit` `text-hit` |
| `roshi` | Success / positive / passing scores | `bg-roshi` `text-roshi` |
| `dodoria` | Error / destructive / failing scores | `bg-dodoria` `text-dodoria` |
| `krillin` | Warning / caution / late submissions | `bg-krillin` `text-krillin` |
| `goku` | Page / app background | `bg-goku` |
| `gohan` | Sidebar / secondary section background | `bg-gohan` |
| `goten` | Card / modal / panel surface (white) | `bg-goten` |
| `bulma` | Primary text | `text-bulma` |
| `trunks` | Secondary / placeholder / label text | `text-trunks` |
| `beerus` | Borders / dividers / input outlines | `border-beerus` `bg-beerus` |
| `popo` | Near-black | `text-popo` `bg-popo` |
| `heles` | Hover overlay | `bg-heles` |
| `jiren` | Active/pressed overlay | `bg-jiren` |

**Hard rule:** Every color in the UI must come from a Moon DS token.
Never use raw Tailwind palette colors (`blue-600`, `gray-400`, `red-500`, etc.)
for any design-visible element.

```tsx
// ✅ CORRECT
<div className="bg-goten border border-beerus text-bulma rounded-moon-s-md">

// ❌ WRONG
<div className="bg-white border border-gray-200 text-gray-900 rounded-xl">
```

### 3.2 Semantic Color Mapping for This App

| App Concept | Moon DS Token |
|---|---|
| Score ≥ 8.0 (excellent) | `text-roshi` / `bg-roshi/10` |
| Score 6.0–7.9 (good) | `text-piccolo` / `bg-piccolo/10` |
| Score 4.0–5.9 (average) | `text-krillin` / `bg-krillin/10` |
| Score < 4.0 (poor) | `text-dodoria` / `bg-dodoria/10` |
| On time | `text-roshi` |
| Late submission | `text-krillin` |
| Overdue | `text-dodoria` |
| AI evaluation | `text-piccolo` |
| Manager override | `text-hit` |
| Active/selected | `bg-piccolo` |
| Disabled | `text-beerus` / `bg-gohan` |

### 3.3 Typography Scale — Figma → Tailwind

| Figma Style | Tailwind Classes | App Usage |
|---|---|---|
| Heading XL | `text-moon-48 font-semibold` | — |
| Heading LG | `text-moon-40 font-semibold` | — |
| Heading MD | `text-moon-32 font-semibold` | Page titles |
| Heading SM | `text-moon-24 font-semibold` | Section titles, modal titles |
| Heading XS | `text-moon-20 font-semibold` | Card titles, table headers |
| Body LG | `text-moon-18` | Lead text |
| Body MD | `text-moon-16` | Standard body, descriptions |
| Body SM | `text-moon-14` | Labels, secondary info, table rows |
| Body XS | `text-moon-12` | Captions, timestamps, hints |

```tsx
// Page header
<h1 className="text-moon-32 font-semibold text-bulma">Dashboard</h1>

// Card title
<h3 className="text-moon-20 font-semibold text-bulma">Performance Report</h3>

// Body text
<p className="text-moon-16 text-trunks">Submitted 3 hours ago</p>

// Label / caption
<span className="text-moon-12 text-trunks">AI-evaluated</span>
```

### 3.4 Border Radius

| Token | Value | Tailwind | Use For |
|---|---|---|---|
| `moon-i-xs` | 4px | `rounded-moon-i-xs` | Small chips, micro-badges |
| `moon-i-sm` | 8px | `rounded-moon-i-sm` | Buttons, inputs, tags |
| `moon-i-md` | 12px | `rounded-moon-i-md` | Large/hero buttons |
| `moon-s-sm` | 8px | `rounded-moon-s-sm` | Compact cards |
| `moon-s-md` | 12px | `rounded-moon-s-md` | Standard cards, panels |
| `moon-s-lg` | 16px | `rounded-moon-s-lg` | Large panels |
| `moon-s-xl` | 20px | `rounded-moon-s-xl` | Modals, drawers |
| `moon-s-2xl` | 24px | `rounded-moon-s-2xl` | Hero/feature cards |
| `full` | 9999px | `rounded-full` | Avatar, pill badge |

> **Rule:** Interactive elements (buttons, inputs, chips) → `moon-i-*`
> Containers/surfaces (cards, panels, modals) → `moon-s-*`

### 3.5 Spacing — 4px Grid

All spacing is multiples of 4px. Use standard Tailwind spacing utilities.

```
4px  → gap-1, p-1, m-1
8px  → gap-2, p-2, m-2
12px → gap-3, p-3, m-3
16px → gap-4, p-4, m-4
24px → gap-6, p-6, m-6
32px → gap-8, p-8, m-8
48px → gap-12, p-12, m-12
64px → gap-16, p-16, m-16
```

---

## 4. Component Patterns (Preline + Moon DS Tokens)

Since Preline is a class library, components are built by combining Preline's documented
class patterns with Moon DS token classes. Below are the patterns for this app's key UI elements.

### 4.1 Buttons

```tsx
// Primary button — piccolo brand color
<button className="py-2 px-4 inline-flex items-center gap-2 text-moon-14 font-medium
                   rounded-moon-i-sm border border-transparent bg-piccolo text-white
                   hover:bg-piccolo/90 active:bg-piccolo/95
                   focus:outline-none focus:ring-2 focus:ring-piccolo/30
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  Save Changes
</button>

// Secondary button — outlined
<button className="py-2 px-4 inline-flex items-center gap-2 text-moon-14 font-medium
                   rounded-moon-i-sm border border-beerus bg-goten text-bulma
                   hover:bg-gohan active:bg-beerus/50
                   focus:outline-none focus:ring-2 focus:ring-piccolo/20
                   transition-colors">
  Cancel
</button>

// Ghost button
<button className="py-2 px-4 inline-flex items-center gap-2 text-moon-14 font-medium
                   rounded-moon-i-sm border border-transparent text-piccolo
                   hover:bg-heles active:bg-jiren
                   focus:outline-none transition-colors">
  View Details
</button>

// Destructive button
<button className="py-2 px-4 inline-flex items-center gap-2 text-moon-14 font-medium
                   rounded-moon-i-sm border border-transparent bg-dodoria text-white
                   hover:bg-dodoria/90 focus:outline-none focus:ring-2 focus:ring-dodoria/30
                   transition-colors">
  Delete
</button>

// Button sizes
// sm: py-1.5 px-3 text-moon-12
// md: py-2 px-4 text-moon-14     ← default
// lg: py-2.5 px-5 text-moon-16
// xl: py-3 px-6 text-moon-16

// Loading state
<button disabled className="py-2 px-4 inline-flex items-center gap-2 text-moon-14 font-medium
                             rounded-moon-i-sm bg-piccolo text-white opacity-70 cursor-not-allowed">
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
  </svg>
  Saving...
</button>
```

### 4.2 Card / Surface

```tsx
// Standard card
<div className="bg-goten border border-beerus rounded-moon-s-md p-6 shadow-moon-xs">
  <h3 className="text-moon-20 font-semibold text-bulma mb-1">Card Title</h3>
  <p className="text-moon-14 text-trunks">Supporting description</p>
</div>

// Interactive card (clickable)
<div className="bg-goten border border-beerus rounded-moon-s-md p-6 shadow-moon-xs
                hover:shadow-moon-md hover:border-piccolo/30 transition-all cursor-pointer">
  {/* content */}
</div>

// Elevated card (modals, overlaid content)
<div className="bg-goten border border-beerus rounded-moon-s-xl p-8 shadow-moon-lg">
  {/* content */}
</div>

// Stat / metric card — used on Dashboard
<div className="bg-goten border border-beerus rounded-moon-s-md p-6 shadow-moon-xs">
  <p className="text-moon-14 text-trunks mb-1">{label}</p>
  <p className="text-moon-32 font-semibold text-bulma">{value}</p>
  <span className={`text-moon-12 font-medium mt-1 inline-flex items-center gap-1 ${
    trend >= 0 ? 'text-roshi' : 'text-dodoria'
  }`}>
    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
  </span>
</div>
```

### 4.3 Form Inputs

```tsx
// Text input
<div className="flex flex-col gap-1.5">
  <label className="text-moon-14 font-medium text-bulma" htmlFor="field">
    Field Label
  </label>
  <input
    id="field"
    type="text"
    placeholder="Placeholder text"
    className="py-2.5 px-3 block w-full rounded-moon-i-sm text-moon-14 text-bulma
               border border-beerus bg-goten placeholder:text-trunks
               focus:outline-none focus:ring-2 focus:ring-piccolo/30 focus:border-piccolo
               transition-colors"
  />
  {/* Hint / helper */}
  <p className="text-moon-12 text-trunks">Helper text goes here</p>
  {/* Error state */}
  <p className="text-moon-12 text-dodoria">Error message</p>
</div>

// Error state input (add to className)
// border-dodoria focus:ring-dodoria/30 focus:border-dodoria

// Textarea (for report submission)
<textarea
  rows={6}
  placeholder="Write your report..."
  className="py-2.5 px-3 block w-full rounded-moon-i-sm text-moon-14 text-bulma
             border border-beerus bg-goten placeholder:text-trunks
             focus:outline-none focus:ring-2 focus:ring-piccolo/30 focus:border-piccolo
             transition-colors resize-none"
/>

// Select
<select className="py-2.5 px-3 block w-full rounded-moon-i-sm text-moon-14 text-bulma
                   border border-beerus bg-goten
                   focus:outline-none focus:ring-2 focus:ring-piccolo/30 focus:border-piccolo
                   transition-colors">
  <option value="">Select option...</option>
  <option value="a">Option A</option>
</select>
```

### 4.4 Badge / Status Chip

```tsx
// Score badges
const scoreBadge = (score: number) => {
  if (score >= 8.0) return 'bg-roshi/10 text-roshi border-roshi/20';
  if (score >= 6.0) return 'bg-piccolo/10 text-piccolo border-piccolo/20';
  if (score >= 4.0) return 'bg-krillin/10 text-krillin border-krillin/20';
  return 'bg-dodoria/10 text-dodoria border-dodoria/20';
};

<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-moon-12
                  font-medium border ${scoreBadge(score)}`}>
  {score.toFixed(1)}/10
</span>

// Role badges
// Account Owner
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-moon-12
                 font-medium bg-piccolo/10 text-piccolo border border-piccolo/20">
  Account Owner
</span>

// Manager
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-moon-12
                 font-medium bg-hit/10 text-hit border border-hit/20">
  Manager
</span>

// Employee
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-moon-12
                 font-medium bg-gohan text-trunks border border-beerus">
  Employee
</span>

// Status chips
// On time
<span className="... bg-roshi/10 text-roshi border-roshi/20">On Time</span>
// Late
<span className="... bg-krillin/10 text-krillin border-krillin/20">Late</span>
// Overdue
<span className="... bg-dodoria/10 text-dodoria border-dodoria/20">Overdue</span>
// AI evaluated
<span className="... bg-piccolo/10 text-piccolo border-piccolo/20">AI Scored</span>
// Manager override
<span className="... bg-hit/10 text-hit border-hit/20">Overridden</span>
```

### 4.5 Table (Reports, Employees)

```tsx
<div className="bg-goten border border-beerus rounded-moon-s-md overflow-hidden shadow-moon-xs">
  <table className="min-w-full divide-y divide-beerus">
    <thead className="bg-gohan">
      <tr>
        <th className="px-6 py-3 text-left text-moon-12 font-semibold text-trunks uppercase tracking-wider">
          Employee
        </th>
        <th className="px-6 py-3 text-left text-moon-12 font-semibold text-trunks uppercase tracking-wider">
          Score
        </th>
        <th className="px-6 py-3 text-left text-moon-12 font-semibold text-trunks uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-right text-moon-12 font-semibold text-trunks uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-goten divide-y divide-beerus">
      <tr className="hover:bg-gohan/50 transition-colors">
        <td className="px-6 py-4 text-moon-14 text-bulma">John Doe</td>
        <td className="px-6 py-4">
          <span className="inline-flex ... bg-roshi/10 text-roshi">8.5/10</span>
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex ... bg-roshi/10 text-roshi">On Time</span>
        </td>
        <td className="px-6 py-4 text-right">
          <button className="text-piccolo hover:text-piccolo/80 text-moon-14 font-medium">
            View
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 4.6 Modal / Dialog

Preline handles modal interactivity via `data-hs-overlay` attributes and `preline.js`:

```tsx
// Modal trigger
<button
  type="button"
  data-hs-overlay="#modal-invite"
  className="py-2 px-4 ... bg-piccolo text-white rounded-moon-i-sm"
>
  Invite User
</button>

// Modal markup
<div id="modal-invite"
  className="hs-overlay hidden size-full fixed top-0 start-0 z-[80]
             overflow-x-hidden overflow-y-auto pointer-events-none">
  <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500
                  mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto">
    <div className="bg-goten border border-beerus rounded-moon-s-xl shadow-moon-xl
                    pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center py-4 px-6 border-b border-beerus">
        <h3 className="text-moon-20 font-semibold text-bulma">Invite Team Member</h3>
        <button
          type="button"
          data-hs-overlay="#modal-invite"
          className="text-trunks hover:text-bulma transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {/* Body */}
      <div className="p-6 space-y-4">
        {/* form fields */}
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-3 py-4 px-6 border-t border-beerus">
        <button data-hs-overlay="#modal-invite"
          className="py-2 px-4 ... border border-beerus bg-goten text-bulma rounded-moon-i-sm">
          Cancel
        </button>
        <button className="py-2 px-4 ... bg-piccolo text-white rounded-moon-i-sm">
          Send Invitation
        </button>
      </div>
    </div>
  </div>
</div>
```

### 4.7 Sidebar Navigation

```tsx
<aside className="w-64 min-h-screen bg-gohan border-r border-beerus flex flex-col">
  {/* Logo */}
  <div className="px-6 py-5 border-b border-beerus">
    <span className="text-moon-20 font-semibold text-bulma">Performance Tracker</span>
  </div>

  {/* Nav items */}
  <nav className="flex-1 px-3 py-4 space-y-1">
    {/* Active item */}
    <a href="/dashboard"
      className="flex items-center gap-3 px-3 py-2.5 rounded-moon-i-sm
                 bg-piccolo/10 text-piccolo text-moon-14 font-medium">
      <LayoutDashboard className="w-5 h-5" />
      Dashboard
    </a>
    {/* Inactive item */}
    <a href="/reports"
      className="flex items-center gap-3 px-3 py-2.5 rounded-moon-i-sm
                 text-trunks text-moon-14 font-medium
                 hover:bg-gohan hover:text-bulma transition-colors">
      <FileText className="w-5 h-5" />
      All Reports
    </a>
  </nav>

  {/* Bottom user section */}
  <div className="px-3 py-4 border-t border-beerus">
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="w-8 h-8 rounded-full bg-piccolo flex items-center justify-center
                      text-goten text-moon-12 font-semibold shrink-0">
        JD
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-moon-14 font-medium text-bulma truncate">John Doe</p>
        <p className="text-moon-12 text-trunks truncate">Manager</p>
      </div>
    </div>
  </div>
</aside>
```

### 4.8 Page Header

```tsx
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-moon-32 font-semibold text-bulma">Dashboard</h1>
    <p className="text-moon-16 text-trunks mt-1">
      Performance overview for your team
    </p>
  </div>
  <div className="flex items-center gap-3">
    <button className="py-2 px-4 ... border border-beerus bg-goten text-bulma rounded-moon-i-sm">
      Export
    </button>
    <button className="py-2 px-4 ... bg-piccolo text-white rounded-moon-i-sm">
      + Add Project
    </button>
  </div>
</div>
```

### 4.9 Dropdown (Preline plugin)

```tsx
<div className="hs-dropdown relative inline-flex">
  <button type="button" className="hs-dropdown-toggle py-2 px-4 inline-flex items-center gap-2
                                    text-moon-14 text-bulma border border-beerus rounded-moon-i-sm
                                    bg-goten hover:bg-gohan transition-colors">
    Actions
    <ChevronDown className="w-4 h-4 text-trunks" />
  </button>

  <div className="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100
                  opacity-0 hidden z-10 mt-2 min-w-40 bg-goten shadow-moon-md rounded-moon-s-md
                  border border-beerus">
    <div className="p-1 space-y-0.5">
      <a href="#"
        className="flex items-center gap-2 py-2 px-3 rounded-moon-i-xs
                   text-moon-14 text-bulma hover:bg-gohan transition-colors">
        <Eye className="w-4 h-4 text-trunks" /> View
      </a>
      <a href="#"
        className="flex items-center gap-2 py-2 px-3 rounded-moon-i-xs
                   text-moon-14 text-bulma hover:bg-gohan transition-colors">
        <Pencil className="w-4 h-4 text-trunks" /> Edit
      </a>
      <hr className="border-beerus my-1" />
      <a href="#"
        className="flex items-center gap-2 py-2 px-3 rounded-moon-i-xs
                   text-moon-14 text-dodoria hover:bg-dodoria/10 transition-colors">
        <Trash2 className="w-4 h-4" /> Delete
      </a>
    </div>
  </div>
</div>
```

### 4.10 Tab Navigation (within pages)

```tsx
<div className="border-b border-beerus mb-6">
  <nav className="flex gap-0 -mb-px">
    {/* Active tab */}
    <button className="px-5 py-3 text-moon-14 font-medium text-piccolo
                        border-b-2 border-piccolo whitespace-nowrap">
      Overview
    </button>
    {/* Inactive tab */}
    <button className="px-5 py-3 text-moon-14 font-medium text-trunks
                        border-b-2 border-transparent hover:text-bulma hover:border-beerus
                        transition-colors whitespace-nowrap">
      All Reports
    </button>
  </nav>
</div>
```

### 4.11 Avatar

```tsx
// With image
<img
  src="/avatar.jpg"
  alt="John Doe"
  className="w-10 h-10 rounded-full object-cover border-2 border-beerus"
/>

// Initials fallback
<div className="w-10 h-10 rounded-full bg-piccolo flex items-center justify-center
                text-goten text-moon-14 font-semibold shrink-0">
  JD
</div>

// Sizes: w-8 h-8 (sm) | w-10 h-10 (md) | w-12 h-12 (lg) | w-16 h-16 (xl)
```

### 4.12 Score Display

Specific to this app — score visualization:

```tsx
// Large score display (report detail)
<div className="flex items-center gap-3">
  <span className="text-moon-48 font-semibold text-bulma">8.75</span>
  <span className="text-moon-20 text-trunks">/10</span>
</div>

// Criterion breakdown row
<div className="flex items-center justify-between py-3 border-b border-beerus last:border-0">
  <div>
    <p className="text-moon-14 font-medium text-bulma">Code Quality</p>
    <p className="text-moon-12 text-trunks">Weight: 40%</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Progress bar */}
    <div className="w-24 bg-beerus rounded-full h-1.5">
      <div
        className="bg-roshi h-1.5 rounded-full"
        style={{ width: `${(score / 10) * 100}%` }}
      />
    </div>
    <span className="text-moon-14 font-semibold text-bulma w-12 text-right">
      9.0/10
    </span>
  </div>
</div>

// Inline score badge (in tables)
function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 8 ? 'bg-roshi/10 text-roshi border-roshi/20'
    : score >= 6 ? 'bg-piccolo/10 text-piccolo border-piccolo/20'
    : score >= 4 ? 'bg-krillin/10 text-krillin border-krillin/20'
    : 'bg-dodoria/10 text-dodoria border-dodoria/20';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                       text-moon-12 font-medium border ${cls}`}>
      {score.toFixed(1)}/10
    </span>
  );
}
```

### 4.13 AI Feature UI

Specific to this app — AI evaluation display:

```tsx
// AI feedback panel
<div className="bg-piccolo/5 border border-piccolo/20 rounded-moon-s-md p-5">
  <div className="flex items-center gap-2 mb-3">
    <Sparkles className="w-5 h-5 text-piccolo" />
    <span className="text-moon-14 font-semibold text-piccolo">AI Feedback</span>
    <span className="text-moon-12 text-trunks ml-auto">Gemini 2.5 Flash</span>
  </div>
  <p className="text-moon-14 text-bulma leading-relaxed">{feedback}</p>
</div>

// Manager override indicator
<div className="flex items-center gap-2 mt-2">
  <div className="w-2 h-2 rounded-full bg-hit" />
  <span className="text-moon-12 text-trunks">
    Score overridden by manager from {originalScore.toFixed(1)} to {finalScore.toFixed(1)}
  </span>
</div>

// Loading state for AI evaluation
<div className="flex items-center gap-3 py-4">
  <div className="w-5 h-5 rounded-full border-2 border-piccolo border-t-transparent animate-spin" />
  <span className="text-moon-14 text-trunks">Evaluating with Gemini...</span>
</div>
```

---

## 5. Icon System

Lucide React is the icon library. All icon imports from `lucide-react`.

```tsx
import {
  LayoutDashboard, FolderOpen, Target, FileText, Users,
  Settings, Plus, Pencil, Trash2, Eye, X, ChevronDown,
  ChevronRight, Search, Filter, Download, Sparkles,
  TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle,
  BarChart2, Award, Send
} from 'lucide-react';
```

### Icon Sizing

| Context | Size | Tailwind |
|---|---|---|
| Inline with XS text | 12px | `w-3 h-3` |
| Inline with SM text | 16px | `w-4 h-4` |
| Standard / default | 20px | `w-5 h-5` |
| Navigation items | 20px | `w-5 h-5` |
| Feature icon | 24px | `w-6 h-6` |
| Hero / large display | 32px | `w-8 h-8` |

### Icon Color Mapping

```tsx
className="text-piccolo"   // primary brand icons, AI features
className="text-bulma"     // default / active icons
className="text-trunks"    // secondary / muted icons
className="text-roshi"     // success / positive icons
className="text-dodoria"   // error / delete / destructive icons
className="text-krillin"   // warning / late submission icons
className="text-hit"       // override / accent icons
className="text-beerus"    // disabled / placeholder icons
```

---

## 6. Recharts Integration (Dashboard Charts)

Charts use Recharts with Moon DS colors applied.

```tsx
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Performance trend chart
<ResponsiveContainer width="100%" height={240}>
  <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
    <CartesianGrid
      strokeDasharray="3 3"
      stroke="hsl(var(--beerus))"
      vertical={false}
    />
    <XAxis
      dataKey="date"
      tick={{ fontSize: 12, fill: 'hsl(var(--trunks))' }}
      axisLine={{ stroke: 'hsl(var(--beerus))' }}
      tickLine={false}
    />
    <YAxis
      domain={[0, 10]}
      tick={{ fontSize: 12, fill: 'hsl(var(--trunks))' }}
      axisLine={false}
      tickLine={false}
    />
    <Tooltip
      contentStyle={{
        backgroundColor: 'hsl(var(--goten))',
        border: '1px solid hsl(var(--beerus))',
        borderRadius: 'var(--moon-s-sm)',
        boxShadow: '0 4px 8px rgb(0 0 0 / 0.10)',
        fontSize: 13,
        color: 'hsl(var(--bulma))',
      }}
    />
    <Line
      type="monotone"
      dataKey="score"
      stroke="hsl(var(--piccolo))"
      strokeWidth={2}
      dot={{ fill: 'hsl(var(--piccolo))', r: 4 }}
      activeDot={{ r: 6, fill: 'hsl(var(--piccolo))' }}
    />
  </LineChart>
</ResponsiveContainer>

// Standard colors to use in charts
const CHART_COLORS = {
  primary:   'hsl(var(--piccolo))',
  success:   'hsl(var(--roshi))',
  warning:   'hsl(var(--krillin))',
  error:     'hsl(var(--dodoria))',
  accent:    'hsl(var(--hit))',
  muted:     'hsl(var(--trunks))',
  grid:      'hsl(var(--beerus))',
};
```

---

## 7. Supabase Service Layer

### 7.1 Client Setup

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 7.2 Service Pattern

All database logic lives in `src/services/databaseService.ts`.
Never write Supabase queries directly in components.

```ts
// Pattern for all service functions
export const reportService = {
  async getByEmployeeId(employeeId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        goals(name, projects(name)),
        report_criterion_scores(*)
      `)
      .eq('employee_id', employeeId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(report: ReportInsert) {
    const { data, error } = await supabase
      .from('reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
```

### 7.3 Key Database Tables Reference

```
organizations              — tenant isolation (always filter by org_id)
employees                  — users, roles, manager hierarchy
projects                   — project definitions + reporting frequency
goals                      — performance goals (belong to projects)
criteria                   — evaluation criteria per goal (weights sum to 100)
reports                    — submitted reports (employee → goal)
report_criterion_scores    — per-criterion AI scores
invitations                — token-based onboarding invites
employee_permissions       — granular permission flags per employee
project_assignees          — many-to-many: projects ↔ employees
manager_settings           — manager-level config
```

### 7.4 Row-Level Security Pattern

Always include `organization_id` filter in queries — Supabase RLS enforces this,
but also include it explicitly for clarity:

```ts
.eq('organization_id', currentUser.organization_id)
```

---

## 8. Gemini AI Service

### 8.1 Model Selection

```ts
// src/services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Use Flash for fast operations (evaluation, feedback)
const flashModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Use Pro for deep analysis (insights, summaries)
const proModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
```

### 8.2 Service Functions Reference

```ts
// Evaluate a submitted report against criteria
evaluateReport(reportText: string, criteria: Criterion[]): Promise<EvaluationResult>
// Returns: { overallScore, criterionScores: { id, score, reasoning }[], summary }

// Get pre-submission writing feedback
getReportFeedback(reportText: string, criteria: Criterion[]): Promise<string>
// Returns: constructive feedback string

// Generate team performance insights (Pro model)
generateInsights(reports: Report[]): Promise<InsightsResult>
// Returns: { strengths: string[], improvements: string[], trends: string }

// Generate narrative summary for a period (Pro model)
generatePerformanceSummary(employee: Employee, reports: Report[]): Promise<string>
// Returns: narrative summary string
```

### 8.3 Error Handling Pattern

```ts
// Always wrap Gemini calls with try/catch and surface errors in UI
try {
  const evaluation = await evaluateReport(text, criteria);
  setEvaluation(evaluation);
} catch (error) {
  // Show error state using dodoria color
  setError('AI evaluation failed. Please try again.');
}
```

---

## 9. Project File Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── PageHeader.tsx
│   │   └── AppShell.tsx
│   ├── ui/              # Generic Moon DS + Preline atoms
│   │   ├── ScoreBadge.tsx
│   │   ├── StatusChip.tsx
│   │   ├── Avatar.tsx
│   │   └── EmptyState.tsx
│   ├── charts/
│   │   ├── PerformanceTrendChart.tsx
│   │   └── ScoreBreakdownChart.tsx
│   └── ai/
│       ├── AIFeedbackPanel.tsx
│       └── EvaluationDisplay.tsx
├── pages/               # Route-level components
│   ├── Dashboard.tsx    # /dashboard
│   ├── Projects.tsx     # /projects
│   ├── Goals.tsx        # /goals
│   ├── SubmitReport.tsx # /submit
│   ├── Reports.tsx      # /reports
│   ├── Employees.tsx    # /employees
│   └── Settings.tsx     # /settings
├── services/
│   ├── databaseService.ts   # All Supabase queries
│   ├── geminiService.ts     # All Gemini AI calls
│   └── invitationService.ts # Invitation flow
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useReports.ts
│   └── usePermissions.ts
├── lib/
│   └── supabase.ts      # Supabase client
├── utils/               # Pure utility functions
├── types.ts             # All TypeScript types
├── constants.ts         # Enums, sample data
└── main.tsx
```

---

## 10. Permission Guard Pattern

```tsx
// Use permission checks before rendering management UI
function PermissionGuard({ permission, children }: {
  permission: keyof EmployeePermissions;
  children: React.ReactNode;
}) {
  const { permissions } = useAuth();
  if (!permissions[permission]) return null;
  return <>{children}</>;
}

// Usage
<PermissionGuard permission="can_manage_projects">
  <button className="py-2 px-4 ... bg-piccolo text-white rounded-moon-i-sm">
    + New Project
  </button>
</PermissionGuard>
```

---

## 11. Page Layout Shell

```tsx
// Standard page wrapper
function PageLayout({ title, description, actions, children }: PageLayoutProps) {
  return (
    <div className="flex-1 p-8 overflow-auto bg-goku">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-moon-32 font-semibold text-bulma">{title}</h1>
          {description && (
            <p className="text-moon-16 text-trunks mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
```

---

## 12. Strict Rules

### Always

- Use Moon DS semantic token names for every visible color
- Use `text-moon-{size}` for typography
- Use `rounded-moon-i-*` for interactive elements, `rounded-moon-s-*` for surfaces
- All DB calls go through `src/services/databaseService.ts`
- All AI calls go through `src/services/geminiService.ts`
- Score colors: ≥8 roshi, ≥6 piccolo, ≥4 krillin, <4 dodoria
- Use Lucide React for all icons, sized with `w-{n} h-{n}` Tailwind classes

### Never

```tsx
// ❌ Raw hex or arbitrary colors
className="bg-[#5C62F5]"
style={{ color: '#EF5451' }}

// ❌ Generic Tailwind palette colors for design-visible UI
className="bg-indigo-600"   // → bg-piccolo
className="text-gray-700"   // → text-bulma or text-trunks
className="border-gray-200" // → border-beerus
className="bg-white"        // → bg-goten
className="bg-gray-50"      // → bg-goku or bg-gohan
className="text-green-500"  // → text-roshi
className="text-red-500"    // → text-dodoria
className="text-yellow-400" // → text-krillin

// ❌ Non-Moon radius tokens
className="rounded-xl"      // → rounded-moon-s-lg
className="rounded-lg"      // → rounded-moon-s-md

// ❌ Supabase queries in components
const { data } = await supabase.from('reports').select(...) // → use databaseService

// ❌ Gemini calls in components
const result = await genAI.getGenerativeModel(...) // → use geminiService
```

---

## 13. Figma → Code Cheat Sheet

```
FIGMA TOKEN             →  TAILWIND CLASS
──────────────────────────────────────────────────────
Colors
piccolo                 →  bg-piccolo / text-piccolo / border-piccolo
hit                     →  bg-hit / text-hit
roshi                   →  bg-roshi / text-roshi
dodoria                 →  bg-dodoria / text-dodoria
krillin                 →  bg-krillin / text-krillin
goku                    →  bg-goku  (page bg)
gohan                   →  bg-gohan (sidebar / section bg)
goten                   →  bg-goten (card / white)
bulma                   →  text-bulma  (primary text)
trunks                  →  text-trunks (secondary text)
beerus                  →  border-beerus / bg-beerus
popo                    →  text-popo / bg-popo

Typography
Heading MD (32px)       →  text-moon-32 font-semibold
Heading SM (24px)       →  text-moon-24 font-semibold
Heading XS (20px)       →  text-moon-20 font-semibold
Body MD (16px)          →  text-moon-16
Body SM (14px)          →  text-moon-14
Body XS (12px)          →  text-moon-12

Spacing
4px                     →  gap-1 / p-1 / m-1
8px                     →  gap-2 / p-2 / m-2
12px                    →  gap-3 / p-3 / m-3
16px                    →  gap-4 / p-4 / m-4
24px                    →  gap-6 / p-6 / m-6
32px                    →  gap-8 / p-8 / m-8

Border Radius
Interactive SM          →  rounded-moon-i-sm  (buttons, inputs)
Interactive MD          →  rounded-moon-i-md  (large buttons)
Surface MD              →  rounded-moon-s-md  (cards)
Surface LG              →  rounded-moon-s-lg  (panels)
Surface XL              →  rounded-moon-s-xl  (modals)
Full                    →  rounded-full       (avatars, pills)

Shadows
Card                    →  shadow-moon-xs / shadow-moon-sm
Modal                   →  shadow-moon-lg / shadow-moon-xl
```

---

## 14. Environment Variables

```env
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

## 15. Project Links

- **Lovable Project:** https://lovable.dev/projects/355310c2-f707-47d6-8fd7-593093888f8e
- **GitHub Repo:** https://github.com/RezaAlHassan/zevian-ai
- **Figma Design:** https://www.figma.com/community/file/1002945721703152933/moon-design-system-v1
- **Moon DS Docs:** https://moon.io/docs
- **Preline UI Docs:** https://preline.co/docs
- **Lucide Icons:** https://lucide.dev/icons
- **Recharts Docs:** https://recharts.org
- **Supabase Docs:** https://supabase.com/docs

---

*Last updated: February 2026 | Stack: Vite 6 + React 19 + TypeScript + Preline UI + Tailwind | Moon DS v1 tokens*# CLAUDE.md — Design System & Architecture Guide
# Project: zevian-ai Performance Tracker
# Stack: Vite 6 + React 19 + TypeScript 5 + Tailwind CSS + Preline UI + Supabase + Gemini AI

> Drop this file in the root of the repo. It is the authoritative rules doc for all AI-assisted coding.
> When implementing UI from Figma (Moon Design System v1 Community), always follow
> these rules to ensure token-consistent, architecturally correct output.

---

## 1. Project Stack Overview

| Layer | Technology | Version |
|---|---|---|
| Build Tool | Vite | 6.2.0 |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.8.2 |
| Router | React Router DOM | 7.9.6 |
| UI Components | Preline UI | (latest) |
| Styling | Tailwind CSS | v3 |
| Icons | Lucide React | (latest) |
| Charts | Recharts | (latest) |
| Backend | Supabase (PostgreSQL) | — |
| AI | Google Gemini 2.5 Flash + Pro | — |

**Important:** Preline UI is a **Tailwind CSS class library** — not a React component library.
It works by applying pre-designed Tailwind class combinations to standard HTML/JSX elements,
plus optional JavaScript plugins (`preline.js`) for interactive elements like dropdowns, modals, etc.
There are no `import { Button } from 'preline'` statements. You copy Preline's class patterns onto your elements.

---

## 2. Moon Design System Token Integration

Moon DS v1 tokens are injected as **CSS custom properties** into `src/index.css` and
extended as **Tailwind utilities** in `tailwind.config.ts`. This lets you write
`bg-piccolo`, `text-bulma`, `rounded-moon-s-md`, etc. as normal Tailwind classes
that work seamlessly alongside Preline's class patterns.

### 2.1 src/index.css — Moon DS CSS Variables

Add this to your existing `src/index.css` (keep any existing Tailwind imports):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ─── Moon DS Color Tokens — Light Theme ─── */

    /* Surfaces */
    --goku:   220 14% 96%;    /* lightest page background */
    --gohan:  220 14% 93%;    /* secondary/section background */
    --goten:  0 0% 100%;      /* card / white surface */

    /* Text */
    --bulma:  222 25% 12%;    /* primary text (near-black) */
    --trunks: 220 10% 55%;    /* secondary / muted text */
    --popo:   0 0% 0%;        /* pure black */

    /* Brand */
    --piccolo: 237 90% 66%;   /* #5C62F5 — primary brand, CTAs */
    --hit:     48 100% 50%;   /* #FFD000 — accent yellow */

    /* Semantic */
    --roshi:   149 87% 33%;   /* #0D9B54 — success / positive */
    --dodoria: 1 83% 63%;     /* #EF5451 — error / destructive */
    --krillin: 32 100% 56%;   /* #FF8F1F — warning / caution */

    /* Borders */
    --beerus:  220 13% 88%;   /* dividers and input borders */

    /* ─── Moon DS Border Radius Tokens ─── */
    --moon-i-xs:  0.25rem;   /* 4px  — interactive / small */
    --moon-i-sm:  0.5rem;    /* 8px  — interactive / medium (buttons, inputs) */
    --moon-i-md:  0.75rem;   /* 12px — interactive / large */
    --moon-s-xs:  0.25rem;   /* 4px  — surface / xsmall */
    --moon-s-sm:  0.5rem;    /* 8px  — surface / small */
    --moon-s-md:  0.75rem;   /* 12px — surface / medium (standard cards) */
    --moon-s-lg:  1rem;      /* 16px — surface / large */
    --moon-s-xl:  1.25rem;   /* 20px — surface / xlarge */
    --moon-s-2xl: 1.5rem;    /* 24px — surface / 2xlarge (modals, hero cards) */
  }

  .dark {
    /* ─── Moon DS Dark Theme ─── */
    --goku:   222 25% 10%;
    --gohan:  222 25% 14%;
    --goten:  222 25% 18%;
    --bulma:  210 20% 92%;
    --trunks: 220 10% 55%;
    --piccolo: 237 90% 70%;
    --beerus:  222 20% 26%;
    /* hit / roshi / dodoria / krillin remain the same in dark mode */
  }

  /* ─── Base typography ─── */
  body {
    @apply bg-goku text-bulma antialiased;
    font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
  }
}
```

### 2.2 tailwind.config.ts — Moon DS Token Extension

Merge this into your existing `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Include preline for purging
    './node_modules/preline/dist/*.js',
  ],
  theme: {
    extend: {
      // ─── Moon DS Color Utilities ────────────────────────────
      colors: {
        piccolo:  'hsl(var(--piccolo) / <alpha-value>)',
        hit:      'hsl(var(--hit) / <alpha-value>)',
        roshi:    'hsl(var(--roshi) / <alpha-value>)',
        dodoria:  'hsl(var(--dodoria) / <alpha-value>)',
        krillin:  'hsl(var(--krillin) / <alpha-value>)',
        goku:     'hsl(var(--goku) / <alpha-value>)',
        gohan:    'hsl(var(--gohan) / <alpha-value>)',
        goten:    'hsl(var(--goten) / <alpha-value>)',
        bulma:    'hsl(var(--bulma) / <alpha-value>)',
        trunks:   'hsl(var(--trunks) / <alpha-value>)',
        beerus:   'hsl(var(--beerus) / <alpha-value>)',
        popo:     'hsl(var(--popo) / <alpha-value>)',
        heles:    'hsl(var(--piccolo) / 0.08)',   /* hover overlay */
        jiren:    'hsl(var(--piccolo) / 0.16)',   /* active overlay */
      },

      // ─── Moon DS Typography Scale ────────────────────────────
      fontSize: {
        'moon-12': ['0.75rem',  { lineHeight: '1rem' }],
        'moon-14': ['0.875rem', { lineHeight: '1.25rem' }],
        'moon-16': ['1rem',     { lineHeight: '1.5rem' }],
        'moon-18': ['1.125rem', { lineHeight: '1.75rem' }],
        'moon-20': ['1.25rem',  { lineHeight: '1.75rem' }],
        'moon-24': ['1.5rem',   { lineHeight: '2rem' }],
        'moon-32': ['2rem',     { lineHeight: '2.5rem' }],
        'moon-40': ['2.5rem',   { lineHeight: '3rem' }],
        'moon-48': ['3rem',     { lineHeight: '3.5rem' }],
        'moon-56': ['3.5rem',   { lineHeight: '4rem' }],
      },

      // ─── Moon DS Border Radius Tokens ────────────────────────
      borderRadius: {
        'moon-i-xs':  'var(--moon-i-xs)',
        'moon-i-sm':  'var(--moon-i-sm)',
        'moon-i-md':  'var(--moon-i-md)',
        'moon-s-xs':  'var(--moon-s-xs)',
        'moon-s-sm':  'var(--moon-s-sm)',
        'moon-s-md':  'var(--moon-s-md)',
        'moon-s-lg':  'var(--moon-s-lg)',
        'moon-s-xl':  'var(--moon-s-xl)',
        'moon-s-2xl': 'var(--moon-s-2xl)',
      },

      // ─── Moon DS Shadows ─────────────────────────────────────
      boxShadow: {
        'moon-xs': '0 2px 4px rgb(0 0 0 / 0.08)',
        'moon-sm': '0 4px 8px rgb(0 0 0 / 0.10)',
        'moon-md': '0 8px 16px rgb(0 0 0 / 0.12)',
        'moon-lg': '0 16px 32px rgb(0 0 0 / 0.14)',
        'moon-xl': '0 24px 48px rgb(0 0 0 / 0.16)',
      },

      // ─── Font Family ─────────────────────────────────────────
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('preline/plugin'),           // Preline UI plugin
    require('@tailwindcss/forms'),        // Required by Preline forms
  ],
};

export default config;
```

### 2.3 Font — DM Sans

Add to `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
```

---

## 3. Design Token Reference

### 3.1 Color Tokens — Figma → Tailwind

| Figma Token | Purpose | Use As |
|---|---|---|
| `piccolo` | Primary brand / CTAs / active states | `bg-piccolo` `text-piccolo` `border-piccolo` |
| `hit` | Accent / highlights | `bg-hit` `text-hit` |
| `roshi` | Success / positive / passing scores | `bg-roshi` `text-roshi` |
| `dodoria` | Error / destructive / failing scores | `bg-dodoria` `text-dodoria` |
| `krillin` | Warning / caution / late submissions | `bg-krillin` `text-krillin` |
| `goku` | Page / app background | `bg-goku` |
| `gohan` | Sidebar / secondary section background | `bg-gohan` |
| `goten` | Card / modal / panel surface (white) | `bg-goten` |
| `bulma` | Primary text | `text-bulma` |
| `trunks` | Secondary / placeholder / label text | `text-trunks` |
| `beerus` | Borders / dividers / input outlines | `border-beerus` `bg-beerus` |
| `popo` | Near-black | `text-popo` `bg-popo` |
| `heles` | Hover overlay | `bg-heles` |
| `jiren` | Active/pressed overlay | `bg-jiren` |

**Hard rule:** Every color in the UI must come from a Moon DS token.
Never use raw Tailwind palette colors (`blue-600`, `gray-400`, `red-500`, etc.)
for any design-visible element.

```tsx
// ✅ CORRECT
<div className="bg-goten border border-beerus text-bulma rounded-moon-s-md">

// ❌ WRONG
<div className="bg-white border border-gray-200 text-gray-900 rounded-xl">
```

### 3.2 Semantic Color Mapping for This App

| App Concept | Moon DS Token |
|---|---|
| Score ≥ 8.0 (excellent) | `text-roshi` / `bg-roshi/10` |
| Score 6.0–7.9 (good) | `text-piccolo` / `bg-piccolo/10` |
| Score 4.0–5.9 (average) | `text-krillin` / `bg-krillin/10` |
| Score < 4.0 (poor) | `text-dodoria` / `bg-dodoria/10` |
| On time | `text-roshi` |
| Late submission | `text-krillin` |
| Overdue | `text-dodoria` |
| AI evaluation | `text-piccolo` |
| Manager override | `text-hit` |
| Active/selected | `bg-piccolo` |
| Disabled | `text-beerus` / `bg-gohan` |

### 3.3 Typography Scale — Figma → Tailwind

| Figma Style | Tailwind Classes | App Usage |
|---|---|---|
| Heading XL | `text-moon-48 font-semibold` | — |
| Heading LG | `text-moon-40 font-semibold` | — |
| Heading MD | `text-moon-32 font-semibold` | Page titles |
| Heading SM | `text-moon-24 font-semibold` | Section titles, modal titles |
| Heading XS | `text-moon-20 font-semibold` | Card titles, table headers |
| Body LG | `text-moon-18` | Lead text |
| Body MD | `text-moon-16` | Standard body, descriptions |
| Body SM | `text-moon-14` | Labels, secondary info, table rows |
| Body XS | `text-moon-12` | Captions, timestamps, hints |

```tsx
// Page header
<h1 className="text-moon-32 font-semibold text-bulma">Dashboard</h1>

// Card title
<h3 className="text-moon-20 font-semibold text-bulma">Performance Report</h3>

// Body text
<p className="text-moon-16 text-trunks">Submitted 3 hours ago</p>

// Label / caption
<span className="text-moon-12 text-trunks">AI-evaluated</span>
```

### 3.4 Border Radius

| Token | Value | Tailwind | Use For |
|---|---|---|---|
| `moon-i-xs` | 4px | `rounded-moon-i-xs` | Small chips, micro-badges |
| `moon-i-sm` | 8px | `rounded-moon-i-sm` | Buttons, inputs, tags |
| `moon-i-md` | 12px | `rounded-moon-i-md` | Large/hero buttons |
| `moon-s-sm` | 8px | `rounded-moon-s-sm` | Compact cards |
| `moon-s-md` | 12px | `rounded-moon-s-md` | Standard cards, panels |
| `moon-s-lg` | 16px | `rounded-moon-s-lg` | Large panels |
| `moon-s-xl` | 20px | `rounded-moon-s-xl` | Modals, drawers |
| `moon-s-2xl` | 24px | `rounded-moon-s-2xl` | Hero/feature cards |
| `full` | 9999px | `rounded-full` | Avatar, pill badge |

> **Rule:** Interactive elements (buttons, inputs, chips) → `moon-i-*`
> Containers/surfaces (cards, panels, modals) → `moon-s-*`

### 3.5 Spacing — 4px Grid

All spacing is multiples of 4px. Use standard Tailwind spacing utilities.

```
4px  → gap-1, p-1, m-1
8px  → gap-2, p-2, m-2
12px → gap-3, p-3, m-3
16px → gap-4, p-4, m-4
24px → gap-6, p-6, m-6
32px → gap-8, p-8, m-8
48px → gap-12, p-12, m-12
64px → gap-16, p-16, m-16
```

---

## 4. Component Patterns (Preline + Moon DS Tokens)

Since Preline is a class library, components are built by combining Preline's documented
class patterns with Moon DS token classes. Below are the patterns for this app's key UI elements.

### 4.1 Buttons

```tsx
// Primary button — piccolo brand color
<button className="py-2 px-4 inline-flex items-center gap-2 text-moon-14 font-medium
                   rounded-moon-i-sm border border-transparent bg-piccolo text-white
                   hover:bg-piccolo/90 active:bg-piccolo/95
                   focus:outline-none focus:ring-2 focus:ring-piccolo/30
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  Save Changes
</button>

// Secondary button — outlined
<button className="py-2 px-4 inline-flex items-center gap-2 text-moon-14 font-medium
                   rounded-moon-i-sm border border-beerus bg-goten text-bulma
                   hover:bg-gohan active:bg-beerus/50
                   focus:outline-none focus:ring-2 focus:ring-piccolo/20
                   transition-colors">
  Cancel
</button>

// Ghost button
<button className="py-2 px-4 inline-flex items-center gap-2 text-moon-14 font-medium
                   rounded-moon-i-sm border border-transparent text-piccolo
                   hover:bg-heles active:bg-jiren
                   focus:outline-none transition-colors">
  View Details
</button>

// Destructive button
<button className="py-2 px-4 inline-flex items-center gap-2 text-moon-14 font-medium
                   rounded-moon-i-sm border border-transparent bg-dodoria text-white
                   hover:bg-dodoria/90 focus:outline-none focus:ring-2 focus:ring-dodoria/30
                   transition-colors">
  Delete
</button>

// Button sizes
// sm: py-1.5 px-3 text-moon-12
// md: py-2 px-4 text-moon-14     ← default
// lg: py-2.5 px-5 text-moon-16
// xl: py-3 px-6 text-moon-16

// Loading state
<button disabled className="py-2 px-4 inline-flex items-center gap-2 text-moon-14 font-medium
                             rounded-moon-i-sm bg-piccolo text-white opacity-70 cursor-not-allowed">
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
  </svg>
  Saving...
</button>
```

### 4.2 Card / Surface

```tsx
// Standard card
<div className="bg-goten border border-beerus rounded-moon-s-md p-6 shadow-moon-xs">
  <h3 className="text-moon-20 font-semibold text-bulma mb-1">Card Title</h3>
  <p className="text-moon-14 text-trunks">Supporting description</p>
</div>

// Interactive card (clickable)
<div className="bg-goten border border-beerus rounded-moon-s-md p-6 shadow-moon-xs
                hover:shadow-moon-md hover:border-piccolo/30 transition-all cursor-pointer">
  {/* content */}
</div>

// Elevated card (modals, overlaid content)
<div className="bg-goten border border-beerus rounded-moon-s-xl p-8 shadow-moon-lg">
  {/* content */}
</div>

// Stat / metric card — used on Dashboard
<div className="bg-goten border border-beerus rounded-moon-s-md p-6 shadow-moon-xs">
  <p className="text-moon-14 text-trunks mb-1">{label}</p>
  <p className="text-moon-32 font-semibold text-bulma">{value}</p>
  <span className={`text-moon-12 font-medium mt-1 inline-flex items-center gap-1 ${
    trend >= 0 ? 'text-roshi' : 'text-dodoria'
  }`}>
    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
  </span>
</div>
```

### 4.3 Form Inputs

```tsx
// Text input
<div className="flex flex-col gap-1.5">
  <label className="text-moon-14 font-medium text-bulma" htmlFor="field">
    Field Label
  </label>
  <input
    id="field"
    type="text"
    placeholder="Placeholder text"
    className="py-2.5 px-3 block w-full rounded-moon-i-sm text-moon-14 text-bulma
               border border-beerus bg-goten placeholder:text-trunks
               focus:outline-none focus:ring-2 focus:ring-piccolo/30 focus:border-piccolo
               transition-colors"
  />
  {/* Hint / helper */}
  <p className="text-moon-12 text-trunks">Helper text goes here</p>
  {/* Error state */}
  <p className="text-moon-12 text-dodoria">Error message</p>
</div>

// Error state input (add to className)
// border-dodoria focus:ring-dodoria/30 focus:border-dodoria

// Textarea (for report submission)
<textarea
  rows={6}
  placeholder="Write your report..."
  className="py-2.5 px-3 block w-full rounded-moon-i-sm text-moon-14 text-bulma
             border border-beerus bg-goten placeholder:text-trunks
             focus:outline-none focus:ring-2 focus:ring-piccolo/30 focus:border-piccolo
             transition-colors resize-none"
/>

// Select
<select className="py-2.5 px-3 block w-full rounded-moon-i-sm text-moon-14 text-bulma
                   border border-beerus bg-goten
                   focus:outline-none focus:ring-2 focus:ring-piccolo/30 focus:border-piccolo
                   transition-colors">
  <option value="">Select option...</option>
  <option value="a">Option A</option>
</select>
```

### 4.4 Badge / Status Chip

```tsx
// Score badges
const scoreBadge = (score: number) => {
  if (score >= 8.0) return 'bg-roshi/10 text-roshi border-roshi/20';
  if (score >= 6.0) return 'bg-piccolo/10 text-piccolo border-piccolo/20';
  if (score >= 4.0) return 'bg-krillin/10 text-krillin border-krillin/20';
  return 'bg-dodoria/10 text-dodoria border-dodoria/20';
};

<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-moon-12
                  font-medium border ${scoreBadge(score)}`}>
  {score.toFixed(1)}/10
</span>

// Role badges
// Account Owner
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-moon-12
                 font-medium bg-piccolo/10 text-piccolo border border-piccolo/20">
  Account Owner
</span>

// Manager
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-moon-12
                 font-medium bg-hit/10 text-hit border border-hit/20">
  Manager
</span>

// Employee
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-moon-12
                 font-medium bg-gohan text-trunks border border-beerus">
  Employee
</span>

// Status chips
// On time
<span className="... bg-roshi/10 text-roshi border-roshi/20">On Time</span>
// Late
<span className="... bg-krillin/10 text-krillin border-krillin/20">Late</span>
// Overdue
<span className="... bg-dodoria/10 text-dodoria border-dodoria/20">Overdue</span>
// AI evaluated
<span className="... bg-piccolo/10 text-piccolo border-piccolo/20">AI Scored</span>
// Manager override
<span className="... bg-hit/10 text-hit border-hit/20">Overridden</span>
```

### 4.5 Table (Reports, Employees)

```tsx
<div className="bg-goten border border-beerus rounded-moon-s-md overflow-hidden shadow-moon-xs">
  <table className="min-w-full divide-y divide-beerus">
    <thead className="bg-gohan">
      <tr>
        <th className="px-6 py-3 text-left text-moon-12 font-semibold text-trunks uppercase tracking-wider">
          Employee
        </th>
        <th className="px-6 py-3 text-left text-moon-12 font-semibold text-trunks uppercase tracking-wider">
          Score
        </th>
        <th className="px-6 py-3 text-left text-moon-12 font-semibold text-trunks uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-right text-moon-12 font-semibold text-trunks uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-goten divide-y divide-beerus">
      <tr className="hover:bg-gohan/50 transition-colors">
        <td className="px-6 py-4 text-moon-14 text-bulma">John Doe</td>
        <td className="px-6 py-4">
          <span className="inline-flex ... bg-roshi/10 text-roshi">8.5/10</span>
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex ... bg-roshi/10 text-roshi">On Time</span>
        </td>
        <td className="px-6 py-4 text-right">
          <button className="text-piccolo hover:text-piccolo/80 text-moon-14 font-medium">
            View
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 4.6 Modal / Dialog

Preline handles modal interactivity via `data-hs-overlay` attributes and `preline.js`:

```tsx
// Modal trigger
<button
  type="button"
  data-hs-overlay="#modal-invite"
  className="py-2 px-4 ... bg-piccolo text-white rounded-moon-i-sm"
>
  Invite User
</button>

// Modal markup
<div id="modal-invite"
  className="hs-overlay hidden size-full fixed top-0 start-0 z-[80]
             overflow-x-hidden overflow-y-auto pointer-events-none">
  <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500
                  mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto">
    <div className="bg-goten border border-beerus rounded-moon-s-xl shadow-moon-xl
                    pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center py-4 px-6 border-b border-beerus">
        <h3 className="text-moon-20 font-semibold text-bulma">Invite Team Member</h3>
        <button
          type="button"
          data-hs-overlay="#modal-invite"
          className="text-trunks hover:text-bulma transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {/* Body */}
      <div className="p-6 space-y-4">
        {/* form fields */}
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-3 py-4 px-6 border-t border-beerus">
        <button data-hs-overlay="#modal-invite"
          className="py-2 px-4 ... border border-beerus bg-goten text-bulma rounded-moon-i-sm">
          Cancel
        </button>
        <button className="py-2 px-4 ... bg-piccolo text-white rounded-moon-i-sm">
          Send Invitation
        </button>
      </div>
    </div>
  </div>
</div>
```

### 4.7 Sidebar Navigation

```tsx
<aside className="w-64 min-h-screen bg-gohan border-r border-beerus flex flex-col">
  {/* Logo */}
  <div className="px-6 py-5 border-b border-beerus">
    <span className="text-moon-20 font-semibold text-bulma">Performance Tracker</span>
  </div>

  {/* Nav items */}
  <nav className="flex-1 px-3 py-4 space-y-1">
    {/* Active item */}
    <a href="/dashboard"
      className="flex items-center gap-3 px-3 py-2.5 rounded-moon-i-sm
                 bg-piccolo/10 text-piccolo text-moon-14 font-medium">
      <LayoutDashboard className="w-5 h-5" />
      Dashboard
    </a>
    {/* Inactive item */}
    <a href="/reports"
      className="flex items-center gap-3 px-3 py-2.5 rounded-moon-i-sm
                 text-trunks text-moon-14 font-medium
                 hover:bg-gohan hover:text-bulma transition-colors">
      <FileText className="w-5 h-5" />
      All Reports
    </a>
  </nav>

  {/* Bottom user section */}
  <div className="px-3 py-4 border-t border-beerus">
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="w-8 h-8 rounded-full bg-piccolo flex items-center justify-center
                      text-goten text-moon-12 font-semibold shrink-0">
        JD
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-moon-14 font-medium text-bulma truncate">John Doe</p>
        <p className="text-moon-12 text-trunks truncate">Manager</p>
      </div>
    </div>
  </div>
</aside>
```

### 4.8 Page Header

```tsx
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-moon-32 font-semibold text-bulma">Dashboard</h1>
    <p className="text-moon-16 text-trunks mt-1">
      Performance overview for your team
    </p>
  </div>
  <div className="flex items-center gap-3">
    <button className="py-2 px-4 ... border border-beerus bg-goten text-bulma rounded-moon-i-sm">
      Export
    </button>
    <button className="py-2 px-4 ... bg-piccolo text-white rounded-moon-i-sm">
      + Add Project
    </button>
  </div>
</div>
```

### 4.9 Dropdown (Preline plugin)

```tsx
<div className="hs-dropdown relative inline-flex">
  <button type="button" className="hs-dropdown-toggle py-2 px-4 inline-flex items-center gap-2
                                    text-moon-14 text-bulma border border-beerus rounded-moon-i-sm
                                    bg-goten hover:bg-gohan transition-colors">
    Actions
    <ChevronDown className="w-4 h-4 text-trunks" />
  </button>

  <div className="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100
                  opacity-0 hidden z-10 mt-2 min-w-40 bg-goten shadow-moon-md rounded-moon-s-md
                  border border-beerus">
    <div className="p-1 space-y-0.5">
      <a href="#"
        className="flex items-center gap-2 py-2 px-3 rounded-moon-i-xs
                   text-moon-14 text-bulma hover:bg-gohan transition-colors">
        <Eye className="w-4 h-4 text-trunks" /> View
      </a>
      <a href="#"
        className="flex items-center gap-2 py-2 px-3 rounded-moon-i-xs
                   text-moon-14 text-bulma hover:bg-gohan transition-colors">
        <Pencil className="w-4 h-4 text-trunks" /> Edit
      </a>
      <hr className="border-beerus my-1" />
      <a href="#"
        className="flex items-center gap-2 py-2 px-3 rounded-moon-i-xs
                   text-moon-14 text-dodoria hover:bg-dodoria/10 transition-colors">
        <Trash2 className="w-4 h-4" /> Delete
      </a>
    </div>
  </div>
</div>
```

### 4.10 Tab Navigation (within pages)

```tsx
<div className="border-b border-beerus mb-6">
  <nav className="flex gap-0 -mb-px">
    {/* Active tab */}
    <button className="px-5 py-3 text-moon-14 font-medium text-piccolo
                        border-b-2 border-piccolo whitespace-nowrap">
      Overview
    </button>
    {/* Inactive tab */}
    <button className="px-5 py-3 text-moon-14 font-medium text-trunks
                        border-b-2 border-transparent hover:text-bulma hover:border-beerus
                        transition-colors whitespace-nowrap">
      All Reports
    </button>
  </nav>
</div>
```

### 4.11 Avatar

```tsx
// With image
<img
  src="/avatar.jpg"
  alt="John Doe"
  className="w-10 h-10 rounded-full object-cover border-2 border-beerus"
/>

// Initials fallback
<div className="w-10 h-10 rounded-full bg-piccolo flex items-center justify-center
                text-goten text-moon-14 font-semibold shrink-0">
  JD
</div>

// Sizes: w-8 h-8 (sm) | w-10 h-10 (md) | w-12 h-12 (lg) | w-16 h-16 (xl)
```

### 4.12 Score Display

Specific to this app — score visualization:

```tsx
// Large score display (report detail)
<div className="flex items-center gap-3">
  <span className="text-moon-48 font-semibold text-bulma">8.75</span>
  <span className="text-moon-20 text-trunks">/10</span>
</div>

// Criterion breakdown row
<div className="flex items-center justify-between py-3 border-b border-beerus last:border-0">
  <div>
    <p className="text-moon-14 font-medium text-bulma">Code Quality</p>
    <p className="text-moon-12 text-trunks">Weight: 40%</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Progress bar */}
    <div className="w-24 bg-beerus rounded-full h-1.5">
      <div
        className="bg-roshi h-1.5 rounded-full"
        style={{ width: `${(score / 10) * 100}%` }}
      />
    </div>
    <span className="text-moon-14 font-semibold text-bulma w-12 text-right">
      9.0/10
    </span>
  </div>
</div>

// Inline score badge (in tables)
function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 8 ? 'bg-roshi/10 text-roshi border-roshi/20'
    : score >= 6 ? 'bg-piccolo/10 text-piccolo border-piccolo/20'
    : score >= 4 ? 'bg-krillin/10 text-krillin border-krillin/20'
    : 'bg-dodoria/10 text-dodoria border-dodoria/20';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                       text-moon-12 font-medium border ${cls}`}>
      {score.toFixed(1)}/10
    </span>
  );
}
```

### 4.13 AI Feature UI

Specific to this app — AI evaluation display:

```tsx
// AI feedback panel
<div className="bg-piccolo/5 border border-piccolo/20 rounded-moon-s-md p-5">
  <div className="flex items-center gap-2 mb-3">
    <Sparkles className="w-5 h-5 text-piccolo" />
    <span className="text-moon-14 font-semibold text-piccolo">AI Feedback</span>
    <span className="text-moon-12 text-trunks ml-auto">Gemini 2.5 Flash</span>
  </div>
  <p className="text-moon-14 text-bulma leading-relaxed">{feedback}</p>
</div>

// Manager override indicator
<div className="flex items-center gap-2 mt-2">
  <div className="w-2 h-2 rounded-full bg-hit" />
  <span className="text-moon-12 text-trunks">
    Score overridden by manager from {originalScore.toFixed(1)} to {finalScore.toFixed(1)}
  </span>
</div>

// Loading state for AI evaluation
<div className="flex items-center gap-3 py-4">
  <div className="w-5 h-5 rounded-full border-2 border-piccolo border-t-transparent animate-spin" />
  <span className="text-moon-14 text-trunks">Evaluating with Gemini...</span>
</div>
```

---

## 5. Icon System

Lucide React is the icon library. All icon imports from `lucide-react`.

```tsx
import {
  LayoutDashboard, FolderOpen, Target, FileText, Users,
  Settings, Plus, Pencil, Trash2, Eye, X, ChevronDown,
  ChevronRight, Search, Filter, Download, Sparkles,
  TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle,
  BarChart2, Award, Send
} from 'lucide-react';
```

### Icon Sizing

| Context | Size | Tailwind |
|---|---|---|
| Inline with XS text | 12px | `w-3 h-3` |
| Inline with SM text | 16px | `w-4 h-4` |
| Standard / default | 20px | `w-5 h-5` |
| Navigation items | 20px | `w-5 h-5` |
| Feature icon | 24px | `w-6 h-6` |
| Hero / large display | 32px | `w-8 h-8` |

### Icon Color Mapping

```tsx
className="text-piccolo"   // primary brand icons, AI features
className="text-bulma"     // default / active icons
className="text-trunks"    // secondary / muted icons
className="text-roshi"     // success / positive icons
className="text-dodoria"   // error / delete / destructive icons
className="text-krillin"   // warning / late submission icons
className="text-hit"       // override / accent icons
className="text-beerus"    // disabled / placeholder icons
```

---

## 6. Recharts Integration (Dashboard Charts)

Charts use Recharts with Moon DS colors applied.

```tsx
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Performance trend chart
<ResponsiveContainer width="100%" height={240}>
  <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
    <CartesianGrid
      strokeDasharray="3 3"
      stroke="hsl(var(--beerus))"
      vertical={false}
    />
    <XAxis
      dataKey="date"
      tick={{ fontSize: 12, fill: 'hsl(var(--trunks))' }}
      axisLine={{ stroke: 'hsl(var(--beerus))' }}
      tickLine={false}
    />
    <YAxis
      domain={[0, 10]}
      tick={{ fontSize: 12, fill: 'hsl(var(--trunks))' }}
      axisLine={false}
      tickLine={false}
    />
    <Tooltip
      contentStyle={{
        backgroundColor: 'hsl(var(--goten))',
        border: '1px solid hsl(var(--beerus))',
        borderRadius: 'var(--moon-s-sm)',
        boxShadow: '0 4px 8px rgb(0 0 0 / 0.10)',
        fontSize: 13,
        color: 'hsl(var(--bulma))',
      }}
    />
    <Line
      type="monotone"
      dataKey="score"
      stroke="hsl(var(--piccolo))"
      strokeWidth={2}
      dot={{ fill: 'hsl(var(--piccolo))', r: 4 }}
      activeDot={{ r: 6, fill: 'hsl(var(--piccolo))' }}
    />
  </LineChart>
</ResponsiveContainer>

// Standard colors to use in charts
const CHART_COLORS = {
  primary:   'hsl(var(--piccolo))',
  success:   'hsl(var(--roshi))',
  warning:   'hsl(var(--krillin))',
  error:     'hsl(var(--dodoria))',
  accent:    'hsl(var(--hit))',
  muted:     'hsl(var(--trunks))',
  grid:      'hsl(var(--beerus))',
};
```

---

## 7. Supabase Service Layer

### 7.1 Client Setup

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 7.2 Service Pattern

All database logic lives in `src/services/databaseService.ts`.
Never write Supabase queries directly in components.

```ts
// Pattern for all service functions
export const reportService = {
  async getByEmployeeId(employeeId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        goals(name, projects(name)),
        report_criterion_scores(*)
      `)
      .eq('employee_id', employeeId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(report: ReportInsert) {
    const { data, error } = await supabase
      .from('reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
```

### 7.3 Key Database Tables Reference

```
organizations              — tenant isolation (always filter by org_id)
employees                  — users, roles, manager hierarchy
projects                   — project definitions + reporting frequency
goals                      — performance goals (belong to projects)
criteria                   — evaluation criteria per goal (weights sum to 100)
reports                    — submitted reports (employee → goal)
report_criterion_scores    — per-criterion AI scores
invitations                — token-based onboarding invites
employee_permissions       — granular permission flags per employee
project_assignees          — many-to-many: projects ↔ employees
manager_settings           — manager-level config
```

### 7.4 Row-Level Security Pattern

Always include `organization_id` filter in queries — Supabase RLS enforces this,
but also include it explicitly for clarity:

```ts
.eq('organization_id', currentUser.organization_id)
```

---

## 8. Gemini AI Service

### 8.1 Model Selection

```ts
// src/services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Use Flash for fast operations (evaluation, feedback)
const flashModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Use Pro for deep analysis (insights, summaries)
const proModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
```

### 8.2 Service Functions Reference

```ts
// Evaluate a submitted report against criteria
evaluateReport(reportText: string, criteria: Criterion[]): Promise<EvaluationResult>
// Returns: { overallScore, criterionScores: { id, score, reasoning }[], summary }

// Get pre-submission writing feedback
getReportFeedback(reportText: string, criteria: Criterion[]): Promise<string>
// Returns: constructive feedback string

// Generate team performance insights (Pro model)
generateInsights(reports: Report[]): Promise<InsightsResult>
// Returns: { strengths: string[], improvements: string[], trends: string }

// Generate narrative summary for a period (Pro model)
generatePerformanceSummary(employee: Employee, reports: Report[]): Promise<string>
// Returns: narrative summary string
```

### 8.3 Error Handling Pattern

```ts
// Always wrap Gemini calls with try/catch and surface errors in UI
try {
  const evaluation = await evaluateReport(text, criteria);
  setEvaluation(evaluation);
} catch (error) {
  // Show error state using dodoria color
  setError('AI evaluation failed. Please try again.');
}
```

---

## 9. Project File Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── PageHeader.tsx
│   │   └── AppShell.tsx
│   ├── ui/              # Generic Moon DS + Preline atoms
│   │   ├── ScoreBadge.tsx
│   │   ├── StatusChip.tsx
│   │   ├── Avatar.tsx
│   │   └── EmptyState.tsx
│   ├── charts/
│   │   ├── PerformanceTrendChart.tsx
│   │   └── ScoreBreakdownChart.tsx
│   └── ai/
│       ├── AIFeedbackPanel.tsx
│       └── EvaluationDisplay.tsx
├── pages/               # Route-level components
│   ├── Dashboard.tsx    # /dashboard
│   ├── Projects.tsx     # /projects
│   ├── Goals.tsx        # /goals
│   ├── SubmitReport.tsx # /submit
│   ├── Reports.tsx      # /reports
│   ├── Employees.tsx    # /employees
│   └── Settings.tsx     # /settings
├── services/
│   ├── databaseService.ts   # All Supabase queries
│   ├── geminiService.ts     # All Gemini AI calls
│   └── invitationService.ts # Invitation flow
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useReports.ts
│   └── usePermissions.ts
├── lib/
│   └── supabase.ts      # Supabase client
├── utils/               # Pure utility functions
├── types.ts             # All TypeScript types
├── constants.ts         # Enums, sample data
└── main.tsx
```

---

## 10. Permission Guard Pattern

```tsx
// Use permission checks before rendering management UI
function PermissionGuard({ permission, children }: {
  permission: keyof EmployeePermissions;
  children: React.ReactNode;
}) {
  const { permissions } = useAuth();
  if (!permissions[permission]) return null;
  return <>{children}</>;
}

// Usage
<PermissionGuard permission="can_manage_projects">
  <button className="py-2 px-4 ... bg-piccolo text-white rounded-moon-i-sm">
    + New Project
  </button>
</PermissionGuard>
```

---

## 11. Page Layout Shell

```tsx
// Standard page wrapper
function PageLayout({ title, description, actions, children }: PageLayoutProps) {
  return (
    <div className="flex-1 p-8 overflow-auto bg-goku">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-moon-32 font-semibold text-bulma">{title}</h1>
          {description && (
            <p className="text-moon-16 text-trunks mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
```

---

## 12. Strict Rules

### Always

- Use Moon DS semantic token names for every visible color
- Use `text-moon-{size}` for typography
- Use `rounded-moon-i-*` for interactive elements, `rounded-moon-s-*` for surfaces
- All DB calls go through `src/services/databaseService.ts`
- All AI calls go through `src/services/geminiService.ts`
- Score colors: ≥8 roshi, ≥6 piccolo, ≥4 krillin, <4 dodoria
- Use Lucide React for all icons, sized with `w-{n} h-{n}` Tailwind classes

### Never

```tsx
// ❌ Raw hex or arbitrary colors
className="bg-[#5C62F5]"
style={{ color: '#EF5451' }}

// ❌ Generic Tailwind palette colors for design-visible UI
className="bg-indigo-600"   // → bg-piccolo
className="text-gray-700"   // → text-bulma or text-trunks
className="border-gray-200" // → border-beerus
className="bg-white"        // → bg-goten
className="bg-gray-50"      // → bg-goku or bg-gohan
className="text-green-500"  // → text-roshi
className="text-red-500"    // → text-dodoria
className="text-yellow-400" // → text-krillin

// ❌ Non-Moon radius tokens
className="rounded-xl"      // → rounded-moon-s-lg
className="rounded-lg"      // → rounded-moon-s-md

// ❌ Supabase queries in components
const { data } = await supabase.from('reports').select(...) // → use databaseService

// ❌ Gemini calls in components
const result = await genAI.getGenerativeModel(...) // → use geminiService
```

---

## 13. Figma → Code Cheat Sheet

```
FIGMA TOKEN             →  TAILWIND CLASS
──────────────────────────────────────────────────────
Colors
piccolo                 →  bg-piccolo / text-piccolo / border-piccolo
hit                     →  bg-hit / text-hit
roshi                   →  bg-roshi / text-roshi
dodoria                 →  bg-dodoria / text-dodoria
krillin                 →  bg-krillin / text-krillin
goku                    →  bg-goku  (page bg)
gohan                   →  bg-gohan (sidebar / section bg)
goten                   →  bg-goten (card / white)
bulma                   →  text-bulma  (primary text)
trunks                  →  text-trunks (secondary text)
beerus                  →  border-beerus / bg-beerus
popo                    →  text-popo / bg-popo

Typography
Heading MD (32px)       →  text-moon-32 font-semibold
Heading SM (24px)       →  text-moon-24 font-semibold
Heading XS (20px)       →  text-moon-20 font-semibold
Body MD (16px)          →  text-moon-16
Body SM (14px)          →  text-moon-14
Body XS (12px)          →  text-moon-12

Spacing
4px                     →  gap-1 / p-1 / m-1
8px                     →  gap-2 / p-2 / m-2
12px                    →  gap-3 / p-3 / m-3
16px                    →  gap-4 / p-4 / m-4
24px                    →  gap-6 / p-6 / m-6
32px                    →  gap-8 / p-8 / m-8

Border Radius
Interactive SM          →  rounded-moon-i-sm  (buttons, inputs)
Interactive MD          →  rounded-moon-i-md  (large buttons)
Surface MD              →  rounded-moon-s-md  (cards)
Surface LG              →  rounded-moon-s-lg  (panels)
Surface XL              →  rounded-moon-s-xl  (modals)
Full                    →  rounded-full       (avatars, pills)

Shadows
Card                    →  shadow-moon-xs / shadow-moon-sm
Modal                   →  shadow-moon-lg / shadow-moon-xl
```

---

## 14. Environment Variables

```env
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

## 15. Project Links

- **Lovable Project:** https://lovable.dev/projects/355310c2-f707-47d6-8fd7-593093888f8e
- **GitHub Repo:** https://github.com/RezaAlHassan/zevian-ai
- **Figma Design:** https://www.figma.com/community/file/1002945721703152933/moon-design-system-v1
- **Moon DS Docs:** https://moon.io/docs
- **Preline UI Docs:** https://preline.co/docs
- **Lucide Icons:** https://lucide.dev/icons
- **Recharts Docs:** https://recharts.org
- **Supabase Docs:** https://supabase.com/docs

---

*Last updated: February 2026 | Stack: Vite 6 + React 19 + TypeScript + Preline UI + Tailwind | Moon DS v1 tokens*