// API response shape for a single filament/color entry
export interface FilamentResponse {
  name: string;
  provider: string;
  public: boolean;
  available: boolean;
  color: string;
  profile: string;
  hexValue: string; // e.g. "#ffffff"
  publicId: string;
}

// Client-facing normalized filament shape used in the UI
export interface Filament {
  filament: string;
  hexColor: string;
  colorTag: string;
}

export interface FilamentColorsResponse {
  filaments: Filament[];
}

export enum FilamentType {
  PLA = 'PLA',
  PETG = 'PETG',
}
