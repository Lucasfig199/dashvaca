import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'poppins': ['Poppins', 'system-ui', 'sans-serif'],
				'sans': ['Poppins', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				/* Page-specific theme colors */
				'expenses-primary': 'hsl(var(--expenses-primary))',
				'expenses-secondary': 'hsl(var(--expenses-secondary))',
				'expenses-accent': 'hsl(var(--expenses-accent))',
				'expenses-bg': 'hsl(var(--expenses-bg))',
				'expenses-border': 'hsl(var(--expenses-border))',
				'expenses-hover': 'hsl(var(--expenses-hover))',
				
				'profits-primary': 'hsl(var(--profits-primary))',
				'profits-secondary': 'hsl(var(--profits-secondary))',
				'profits-accent': 'hsl(var(--profits-accent))',
				'profits-bg': 'hsl(var(--profits-bg))',
				'profits-border': 'hsl(var(--profits-border))',
				'profits-hover': 'hsl(var(--profits-hover))',

				'production-primary': 'hsl(var(--production-primary))',
				'production-secondary': 'hsl(var(--production-secondary))',
				'production-accent': 'hsl(var(--production-accent))',
				'production-bg': 'hsl(var(--production-bg))',
				'production-border': 'hsl(var(--production-border))',
				'production-hover': 'hsl(var(--production-hover))',

				'vacas-primary': 'hsl(var(--vacas-primary))',
				'vacas-secondary': 'hsl(var(--vacas-secondary))',
				'vacas-accent': 'hsl(var(--vacas-accent))',
				'vacas-bg': 'hsl(var(--vacas-bg))',
				'vacas-border': 'hsl(var(--vacas-border))',
				'vacas-hover': 'hsl(var(--vacas-hover))',

				'historico-primary': 'hsl(var(--historico-primary))',
				'historico-secondary': 'hsl(var(--historico-secondary))',
				'historico-accent': 'hsl(var(--historico-accent))',
				'historico-bg': 'hsl(var(--historico-bg))',
				'historico-border': 'hsl(var(--historico-border))',
				'historico-hover': 'hsl(var(--historico-hover))'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-expenses': 'var(--gradient-expenses)',
				'gradient-expenses-hover': 'var(--gradient-expenses-hover)',
				'gradient-profits': 'var(--gradient-profits)',
				'gradient-profits-hover': 'var(--gradient-profits-hover)',
				'gradient-production': 'var(--gradient-production)',
				'gradient-production-hover': 'var(--gradient-production-hover)',
				'gradient-vacas': 'var(--gradient-vacas)',
				'gradient-vacas-hover': 'var(--gradient-vacas-hover)',
				'gradient-historico': 'var(--gradient-historico)',
				'gradient-historico-hover': 'var(--gradient-historico-hover)',
				'gradient-purple': 'var(--gradient-purple)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-subtle': 'var(--gradient-subtle)',
				'home-gradient-1': 'var(--home-gradient-1)',
				'home-gradient-2': 'var(--home-gradient-2)',
				'home-gradient-3': 'var(--home-gradient-3)',
				'home-gradient-4': 'var(--home-gradient-4)'
			},
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)', 
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)'
			},
			transitionProperty: {
				'smooth': 'var(--transition-smooth)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
