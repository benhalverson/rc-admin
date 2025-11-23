import { HttpClientTestingModule } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { Upload } from './upload';
import { UploadService } from './upload.service';
import { UploadStore } from './upload.store';

describe('Upload Component', () => {
	let component: Upload;
	let fixture: ComponentFixture<Upload>;
	let uploadService: {
		uploadFile: ReturnType<typeof vi.fn>;
	};
	interface MockUploadStore {
		setFile: ReturnType<typeof vi.fn<(file: File | null) => void>>;
		setMessage: ReturnType<typeof vi.fn<(msg: string) => void>>;
		reset: ReturnType<typeof vi.fn<() => void>>;
		isFileSelected: ReturnType<typeof vi.fn<() => boolean>>;
		selectedFile: ReturnType<typeof vi.fn<() => File | null>>;
		message: ReturnType<typeof vi.fn<() => string>>;
	}
	let mockUploadStore: MockUploadStore;

	const mockUploadResponse = {
		message: 'File uploaded successfully',
		key: 'test-file-key-123',
		url: 'https://example.com/uploaded-file.jpg',
	};

	beforeEach(async () => {
		const uploadServiceSpy = {
			uploadFile: vi.fn(),
		};

		// Create mock store with the methods we need
		mockUploadStore = {
			setFile: vi.fn(),
			setMessage: vi.fn(),
			reset: vi.fn(),
			isFileSelected: vi.fn().mockReturnValue(false),
			selectedFile: vi.fn().mockReturnValue(null),
			message: vi.fn().mockReturnValue(''),
		};

		await TestBed.configureTestingModule({
			imports: [Upload, HttpClientTestingModule, ReactiveFormsModule],
			providers: [
				{ provide: UploadService, useValue: uploadServiceSpy },
				{ provide: UploadStore, useValue: mockUploadStore },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(Upload);
		component = fixture.componentInstance;
		uploadService = TestBed.inject(
			UploadService,
		) as unknown as typeof uploadService;

		fixture.detectChanges();
	});

	describe('Component Initialization', () => {
		it('should create', () => {
			expect(component).toBeTruthy();
		});

		it('should initialize upload form', () => {
			expect(component.uploadForm).toBeDefined();
			expect(component.uploadForm.get('file')).toBeDefined();
			expect(component.uploadForm.get('file')?.value).toBeNull();
		});

		it('should have uploaded event emitter', () => {
			expect(component.uploaded).toBeDefined();
		});
	});

	describe('File Selection', () => {
		it('should handle file selection', () => {
			const mockFile = new File(['test content'], 'test.stl', {
				type: 'application/octet-stream',
			});
			const mockEvent = { target: { files: [mockFile] } } as unknown as Event;

			component.onFileSelected(mockEvent);

			expect(mockUploadStore.setFile).toHaveBeenCalledWith(mockFile);
			expect(component.uploadForm.get('file')?.value).toBe(mockFile);
		});

		it('should handle no file selected', () => {
			const mockEvent = { target: { files: [] as File[] } } as unknown as Event;

			component.onFileSelected(mockEvent);

			expect(mockUploadStore.setFile).toHaveBeenCalledWith(null);
			expect(component.uploadForm.get('file')?.value).toBeNull();
		});

		it('should handle null files array', () => {
			const mockEvent = { target: { files: null } } as unknown as Event;

			component.onFileSelected(mockEvent);

			expect(mockUploadStore.setFile).toHaveBeenCalledWith(null);
			expect(component.uploadForm.get('file')?.value).toBeNull();
		});
	});

	describe('File Upload', () => {
		it('should upload file successfully', async () => {
			const mockFile = new File(['test content'], 'test.stl', {
				type: 'application/octet-stream',
			});
			component.uploadForm.patchValue({ file: mockFile });
			uploadService.uploadFile.mockReturnValue(of(mockUploadResponse));

			vi.spyOn(component.uploaded, 'emit');

			await component.onUpload();

			expect(uploadService.uploadFile).toHaveBeenCalled();
			expect(component.uploaded.emit).toHaveBeenCalledWith(
				mockUploadResponse.url,
			);
			expect(mockUploadStore.setMessage).toHaveBeenCalledWith(
				mockUploadResponse.message,
			);
			expect(component.uploadForm.get('file')?.value).toBeNull();
		});

		it('should handle no file selected for upload', async () => {
			component.uploadForm.patchValue({ file: null });

			await component.onUpload();

			expect(mockUploadStore.setMessage).toHaveBeenCalledWith(
				'No file selected.',
			);
			expect(uploadService.uploadFile).not.toHaveBeenCalled();
		});

		it('should handle upload error with Error object', async () => {
			const mockFile = new File(['test content'], 'test.stl', {
				type: 'application/octet-stream',
			});
			component.uploadForm.patchValue({ file: mockFile });
			const errorMessage = 'Network error';
			uploadService.uploadFile.mockReturnValue(
				throwError(() => new Error(errorMessage)),
			);

			await component.onUpload();

			expect(mockUploadStore.setMessage).toHaveBeenCalledWith(
				`Upload failed: ${errorMessage}`,
			);
		});

		it('should handle upload error with non-Error object', async () => {
			const mockFile = new File(['test content'], 'test.stl', {
				type: 'application/octet-stream',
			});
			component.uploadForm.patchValue({ file: mockFile });
			uploadService.uploadFile.mockReturnValue(
				throwError(() => 'String error'),
			);

			await component.onUpload();

			expect(mockUploadStore.setMessage).toHaveBeenCalledWith(
				'Upload failed: An error occurred during upload.',
			);
		});

		it('should create FormData with correct file', async () => {
			const mockFile = new File(['test content'], 'test.stl', {
				type: 'application/octet-stream',
			});
			component.uploadForm.patchValue({ file: mockFile });
			uploadService.uploadFile.mockReturnValue(of(mockUploadResponse));

			await component.onUpload();

			expect(uploadService.uploadFile).toHaveBeenCalled();

			// Verify FormData content
			const formDataCall =
				uploadService.uploadFile.mock.calls[
					uploadService.uploadFile.mock.calls.length - 1
				][0];
			expect(formDataCall).toBeInstanceOf(FormData);
		});

		it('should reset form after successful upload', async () => {
			const mockFile = new File(['test content'], 'test.stl', {
				type: 'application/octet-stream',
			});
			component.uploadForm.patchValue({ file: mockFile });
			uploadService.uploadFile.mockReturnValue(of(mockUploadResponse));

			expect(component.uploadForm.get('file')?.value).toBe(mockFile);

			await component.onUpload();

			expect(component.uploadForm.get('file')?.value).toBeNull();
		});
	});

	describe('Event Emitters', () => {
		it('should emit uploaded event with correct URL', async () => {
			const mockFile = new File(['test content'], 'test.stl', {
				type: 'application/octet-stream',
			});
			component.uploadForm.patchValue({ file: mockFile });
			uploadService.uploadFile.mockReturnValue(of(mockUploadResponse));

			vi.spyOn(component.uploaded, 'emit');

			await component.onUpload();

			expect(component.uploaded.emit).toHaveBeenCalledWith(
				mockUploadResponse.url,
			);
			expect(component.uploaded.emit).toHaveBeenCalledTimes(1);
		});
	});

	describe('Form Integration', () => {
		it('should update form when file is selected', () => {
			const mockFile = new File(['test content'], 'test.stl', {
				type: 'application/octet-stream',
			});
			const mockEvent = { target: { files: [mockFile] } } as unknown as Event;

			expect(component.uploadForm.get('file')?.value).toBeNull();

			component.onFileSelected(mockEvent);

			expect(component.uploadForm.get('file')?.value).toBe(mockFile);
		});

		it('should access form builder injection', () => {
			expect(component.uploadForm).toBeDefined();
			expect(component.uploadForm.get('file')).toBeDefined();
		});
	});
});
