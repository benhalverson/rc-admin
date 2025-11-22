import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { environment } from '../../environments/environment';
import type { FilamentResponse } from '../types/filament';

interface FilamentColorsResponse {
  filaments: Filament[];
}

interface Filament {
  filament: string;
  hexColor: string;
  colorTag: string;
}
export const colorOptionsResolver = async () => {
  const url = new URL(`${environment.baseurl}/colors`);
  url.searchParams.set('filamentType', 'PLA');

  const res = await fetch(url.toString(), {
    credentials: 'include' // This is equivalent to withCredentials: true for fetch
  });
  const backend: FilamentResponse[] = await res.json();

  // Map backend shape to client-facing Filament shape
  const data: FilamentColorsResponse = {
    filaments: backend.map(b => ({
      filament: b.profile,
      hexColor: b.hexValue?.startsWith('#') ? b.hexValue : `#${b.hexValue}`,
      colorTag: b.color || b.name
    }))
  };

  return data;
};
