/**
 * Shared Tailwind preset for every OmniPOS surface (admin-web, pos-app).
 *
 * Theming strategy: every semantic colour is a CSS custom property holding
 * space-separated RGB channels. `:root` declares the light palette and `.dark`
 * overrides it, so a single set of utility classes (e.g. `bg-surface`) renders
 * correctly in both themes. Because the channels are bare numbers, Tailwind's
 * `<alpha-value>` placeholder keeps opacity modifiers working
 * (`bg-surface/90`, `border-line/60`, ...).
 */

const plugin = require('tailwindcss/plugin');

/** Wrap a custom property so Tailwind can apply opacity modifiers. */
const token = name => `rgb(var(${name}) / <alpha-value>)`;

const tokens = {
  /*
   * Supplied palette. The nine given hues are marked SPEC; the remaining
   * neutrals are derived from them so the whole scale stays in one family.
   *
   * Note this supersedes the earlier "no pure black or white" rule. The spec
   * asks for #FFFFFF surfaces. Body text is still never pure black (#171A2B),
   * and the canvas is tinted (#F7F7FC), so the interface still avoids the flat
   * black-on-white document look — but surfaces are now genuinely white.
   */
  light: {
    // SPEC background #F7F7FC / surface #FFFFFF / text #171A2B / border #E8E8F2
    '--c-canvas': '247 247 252',
    // Pure white per spec. This reverses the earlier "no pure white" rule on
    // purpose: the spec is explicit, and against a tinted canvas it gives the
    // crispest possible separation. On a glossy low-contrast till panel it can
    // read as glare — `--c-surface` is the single token to pull back if so.
    '--c-surface': '255 255 255',
    '--c-surface-2': '241 241 249',
    '--c-surface-3': '235 235 245',
    '--c-surface-4': '226 226 239',
    '--c-line': '232 232 242',
    '--c-line-strong': '214 214 230',
    '--c-fg': '23 26 43',
    // SPEC secondary text #667085
    '--c-fg-muted': '102 112 133',
    '--c-fg-subtle': '152 160 179',
    '--c-fg-on-brand': '255 255 255',
    '--c-fg-on-solid': '255 255 255',
    '--c-overlay': '20 22 38',
    // Navy-tinted rather than neutral black, so shadows stay in the same light
    // as the surfaces instead of muddying them.
    '--c-shadow': '30 33 60',

    // Brand — SPEC primary #5B5FEF, hover/active SPEC primary dark #4144C7
    '--c-brand': '91 95 239',
    '--c-brand-hover': '65 68 199',
    '--c-brand-soft': '238 238 253',
    '--c-brand-fg': '65 68 199',
    '--c-brand-line': '201 202 249',

    // SPEC success emerald #10B981
    '--c-success': '16 185 129',
    '--c-success-soft': '231 248 241',
    '--c-success-fg': '10 127 90',
    '--c-success-line': '180 233 211',

    // SPEC info cyan #06B6D4
    '--c-info': '6 182 212',
    '--c-info-soft': '228 247 252',
    '--c-info-fg': '10 126 147',
    '--c-info-line': '178 230 242',

    // SPEC accent 2 amber #FBBF24. The `fg` is a darkened amber: the SPEC hex
    // measures ~1.8:1 on its own soft tint, so it is a fill, never body text.
    '--c-warning': '251 191 36',
    '--c-warning-soft': '254 245 225',
    '--c-warning-fg': '176 106 8',
    '--c-warning-line': '252 227 166',

    // SPEC accent coral #FF6B6B, reused as the danger hue
    '--c-danger': '255 107 107',
    '--c-danger-soft': '255 236 236',
    '--c-danger-fg': '192 52 47',
    '--c-danger-line': '255 201 201',

    // SPEC secondary violet #8B5CF6
    '--c-accent': '139 92 246',
    '--c-accent-soft': '243 238 254',
    '--c-accent-fg': '109 63 212',
    '--c-accent-line': '220 204 251'
  },

  dark: {
    // No dark values were supplied, so this is the same hue set re-taken down
    // to dark surfaces rather than a generic slate. Canvas is #101227, not
    // black: a true black floor reads as a dead void on a dim register.
    '--c-canvas': '16 18 39',
    '--c-surface': '23 26 43',
    '--c-surface-2': '20 22 42',
    '--c-surface-3': '35 39 65',
    '--c-surface-4': '46 51 82',
    '--c-line': '42 46 74',
    '--c-line-strong': '58 63 99',
    '--c-fg': '242 243 249',
    '--c-fg-muted': '169 176 199',
    '--c-fg-subtle': '123 130 160',
    // Dark navy on the lightened brand. White on this indigo measures 3.4:1;
    // navy measures 5.1:1 and keeps the SPEC's text colour in play.
    '--c-fg-on-brand': '23 26 43',
    '--c-fg-on-solid': '242 243 249',
    '--c-overlay': '8 9 18',
    '--c-shadow': '4 4 10',

    '--c-brand': '123 127 245',
    '--c-brand-hover': '142 146 248',
    '--c-brand-soft': '34 38 74',
    '--c-brand-fg': '165 168 250',
    '--c-brand-line': '58 63 122',

    '--c-success': '52 211 153',
    '--c-success-soft': '12 50 39',
    '--c-success-fg': '110 231 183',
    '--c-success-line': '20 80 60',

    '--c-info': '34 211 238',
    '--c-info-soft': '11 46 58',
    '--c-info-fg': '103 232 249',
    '--c-info-line': '18 69 90',

    '--c-warning': '251 191 36',
    '--c-warning-soft': '58 44 10',
    '--c-warning-fg': '252 211 77',
    '--c-warning-line': '107 78 18',

    '--c-danger': '248 113 113',
    '--c-danger-soft': '64 26 28',
    '--c-danger-fg': '252 165 165',
    '--c-danger-line': '122 46 46',

    '--c-accent': '167 139 250',
    '--c-accent-soft': '36 30 68',
    '--c-accent-fg': '196 181 253',
    '--c-accent-line': '66 57 122'
  }
};

/**
 * Build the semantic colour scale exposed to utility classes. `withHover` is
 * reserved for the brand, the only colour that gets a dedicated hover shade.
 */
const statusScale = (name, { withHover = false } = {}) => ({
  DEFAULT: token(`--c-${name}`),
  soft: token(`--c-${name}-soft`),
  fg: token(`--c-${name}-fg`),
  line: token(`--c-${name}-line`),
  ...(withHover ? { hover: token(`--c-${name}-hover`) } : {})
});

const themeVars = plugin(({ addBase }) => {
  addBase({
    ':root': {
      ...tokens.light,
      colorScheme: 'light'
    },
    '.dark': {
      ...tokens.dark,
      colorScheme: 'dark'
    },

    // The app defaults to light, so the OS preference is deliberately NOT used
    // as a fallback here. Without this block, terminals with a dark OS setting
    // would boot dark before the theme script ran, then flip to light.

    // The theme provider keeps this in sync with the resolved theme so native
    // UI (scrollbars, form controls, overscroll) matches.
    'html[data-theme]': {
      colorScheme: 'inherit'
    },

    '*': {
      borderColor: 'rgb(var(--c-line) / 1)'
    },

    body: {
      backgroundColor: 'rgb(var(--c-canvas) / 1)',
      color: 'rgb(var(--c-fg) / 1)'
    },

    // Visible, consistent keyboard focus across both themes.
    ':focus-visible': {
      outline: '2px solid rgb(var(--c-brand) / 0.9)',
      outlineOffset: '2px'
    },

    '::selection': {
      backgroundColor: 'rgb(var(--c-brand) / 0.25)'
    },

    // Scrollbars tuned for touch terminals — the original chrome is illegible
    // in light mode, so derive it from the tokens instead.
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px'
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: 'rgb(var(--c-surface-2) / 0.6)'
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgb(var(--c-line-strong) / 0.9)',
      borderRadius: '9999px'
    },
    '::-webkit-scrollbar-thumb:hover': {
      backgroundColor: 'rgb(var(--c-fg-subtle) / 1)'
    },

    // Honour reduced-motion for the animations defined below.
    '@media (prefers-reduced-motion: reduce)': {
      '*, *::before, *::after': {
        animationDuration: '0.01ms !important',
        animationIterationCount: '1 !important',
        transitionDuration: '0.01ms !important',
        scrollBehavior: 'auto !important'
      }
    }
  });
});

/** Hide scrollbars on horizontally scrollable chip rows. */
const scrollbarNone = plugin(({ addUtilities }) => {
  addUtilities({
    '.scrollbar-none': {
      scrollbarWidth: 'none',
      '-ms-overflow-style': 'none',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    },
    // Keep a scrollbar reserved to stop layout shift when content grows.
    '.scrollbar-gutter-stable': {
      scrollbarGutter: 'stable'
    },
    // A brand hairline along the bottom of a header. Gives the top of the POS
    // a clear anchor and ties the copper accent into surfaces that otherwise
    // stay entirely neutral, without tinting a whole panel.
    '.brand-edge': {
      boxShadow: 'inset 0 -2px 0 0 rgb(var(--c-brand) / 1)'
    },
    // Raised surface: the border plus a shadow, so a card separates from the
    // canvas by lighting rather than by a heavier outline.
    '.surface-raised': {
      boxShadow:
        'inset 0 1px 0 rgb(var(--c-shadow) / 0.04), 0 1px 2px rgb(var(--c-shadow) / 0.06), 0 2px 8px rgb(var(--c-shadow) / 0.05)'
    }
  });
});

module.exports = {
  darkMode: 'class',
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px'
    },
    extend: {
      colors: {
        canvas: token('--c-canvas'),
        surface: {
          DEFAULT: token('--c-surface'),
          2: token('--c-surface-2'),
          3: token('--c-surface-3'),
          4: token('--c-surface-4')
        },
        line: {
          DEFAULT: token('--c-line'),
          strong: token('--c-line-strong')
        },
        fg: {
          DEFAULT: token('--c-fg'),
          muted: token('--c-fg-muted'),
          subtle: token('--c-fg-subtle'),
          'on-brand': token('--c-fg-on-brand'),
          // Text on saturated fills (danger, success). A separate token keeps
          // `text-white` — the one thing guaranteed to glare on a till — out
          // of the component layer entirely.
          'on-solid': token('--c-fg-on-solid')
        },
        brand: statusScale('brand', { withHover: true }),
        success: statusScale('success'),
        info: statusScale('info'),
        warning: statusScale('warning'),
        danger: statusScale('danger'),
        accent: statusScale('accent'),
        overlay: token('--c-overlay')
      },
      // Plus Jakarta Sans first: geometric enough to carry the brand (circular
      // bowls, tall x-height) without tipping into the single-storey 'a' of
      // fonts like Poppins that quietly hurt word legibility. It holds up at
      // both extremes this UI needs - 10px uppercase micro-labels in the
      // header, and 24px totals on the cart. The system stack behind it is a
      // real fallback, not a formality: if the webfont has not arrived, prices
      // still render in a sane face instead of a flash of invisible text.
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
        // Tabular-by-default mono so a clock ticking in the header does not
        // make the layout jitter.
        mono: [
          'ui-monospace',
          '"Cascadia Mono"',
          '"Segoe UI Mono"',
          'Menlo',
          'Consolas',
          'monospace'
        ]
      },
      // Tighter than Tailwind's defaults — rounded corners read as modern-app
      // styling, whereas a register/POS look wants crisper edges.
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '10px',
        '3xl': '14px'
      },
      // Depth is done with shadow layers rather than gradients. Gradients are
      // what make a UI look generated; stacked warm shadows on separated
      // neutrals give the same sense of physical stacking and survive being
      // printed or shown on a low-contrast till panel.
      boxShadow: {
        hairline: '0 1px 0 rgb(var(--c-shadow) / 0.05)',
        raised: '0 1px 2px rgb(var(--c-shadow) / 0.07), 0 2px 6px rgb(var(--c-shadow) / 0.05)',
        panel: '0 4px 12px rgb(var(--c-shadow) / 0.08), 0 1px 3px rgb(var(--c-shadow) / 0.06)',
        dock: '0 -8px 24px rgb(var(--c-shadow) / 0.12), 0 -1px 0 rgb(var(--c-shadow) / 0.06)'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'zoom-in-95': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' }
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' }
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' }
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' }
        },
        // Gentle nudge on the POS keyboard handle so the collapsed dock reads
        // as pullable without a permanent animation fatigue risk.
        'dock-hint': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '1' },
          '50%': { transform: 'translateY(-3px)', opacity: '0.65' }
        }
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'zoom-in-95': 'zoom-in-95 150ms ease-out',
        'slide-in-left': 'slide-in-left 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        'dock-hint': 'dock-hint 2.4s ease-in-out infinite'
      },
      spacing: {
        'safe-b': 'env(safe-area-inset-bottom, 0px)',
        'safe-t': 'env(safe-area-inset-top, 0px)',
        'safe-l': 'env(safe-area-inset-left, 0px)',
        'safe-r': 'env(safe-area-inset-right, 0px)'
      }
    }
  },
  plugins: [themeVars, scrollbarNone]
};
