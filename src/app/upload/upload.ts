import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, inject, Output } from '@angular/core';
import {
	FormBuilder,
	type FormGroup,
	ReactiveFormsModule,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { type Slant3dUploadedFile, UploadService } from './upload.service';
import { UploadStore } from './upload.store';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function getUploadErrorMessage(error: unknown): string {
	if (error instanceof HttpErrorResponse) {
		const body = error.error;
		if (typeof body === 'string') return body;
		if (isRecord(body) && typeof body['error'] === 'string') {
			const details =
				typeof body['details'] === 'string' ? `: ${body['details']}` : '';
			return `${body['error']}${details}`;
		}
	}

	return error instanceof Error
		? error.message
		: 'An error occurred during upload.';
}

@Component({
	selector: 'app-upload',
	imports: [ReactiveFormsModule],
	templateUrl: './upload.html',
	styleUrl: './upload.css',
})
export class Upload {
	readonly uploadStore = inject(UploadStore);
	private fb = inject(FormBuilder);
	private uploadService = inject(UploadService);

	@Input() uploadType: 'v1' | 'v2' = 'v1'; // 'v1' for images, 'v2' for STL files
	@Output() uploaded = new EventEmitter<string | Slant3dUploadedFile>();

	uploadForm: FormGroup = this.fb.group({
		file: [null],
	});

	onFileSelected(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0] || null;
		this.uploadStore.setFile(file);
		this.uploadForm.patchValue({ file });
	}

	async onUpload() {
		const file: File | null = this.uploadForm.get('file')?.value;
		if (!file) {
			this.uploadStore.setMessage('No file selected.');
			return;
		}

		const formData = new FormData();
		formData.append('file', file);

		try {
			let uploadedFile: string | Slant3dUploadedFile;
			let message: string;

			if (this.uploadType === 'v2') {
				const response = await firstValueFrom(
					this.uploadService.uploadStl(file),
				);
				uploadedFile = response.data;
				message = response.message;
			} else {
				const response = await firstValueFrom(
					this.uploadService.uploadFile(formData),
				);
				uploadedFile = response.url;
				message = response.message;
			}

			this.uploaded.emit(uploadedFile);
			this.uploadStore.setMessage(message);
			this.uploadForm.reset();
		} catch (error) {
			const message = getUploadErrorMessage(error);
			this.uploadStore.setMessage(`Upload failed: ${message}`);
		}
	}
}
