import {
	HttpClientTestingModule,
	HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';

import { UploadService } from './upload.service';

describe('UploadService', () => {
	let service: UploadService;
	let httpMock: HttpTestingController;

	const mockUploadResponse = {
		message: 'File uploaded successfully',
		key: 'test-file-key-123',
		url: 'https://example.com/uploaded-file.jpg',
	};
	const mockPresignedUploadResponse = {
		success: true,
		message: 'Presigned URL generated successfully',
		data: {
			presignedUrl: 'https://upload.slant3d.com/presigned',
			key: 'uploads/test-file.stl',
			filePlaceholder: {
				publicFileServiceId: 'file_123',
				name: 'test-file',
				ownerId: 'user_123',
				platformId: 'platform_123',
				type: 'stl',
				createdAt: '2026-07-06T00:00:00.000Z',
				updatedAt: '2026-07-06T00:00:00.000Z',
			},
		},
	};
	const mockConfirmUploadResponse = {
		success: true,
		message: 'Upload confirmed and file processed successfully',
		data: {
			publicFileServiceId: 'file_123',
			name: 'test-file',
			fileURL: 'https://slant3d.com/files/test-file.stl',
		},
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [UploadService],
		});
		service = TestBed.inject(UploadService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe('Service Initialization', () => {
		it('should be created', () => {
			expect(service).toBeTruthy();
		});

		it('should have correct baseUrl', () => {
			expect(service.baseUrl).toBe(environment.baseurl);
		});
	});

	describe('uploadFile', () => {
		it('should upload a file successfully', () => {
			const mockFormData = new FormData();
			mockFormData.append(
				'file',
				new Blob(['test content'], { type: 'text/plain' }),
				'test.txt',
			);

			service.uploadFile(mockFormData).subscribe((response) => {
				expect(response).toEqual(mockUploadResponse);
				expect(response.message).toBe('File uploaded successfully');
				expect(response.key).toBe('test-file-key-123');
				expect(response.url).toBe('https://example.com/uploaded-file.jpg');
			});

			const req = httpMock.expectOne(`${environment.baseurl}/upload`);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toBe(mockFormData);
			expect(req.request.withCredentials).toBe(true);
			req.flush(mockUploadResponse);
		});

		it('should handle upload error', () => {
			const mockFormData = new FormData();
			mockFormData.append(
				'file',
				new Blob(['test content'], { type: 'text/plain' }),
				'test.txt',
			);

			service.uploadFile(mockFormData).subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(400);
					expect(error.statusText).toBe('Bad Request');
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/upload`);
			req.flush(
				{ error: 'Invalid file format' },
				{ status: 400, statusText: 'Bad Request' },
			);
		});

		it('should handle server error during upload', () => {
			const mockFormData = new FormData();
			mockFormData.append(
				'file',
				new Blob(['test content'], { type: 'text/plain' }),
				'test.txt',
			);

			service.uploadFile(mockFormData).subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(500);
					expect(error.statusText).toBe('Internal Server Error');
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/upload`);
			req.flush(
				{ error: 'Server error' },
				{ status: 500, statusText: 'Internal Server Error' },
			);
		});

		it('should handle file size limit error', () => {
			const mockFormData = new FormData();
			mockFormData.append(
				'file',
				new Blob(['test content'], { type: 'text/plain' }),
				'large-file.txt',
			);

			service.uploadFile(mockFormData).subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(413);
					expect(error.statusText).toBe('Payload Too Large');
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/upload`);
			req.flush(
				{ error: 'File too large' },
				{ status: 413, statusText: 'Payload Too Large' },
			);
		});

		it('should handle unsupported file type error', () => {
			const mockFormData = new FormData();
			mockFormData.append(
				'file',
				new Blob(['test content'], { type: 'application/exe' }),
				'virus.exe',
			);

			service.uploadFile(mockFormData).subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(415);
					expect(error.statusText).toBe('Unsupported Media Type');
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/upload`);
			req.flush(
				{ error: 'Unsupported file type' },
				{ status: 415, statusText: 'Unsupported Media Type' },
			);
		});
	});

	describe('uploadStl', () => {
		it('should upload an STL through the presigned Slant3D flow', () => {
			const file = new File(['solid test'], 'test-file.stl', {
				type: 'model/stl',
			});

			service.uploadStl(file).subscribe((response) => {
				expect(response.message).toBe(
					'Upload confirmed and file processed successfully',
				);
				expect(response.data.fileURL).toBe(
					'https://slant3d.com/files/test-file.stl',
				);
				expect(response.data.publicFileServiceId).toBe('file_123');
				expect(response.data.fileName).toBe('test-file.stl');
			});

			const presignReq = httpMock.expectOne(
				`${environment.baseurl}/v2/presigned-upload`,
			);
			expect(presignReq.request.method).toBe('POST');
			expect(presignReq.request.body).toEqual({ fileName: 'test-file.stl' });
			expect(presignReq.request.withCredentials).toBe(true);
			presignReq.flush(mockPresignedUploadResponse);

			const uploadReq = httpMock.expectOne(
				'https://upload.slant3d.com/presigned',
			);
			expect(uploadReq.request.method).toBe('PUT');
			expect(uploadReq.request.body).toBe(file);
			expect(uploadReq.request.headers.get('Content-Type')).toBe(
				'application/octet-stream',
			);
			expect(uploadReq.request.withCredentials).toBe(false);
			uploadReq.flush('');

			const confirmReq = httpMock.expectOne(
				`${environment.baseurl}/v2/confirm`,
			);
			expect(confirmReq.request.method).toBe('POST');
			expect(confirmReq.request.body).toEqual({
				filePlaceholder: mockPresignedUploadResponse.data.filePlaceholder,
			});
			expect(confirmReq.request.withCredentials).toBe(true);
			confirmReq.flush(mockConfirmUploadResponse);
		});
	});
});
