import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface UploadResponse {
	message: string;
	key: string;
	url: string;
}

interface Slant3dFilePlaceholder {
	publicFileServiceId: string;
	name: string;
	ownerId: string;
	platformId: string;
	type: string;
	createdAt: string;
	updatedAt: string;
}

interface Slant3dPresignedUploadResponse {
	success: boolean;
	message: string;
	data: {
		presignedUrl: string;
		key: string;
		filePlaceholder: Slant3dFilePlaceholder;
	};
}

interface Slant3dConfirmUploadResponse {
	success: boolean;
	message: string;
	data: {
		publicFileServiceId: string;
		name: string;
		fileURL: string;
	};
}

export interface Slant3dUploadedFile {
	publicFileServiceId: string;
	fileName: string;
	fileURL: string;
}

@Injectable({
	providedIn: 'root',
})
export class UploadService {
	baseUrl = environment.baseurl;

	private http = inject(HttpClient);

	// v1: Upload photos to R2 bucket
	uploadFile(data: FormData) {
		return this.http.post<UploadResponse>(`${this.baseUrl}/upload`, data, {
			withCredentials: true,
		});
	}

	// v2: Upload STL files directly to Slant3D using the browser presigned flow
	uploadStl(file: File) {
		return this.http
			.post<Slant3dPresignedUploadResponse>(
				`${this.baseUrl}/v2/presigned-upload`,
				{ fileName: file.name },
				{ withCredentials: true },
			)
			.pipe(
				switchMap((presignedResponse) =>
					this.http
						.put(presignedResponse.data.presignedUrl, file, {
							headers: { 'Content-Type': 'application/octet-stream' },
							responseType: 'text',
						})
						.pipe(map(() => presignedResponse.data.filePlaceholder)),
				),
				switchMap((filePlaceholder) =>
					this.http.post<Slant3dConfirmUploadResponse>(
						`${this.baseUrl}/v2/confirm`,
						{ filePlaceholder },
						{ withCredentials: true },
					),
				),
				map((confirmResponse) => ({
					message: confirmResponse.message,
					data: {
						publicFileServiceId: confirmResponse.data.publicFileServiceId,
						fileName: file.name,
						fileURL: confirmResponse.data.fileURL,
					},
				})),
			);
	}
}
