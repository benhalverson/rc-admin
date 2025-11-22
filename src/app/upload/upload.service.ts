import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

interface UploadResponse {
	message: string;
	key: string;
	url: string;
}

@Injectable({
	providedIn: 'root',
})
export class UploadService {
	baseUrl = environment.baseurl;

	private http = inject(HttpClient);

	uploadFile(data: FormData) {
		return this.http.post<UploadResponse>(`${this.baseUrl}/upload`, data, {
			withCredentials: true,
		});
	}
}
