import { environment } from '../../environments/environment';
import { FilamentColorsResponse } from '../types/filament';

export const colorOptionsResolver = async () => {
	const url = new URL(`${environment.baseurl}/colors`);
	url.searchParams.set('filamentType', 'PLA');

	const res = await fetch(url.toString(), {
		credentials: 'include', // This is equivalent to withCredentials: true for fetch
	});
	const data: FilamentColorsResponse = await res.json();

	return data;
};
