export interface FilamentColorsResponse {
	filaments: Filament[];
}

export interface Filament {
	filament: string;
	hexColor: string;
	colorTag: string;
}

export enum FilamentType {
	PLA = 'PLA',
	PETG = 'PETG',
}
