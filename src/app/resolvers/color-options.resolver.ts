import { environment } from '../../environments/environment';
import { FilamentColorsResponse } from '../types/filament';

interface FilamentColorsV2Response {
	success: boolean;
	message: string;
	data: FilamentColorsResponse[];
	count: number;
	lastUpdated: string;
}

export const colorOptionsResolver = async () => {
	const url = new URL(`${environment.baseurl}/v2/colors`);
	url.searchParams.set('filamentType', 'PLA');

	const res = await fetch(url.toString(), {
		credentials: 'include', // Equivalent to withCredentials: true for fetch
	});
	const body = (await res.json()) as FilamentColorsV2Response;

	return body.data;
};
