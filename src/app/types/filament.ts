export interface FilamentColorsResponse {
	name: string;
	provider: Provider;
	public: boolean;
	available: boolean;
	color: string;
	profile: Profile;
	hexValue: string;
	publicId: string;
}

export enum Profile {
	Petg = 'PETG',
	Pla = 'PLA',
}

export enum Provider {
	Polymaker = 'Polymaker',
	Slant3D = 'Slant 3D',
}
