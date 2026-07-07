/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,ts}'],
	theme: {
		extend: {
			colors: {
				ink: '#111827',
				workbench: '#F3F4F1',
				panel: '#FFFFFF',
				rail: '#D7D2C6',
				filament: '#2563EB',
				resin: '#B42318',
			},
			fontFamily: {
				display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui'],
				sans: ['Inter', 'ui-sans-serif', 'system-ui'],
				mono: [
					'"IBM Plex Mono"',
					'ui-monospace',
					'SFMono-Regular',
					'monospace',
				],
			},
			boxShadow: {
				panel:
					'0 1px 0 rgba(17, 24, 39, 0.04), 0 12px 30px rgba(17, 24, 39, 0.07)',
			},
		},
	},
	plugins: [],
};
