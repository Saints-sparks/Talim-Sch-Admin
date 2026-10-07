import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// The portals' design tokens (Teachers and Students `tl-*`): CSS
  			// variables in globals.css, redefined for dark mode, as "r g b"
  			// channels so opacity modifiers work (`bg-tl-line/70`).
  			tl: {
  				bg: 'rgb(var(--tl-bg) / <alpha-value>)',
  				surface: 'rgb(var(--tl-surface) / <alpha-value>)',
  				subtle: 'rgb(var(--tl-subtle) / <alpha-value>)',
  				today: 'rgb(var(--tl-today) / <alpha-value>)',
  				ink: 'rgb(var(--tl-ink) / <alpha-value>)',
  				body: 'rgb(var(--tl-body) / <alpha-value>)',
  				muted: 'rgb(var(--tl-muted) / <alpha-value>)',
  				faint: 'rgb(var(--tl-faint) / <alpha-value>)',
  				line: 'rgb(var(--tl-line) / <alpha-value>)',
  				'line-soft': 'rgb(var(--tl-line-soft) / <alpha-value>)',
  				control: 'rgb(var(--tl-control) / <alpha-value>)',
  				brand: 'rgb(var(--tl-brand) / <alpha-value>)',
  				'brand-fill': 'rgb(var(--tl-brand-fill) / <alpha-value>)',
  				'brand-fill-hover': 'rgb(var(--tl-brand-fill-hover) / <alpha-value>)',
  				'on-brand': 'rgb(var(--tl-on-brand) / <alpha-value>)',
  				link: 'rgb(var(--tl-link) / <alpha-value>)',
  				select: 'rgb(var(--tl-select) / <alpha-value>)',
  				track: 'rgb(var(--tl-track) / <alpha-value>)',
  				success: 'rgb(var(--tl-success) / <alpha-value>)',
  				'success-bg': 'rgb(var(--tl-success-bg) / <alpha-value>)',
  				'success-soft': 'rgb(var(--tl-success-soft) / <alpha-value>)',
  				warning: 'rgb(var(--tl-warning) / <alpha-value>)',
  				'warning-bg': 'rgb(var(--tl-warning-bg) / <alpha-value>)',
  				danger: 'rgb(var(--tl-danger) / <alpha-value>)',
  				'danger-bg': 'rgb(var(--tl-danger-bg) / <alpha-value>)',
  				accent: 'rgb(var(--tl-accent) / <alpha-value>)',
  				'accent-bg': 'rgb(var(--tl-accent-bg) / <alpha-value>)',
  				now: 'rgb(var(--tl-now) / <alpha-value>)',
  				badge: 'rgb(var(--tl-badge) / <alpha-value>)'
  			},
  			// A stable per-item tone (avatars, class and subject chips), set by a
  			// `.tl-tone-N` class on the element or an ancestor.
  			tone: {
  				bg: 'rgb(var(--tone-bg) / <alpha-value>)',
  				fg: 'rgb(var(--tone-fg) / <alpha-value>)',
  				bd: 'rgb(var(--tone-bd) / <alpha-value>)'
  			}
  		},
  		// Text colours that miss WCAG AA (4.5:1) on white in the stock palette: the
  		// 400/500 greys (~2.5-4.8:1) and the 600 status colours (~3-4.4:1). Light mode
  		// reads them from variables (globals.css); dark mode keeps the stock values.
  		// Only text is affected: bg-, border- and ring- still use the stock palette.
  		textColor: {
  			gray: {
  				'400': 'rgb(var(--text-gray-400) / <alpha-value>)',
  				'500': 'rgb(var(--text-gray-500) / <alpha-value>)'
  			},
  			slate: {
  				'400': 'rgb(var(--text-slate-400) / <alpha-value>)',
  				'500': 'rgb(var(--text-slate-500) / <alpha-value>)'
  			},
  			green: { '600': 'rgb(var(--text-green-600) / <alpha-value>)' },
  			yellow: { '600': 'rgb(var(--text-yellow-600) / <alpha-value>)' },
  			red: { '600': 'rgb(var(--text-red-600) / <alpha-value>)' }
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-manrope)',
  				'Arial',
  				'Helvetica',
  				'sans-serif'
  			],
  			manrope: [
  				'var(--font-manrope)',
  				'Manrope',
  				'Arial',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
