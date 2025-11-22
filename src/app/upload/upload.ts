import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import {
	FormBuilder,
	type FormGroup,
	ReactiveFormsModule,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { UploadService } from './upload.service';
import { UploadStore } from './upload.store';

@Component({
	selector: 'app-upload',
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './upload.html',
	styleUrl: './upload.css',
})
export class Upload {
	readonly uploadStore = inject(UploadStore);
	private fb = inject(FormBuilder);
	private uploadService = inject(UploadService);

	// @Input({required: true}) stlControl!: FormControl<string>
	@Output() uploaded = new EventEmitter<string>();

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
			const response = await firstValueFrom(
				this.uploadService.uploadFile(formData),
			);
			const url = response.url;

			this.uploaded.emit(url);
			this.uploadStore.setMessage(`${response.message}`);
			this.uploadForm.reset();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'An error occurred during upload.';
			this.uploadStore.setMessage(`Upload failed: ${message}`);
		}
	}
}
