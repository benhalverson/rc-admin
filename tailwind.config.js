/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,ts}'],
	theme: {
		extend: {
			colors: {
				carbon: '#141817',
				workmat: '#ECEAE1',
				porcelain: '#FAFAF7',
				galvanized: '#B8B2A3',
				filament: '#00A7B5',
				reject: '#C2410C',
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
					'0 1px 0 rgba(20, 24, 23, 0.05), 0 14px 32px rgba(20, 24, 23, 0.08)',
			},
		},
	},
	plugins: [],
};
