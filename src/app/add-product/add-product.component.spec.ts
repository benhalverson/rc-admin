import { HttpClientTestingModule } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { provideToastr, ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { type ProductResponse, ProductService } from '../product.service';
import type { FilamentColorsResponse } from '../types/filament';
import { AddProductComponent } from './add-product.component';

describe('AddProductComponent', () => {
	let component: AddProductComponent;
	let fixture: ComponentFixture<AddProductComponent>;
	let productService: jasmine.SpyObj<ProductService>;
	let toastrService: jasmine.SpyObj<ToastrService>;

	const mockProduct: ProductResponse = {
		id: 1,
		name: 'Test Product',
		description: 'Test Description',
		image: 'test-image.jpg',
		stl: 'test-file.stl',
		price: 29.99,
		filamentType: 'PLA' as const,
		color: 'red',
		imageGallery: ['image1.jpg', 'image2.jpg'],
	};

	let _mockProductService: jasmine.SpyObj<ProductService>;
	let _mockToastr: jasmine.SpyObj<ToastrService>;

	const mockColors: FilamentColorsResponse = {
		filaments: [
			{ filament: 'PLA', hexColor: '#FF0000', colorTag: 'red' },
			{ filament: 'PLA', hexColor: '#00FF00', colorTag: 'green' },
			{ filament: 'PETG', hexColor: '#0000FF', colorTag: 'blue' },
		],
	};

	// Mock signals for the service
	const mockColorsSignal = jasmine
		.createSpy('colors')
		.and.returnValue(mockColors);
	const mockColorsLoadingSignal = jasmine
		.createSpy('colorsLoading')
		.and.returnValue(false);
	beforeEach(async () => {
		const productServiceSpy = jasmine.createSpyObj(
			'ProductService',
			['createProduct', 'getColors'],
			{
				colors: mockColorsSignal,
				colorsLoading: mockColorsLoadingSignal,
			},
		);
		const toastrServiceSpy = jasmine.createSpyObj('ToastrService', [
			'success',
			'error',
		]);

		await TestBed.configureTestingModule({
			imports: [
				AddProductComponent,
				HttpClientTestingModule,
				RouterTestingModule,
				ReactiveFormsModule,
			],
			providers: [
				provideAnimations(),
				provideToastr({
					timeOut: 3000,
					positionClass: 'toast-top-right',
					preventDuplicates: true,
				}),
				{ provide: ProductService, useValue: productServiceSpy },
				{ provide: ToastrService, useValue: toastrServiceSpy },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(AddProductComponent);
		component = fixture.componentInstance;
		productService = TestBed.inject(
			ProductService,
		) as jasmine.SpyObj<ProductService>;
		toastrService = TestBed.inject(
			ToastrService,
		) as jasmine.SpyObj<ToastrService>;

		// Setup default mock returns
		productService.getColors.and.returnValue(of(mockColors));
		productService.createProduct.and.returnValue(of(mockProduct));

		fixture.detectChanges();
	});

	describe('Component Initialization', () => {
		it('should create', () => {
			expect(component).toBeTruthy();
		});

		it('should initialize form with default values', () => {
			expect(component.productForm).toBeDefined();
			expect(component.productForm.get('name')?.value).toBe('');
			expect(component.productForm.get('description')?.value).toBe('');
			expect(component.productForm.get('image')?.value).toBe('');
			expect(component.productForm.get('stl')?.value).toBe('');
			expect(component.productForm.get('price')?.value).toBe(0);
			expect(component.productForm.get('filamentType')?.value).toBe('PLA');
			expect(component.productForm.get('color')?.value).toBeNull();
			expect(component.productForm.get('imageGallery')?.value).toEqual([]);
		});

		it('should initialize imageGallery signal with empty array', () => {
			expect(component.imageGallery()).toEqual([]);
		});

		it('should have colorControl with required validator', () => {
			expect(component.colorControl).toBeDefined();
			expect(component.colorControl.hasError('required')).toBe(true);
		});

		it('should call getColors with PLA on ngOnInit', () => {
			component.ngOnInit();
			expect(productService.getColors).toHaveBeenCalledWith('PLA');
		});
	});

	describe('Form Validation', () => {
		it('should be invalid when required fields are empty', () => {
			expect(component.productForm.valid).toBe(false);
		});

		it('should validate name field', () => {
			const nameControl = component.productForm.get('name');

			// Required validation
			expect(nameControl?.hasError('required')).toBe(true);

			// Min length validation
			nameControl?.setValue('ab');
			expect(nameControl?.hasError('minlength')).toBe(true);

			// Valid name
			nameControl?.setValue('Valid Product Name');
			expect(nameControl?.valid).toBe(true);
		});

		it('should validate description field', () => {
			const descriptionControl = component.productForm.get('description');

			expect(descriptionControl?.hasError('required')).toBe(true);

			descriptionControl?.setValue('Valid description');
			expect(descriptionControl?.valid).toBe(true);
		});

		it('should validate stl field', () => {
			const stlControl = component.productForm.get('stl');

			expect(stlControl?.hasError('required')).toBe(true);

			stlControl?.setValue('model.stl');
			expect(stlControl?.valid).toBe(true);
		});

		it('should validate price field', () => {
			const priceControl = component.productForm.get('price');

			// Clear the value to test required validation
			priceControl?.setValue('');
			priceControl?.markAsTouched();
			expect(priceControl?.hasError('required')).toBe(true);

			priceControl?.setValue(-1);
			expect(priceControl?.hasError('min')).toBe(true);

			priceControl?.setValue(29.99);
			expect(priceControl?.valid).toBe(true);
		});

		it('should validate color field', () => {
			expect(component.colorControl.hasError('required')).toBe(true);

			component.colorControl.setValue('red');
			expect(component.colorControl.valid).toBe(true);
		});
	});

	describe('File Upload Handlers', () => {
		it('should handle STL file upload', () => {
			const testUrl = 'https://example.com/test.stl';

			component.onStlUploaded(testUrl);

			expect(component.productForm.get('stl')?.value).toBe(testUrl);
		});

		it('should handle PNG file upload', () => {
			const testUrl = 'https://example.com/test.png';

			component.onPngUpload(testUrl);

			expect(component.productForm.get('image')?.value).toBe(testUrl);
		});

		it('should handle gallery image upload', () => {
			const testUrl = 'https://example.com/gallery.jpg';

			component.onGalleryImageUpload(testUrl);

			expect(component.imageGallery()).toContain(testUrl);
			expect(component.productForm.get('imageGallery')?.value).toContain(
				testUrl,
			);
		});

		it('should add multiple gallery images', () => {
			const url1 = 'https://example.com/gallery1.jpg';
			const url2 = 'https://example.com/gallery2.jpg';

			component.onGalleryImageUpload(url1);
			component.onGalleryImageUpload(url2);

			expect(component.imageGallery()).toEqual([url1, url2]);
			expect(component.productForm.get('imageGallery')?.value).toEqual([
				url1,
				url2,
			]);
		});
	});

	describe('Gallery Management', () => {
		beforeEach(() => {
			// Setup initial gallery images
			component.onGalleryImageUpload('image1.jpg');
			component.onGalleryImageUpload('image2.jpg');
			component.onGalleryImageUpload('image3.jpg');
		});

		it('should remove gallery image by index', () => {
			component.removeGalleryImage(1);

			expect(component.imageGallery()).toEqual(['image1.jpg', 'image3.jpg']);
			expect(component.productForm.get('imageGallery')?.value).toEqual([
				'image1.jpg',
				'image3.jpg',
			]);
		});

		it('should remove first gallery image', () => {
			component.removeGalleryImage(0);

			expect(component.imageGallery()).toEqual(['image2.jpg', 'image3.jpg']);
		});

		it('should remove last gallery image', () => {
			component.removeGalleryImage(2);

			expect(component.imageGallery()).toEqual(['image1.jpg', 'image2.jpg']);
		});

		it('should handle removing image from empty gallery', () => {
			component.imageGallery.set([]);
			component.productForm.get('imageGallery')?.setValue([]);

			component.removeGalleryImage(0);

			expect(component.imageGallery()).toEqual([]);
		});
	});

	describe('Form Submission', () => {
		beforeEach(() => {
			// Setup valid form data
			component.productForm.patchValue({
				name: 'Test Product',
				description: 'Test Description',
				image: 'test.jpg',
				stl: 'test.stl',
				price: 29.99,
				filamentType: 'PLA',
				color: 'red',
				imageGallery: ['gallery.jpg'],
			});
			component.colorControl.setValue('red');
		});

		it('should submit valid form successfully', async () => {
			await component.onSubmit();

			expect(productService.createProduct).toHaveBeenCalledWith({
				name: 'Test Product',
				description: 'Test Description',
				image: 'test.jpg',
				stl: 'test.stl',
				price: 29.99,
				filamentType: 'PLA',
				color: 'red',
				imageGallery: ['gallery.jpg'],
			});
			expect(toastrService.success).toHaveBeenCalledWith(
				'Product added successfully!',
			);
		});

		it('should reset form after successful submission', async () => {
			await component.onSubmit();

			expect(component.productForm.get('name')?.value).toBe('');
			expect(component.productForm.get('description')?.value).toBe('');
			expect(component.productForm.get('image')?.value).toBe('');
			expect(component.productForm.get('stl')?.value).toBe('');
			expect(component.productForm.get('price')?.value).toBe(0);
			expect(component.productForm.get('filamentType')?.value).toBe('PLA');
			expect(component.productForm.get('color')?.value).toBeNull();
			expect(component.productForm.get('imageGallery')?.value).toEqual([]);
			expect(component.imageGallery()).toEqual([]);
		});

		it('should handle submission error', async () => {
			// Spy on console.error to prevent error logging during test
			spyOn(console, 'error');

			productService.createProduct.and.returnValue(
				throwError(() => new Error('Server error')),
			);

			await component.onSubmit();

			expect(toastrService.error).toHaveBeenCalledWith(
				'Failed to add product.',
			);
			expect(console.error).toHaveBeenCalledWith(
				'Failed to add product',
				jasmine.any(Error),
			);
		});

		it('should not submit invalid form', async () => {
			component.productForm.patchValue({
				name: '', // Invalid - required
				description: 'Test Description',
				stl: 'test.stl',
				price: 29.99,
			});

			await component.onSubmit();

			expect(productService.createProduct).not.toHaveBeenCalled();
			expect(toastrService.success).not.toHaveBeenCalled();
		});

		it('should convert price to float', async () => {
			component.productForm.patchValue({
				price: '29.99', // String price
			});

			await component.onSubmit();

			expect(productService.createProduct).toHaveBeenCalledWith(
				jasmine.objectContaining({
					price: 29.99, // Should be converted to number
				}),
			);
		});

		it('should handle invalid price conversion', async () => {
			component.productForm.patchValue({
				price: 'invalid',
			});

			await component.onSubmit();

			expect(productService.createProduct).toHaveBeenCalledWith(
				jasmine.objectContaining({
					price: 0, // Should default to 0
				}),
			);
		});
	});

	describe('Integration Tests', () => {
		it('should handle complete product creation workflow', async () => {
			// Simulate file uploads
			component.onStlUploaded('https://example.com/model.stl');
			component.onPngUpload('https://example.com/main.jpg');
			component.onGalleryImageUpload('https://example.com/gallery1.jpg');
			component.onGalleryImageUpload('https://example.com/gallery2.jpg');

			// Fill form
			component.productForm.patchValue({
				name: 'Complete Product',
				description: 'Complete Description',
				price: 49.99,
				filamentType: 'PETG',
			});
			component.colorControl.setValue('blue');

			// Submit
			await component.onSubmit();

			expect(productService.createProduct).toHaveBeenCalledWith({
				name: 'Complete Product',
				description: 'Complete Description',
				image: 'https://example.com/main.jpg',
				stl: 'https://example.com/model.stl',
				price: 49.99,
				filamentType: 'PETG',
				color: 'blue',
				imageGallery: [
					'https://example.com/gallery1.jpg',
					'https://example.com/gallery2.jpg',
				],
			});
			expect(toastrService.success).toHaveBeenCalled();
		});
	});
});
