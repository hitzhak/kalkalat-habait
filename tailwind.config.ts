import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'var(--font-heebo)',
  				'sans-serif'
  			]
  		},
  		colors: {
  			primary: {
  				'50': '#E6F4FF',
  				'100': '#CCE5FF',
  				'200': '#99CBFF',
  				'300': '#66B1FF',
  				'400': '#3397FF',
  				'500': '#0073EA',
  				'600': '#0060C2',
  				'700': '#004DA0',
  				'800': '#003A78',
  				'900': '#002750',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			income: {
  				'50': '#E6FAF0',
  				'100': '#B3F1D6',
  				'200': '#80E8BC',
  				'300': '#4DDFA2',
  				'400': '#1AD688',
  				'500': '#00C875',
  				'600': '#00A861',
  				'700': '#00884E',
  				'800': '#00683A',
  				'900': '#004827',
  				DEFAULT: '#00C875'
  			},
  			expense: {
  				'50': '#FDE8EB',
  				'100': '#F9BCC4',
  				'200': '#F5909D',
  				'300': '#F16476',
  				'400': '#E94A60',
  				'500': '#E2445C',
  				'600': '#C93B51',
  				'700': '#A83044',
  				'800': '#872637',
  				'900': '#661C2A',
  				DEFAULT: '#E2445C'
  			},
  			warning: {
  				'50': '#FFF5E6',
  				'100': '#FEE5B8',
  				'200': '#FED58A',
  				'300': '#FDC55C',
  				'400': '#FDB53E',
  				'500': '#FDAB3D',
  				'600': '#D48F33',
  				'700': '#AB7329',
  				'800': '#82571F',
  				'900': '#593B15',
  				DEFAULT: '#FDAB3D'
  			},
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
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
