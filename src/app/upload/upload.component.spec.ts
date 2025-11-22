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
	let uploadService: jasmine.SpyObj<UploadService>;
	interface MockUploadStore {
		setFile: jasmine.Spy<(file: File | null) => void>;
		setMessage: jasmine.Spy<(msg: string) => void>;
		reset: jasmine.Spy<() => void>;
		isFileSelected: jasmine.Spy<() => boolean>;
		selectedFile: jasmine.Spy<() => File | null>;
		message: jasmine.Spy<() => string>;
	}
	let mockUploadStore: MockUploadStore;

	const mockUploadResponse = {
		message: 'File uploaded successfully',
		key: 'test-file-key-123',
		url: 'https://example.com/uploaded-file.jpg',
	};

	beforeEach(async () => {
		const uploadServiceSpy = jasmine.createSpyObj('UploadService', [
			'uploadFile',
		]);

		// Create mock store with the methods we need
		mockUploadStore = {
			setFile: jasmine.createSpy('setFile'),
			setMessage: jasmine.createSpy('setMessage'),
			reset: jasmine.createSpy('reset'),
			isFileSelected: jasmine
				.createSpy('isFileSelected')
				.and.returnValue(false),
			selectedFile: jasmine.createSpy('selectedFile').and.returnValue(null),
			message: jasmine.createSpy('message').and.returnValue(''),
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
		) as jasmine.SpyObj<UploadService>;

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
			uploadService.uploadFile.and.returnValue(of(mockUploadResponse));

			spyOn(component.uploaded, 'emit');

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
			uploadService.uploadFile.and.returnValue(
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
			uploadService.uploadFile.and.returnValue(
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
			uploadService.uploadFile.and.returnValue(of(mockUploadResponse));

			await component.onUpload();

			expect(uploadService.uploadFile).toHaveBeenCalledWith(
				jasmine.any(FormData),
			);

			// Verify FormData content
			const formDataCall = uploadService.uploadFile.calls.mostRecent().args[0];
			expect(formDataCall).toBeInstanceOf(FormData);
		});

		it('should reset form after successful upload', async () => {
			const mockFile = new File(['test content'], 'test.stl', {
				type: 'application/octet-stream',
			});
			component.uploadForm.patchValue({ file: mockFile });
			uploadService.uploadFile.and.returnValue(of(mockUploadResponse));

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
			uploadService.uploadFile.and.returnValue(of(mockUploadResponse));

			spyOn(component.uploaded, 'emit');

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
