export interface FilamentColorsResponse {
  filaments: Filament[];
}

export interface Filament {
  filament: FilamentType;
  hexColor: string;
  colorTag: string;
  profile: string;
}

export enum FilamentType {
  PLA = 'PLA',
  PETG = 'PETG',
}
