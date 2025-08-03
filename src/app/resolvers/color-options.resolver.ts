import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { environment } from '../../environments/environment';

interface FilamentColorsResponse {
  filaments: Filament[];
}

interface Filament {
  filament: string;
  hexColor: string;
  colorTag: string;
  profile: string;
}

export const colorOptionsResolver = async () => {
  const url = new URL(`${environment.baseurl}/colors`);
  url.searchParams.set('filamentType', 'PLA');

  const res = await fetch(url.toString());
  const data: FilamentColorsResponse = await res.json();

  return data
};
