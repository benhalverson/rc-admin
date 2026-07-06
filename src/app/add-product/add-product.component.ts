import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, type OnInit, signal } from '@angular/core';
import {
	FormBuilder,
	FormControl,
	type FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import {
	FilamentType,
	type ProductCreateRequest,
	ProductService,
} from '../product.service';
import { Upload } from '../upload/upload';
import type { Slant3dUploadedFile } from '../upload/upload.service';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function formatApiErrorDetails(details: unknown): string | undefined {
	if (typeof details === 'string') return details;
	if (!isRecord(details)) return undefined;

	const parts = [
		typeof details['url'] === 'string' ? details['url'] : undefined,
		typeof details['status'] === 'number'
			? `HTTP ${details['status']}`
			: undefined,
		typeof details['statusText'] === 'string'
			? details['statusText']
			: undefined,
		typeof details['cause'] === 'string' ? details['cause'] : undefined,
	].filter((part): part is string => Boolean(part));

	return parts.length > 0 ? parts.join(' - ') : undefined;
}

function getAddProductErrorMessage(error: unknown): string {
	if (!(error instanceof HttpErrorResponse)) return 'Failed to add product.';

	const body = error.error;
	if (typeof body === 'string') return body;
	if (!isRecord(body) || typeof body['error'] !== 'string') {
		return 'Failed to add product.';
	}

	const details = formatApiErrorDetails(body['details']);
	return details ? `${body['error']}: ${details}` : body['error'];
}

@Component({
	selector: 'app-add-product',
	standalone: true,
	imports: [ReactiveFormsModule, ColorPickerComponent, Upload],
	templateUrl: './add-product.component.html',
})
export class AddProductComponent implements OnInit {
	private readonly fb = inject(FormBuilder);
	private readonly productService = inject(ProductService);
	private readonly toastr = inject(ToastrService);

	productForm: FormGroup;
	colorControl: FormControl<string | null>;
	imageGallery = signal<string[]>([]);

	constructor() {
		this.colorControl = new FormControl<string | null>(
			null,
			Validators.required,
		);

		this.productForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(3)]],
			description: ['', Validators.required],
			image: [''],
			stl: ['', Validators.required],
			publicFileServiceId: ['', Validators.required],
			price: [0, [Validators.required, Validators.min(0)]],
			filamentType: ['PLA', Validators.required],
			color: this.colorControl,
			imageGallery: [[]],
		});
	}

	ngOnInit() {
		// Initialize with PLA colors
		this.productService.getColors(FilamentType.PLA).subscribe();
	}

	onStlUploaded(uploadedFile: string | Slant3dUploadedFile) {
		if (typeof uploadedFile === 'string') {
			this.productForm.patchValue({
				stl: uploadedFile,
				publicFileServiceId: '',
			});
			return;
		}

		this.productForm.patchValue({
			stl: uploadedFile.fileURL,
			publicFileServiceId: uploadedFile.publicFileServiceId,
		});
	}

	onPngUpload(uploadedFile: string | Slant3dUploadedFile) {
		const url =
			typeof uploadedFile === 'string' ? uploadedFile : uploadedFile.fileURL;
		this.productForm.get('image')?.setValue(url);
	}

	onGalleryImageUpload(uploadedFile: string | Slant3dUploadedFile) {
		const url =
			typeof uploadedFile === 'string' ? uploadedFile : uploadedFile.fileURL;
		const currentGallery = this.imageGallery();
		const updatedGallery = [...currentGallery, url];
		this.imageGallery.set(updatedGallery);
		this.productForm.get('imageGallery')?.setValue(updatedGallery);
	}

	removeGalleryImage(index: number) {
		const currentGallery = this.imageGallery();
		const updatedGallery = currentGallery.filter((_, i) => i !== index);
		this.imageGallery.set(updatedGallery);
		this.productForm.get('imageGallery')?.setValue(updatedGallery);
	}

	async onSubmit() {
		console.log('Submitting form with value:', this.productForm.value);
		if (!this.productForm.valid) {
			this.productForm.markAllAsTouched();
			if (!this.productForm.get('publicFileServiceId')?.value) {
				this.toastr.error(
					'Upload and confirm an STL file before adding product.',
				);
			}
			return;
		}

		if (this.productForm.valid) {
			const formData: ProductCreateRequest = {
				...this.productForm.value,
				price: parseFloat(this.productForm.value.price) || 0,
			};

			console.log('formData', formData);

			try {
				await firstValueFrom(this.productService.createProduct(formData));
				this.toastr.success('Product added successfully!');
				this.productForm.reset({
					name: '',
					description: '',
					image: '',
					stl: '',
					publicFileServiceId: '',
					price: 0,
					filamentType: 'PLA',
					color: null,
					imageGallery: [],
				});
				this.imageGallery.set([]);
			} catch (error) {
				console.error('Failed to add product', error);
				this.toastr.error(getAddProductErrorMessage(error));
			}
		}
	}
}
