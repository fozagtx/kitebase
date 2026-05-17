/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/web/**/*.{ts,tsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'"Instrument Sans"',
  				'system-ui',
  				'sans-serif'
  			],
  			serif: [
  				'"Instrument Serif"',
  				'Georgia',
  				'serif'
  			],
  			mono: [
  				'"Space Mono"',
  				'ui-monospace',
  				'monospace'
  			]
  		},
  		colors: {
  			navy: {
  				'300': '#777F8B',
  				'400': '#8F9FB8',
  				DEFAULT: '#002259'
  			},
  			kbblue: {
  				'100': '#E9F3FF',
  				'150': '#D7E7FE',
  				'200': '#D3E8FF',
  				'300': '#BDD7FF',
  				'500': '#79ADF8',
  				'600': '#155DFC',
  				'700': '#2670DC',
  				'900': '#0042AB'
  			},
  			nautral: {
  				'50': '#F7F7F9',
  				'100': '#FFFFFF',
  				'200': '#F4F9FF',
  				'300': '#E0E8F2',
  				'400': '#D1D9E6',
  				'500': '#8F9FB8',
  				'550': '#798AA6',
  				'600': '#777F8B',
  				'700': '#5F6B7C',
  				'800': '#3F4A61',
  				'900': '#002259'
  			},
  			skeleton: {
  				DEFAULT: '#EFF4F9',
  				dark: '#E5ECF3'
  			},
  			success: '#0DDE53',
  			error: '#EF4444'
  		},
  		borderRadius: {
  			xl: '0.75rem',
  			'2xl': '1rem',
  			'3xl': '1.5rem',
  			hero: '32px'
  		},
  		backgroundImage: {
  			sky: 'linear-gradient(rgb(189, 215, 255) 0%, rgb(255, 255, 255) 39.45%)',
  			cta: 'linear-gradient(rgb(0, 68, 185) 5.5%, rgb(0, 116, 236) 35%, rgb(78, 177, 255) 65%, rgb(173, 217, 255) 95%)'
  		},
  		boxShadow: {
  			card: 'rgba(255, 255, 255, 0.75) -4px -4px 6px 0px inset, rgba(255, 255, 255, 0.75) 4px 4px 6px 0px inset',
  			search: 'rgba(235, 243, 255, 0.75) -2px -2px 4px 0px inset, rgba(235, 243, 255, 0.75) 2px 2px 4px 0px inset'
  		},
  		letterSpacing: {
  			kbtight: '-0.5px'
  		},
  		transitionDuration: {
  			DEFAULT: '150ms'
  		},
  		transitionTimingFunction: {
  			DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)'
  		}
  	}
  },
  plugins: [],
};
