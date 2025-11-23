import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, type Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideToastr, ToastrService } from 'ngx-toastr';
import { of, Subject, throwError } from 'rxjs';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { type ProductResponse, ProductService } from '../product.service';
import type { FilamentColorsResponse } from '../types/filament';
import { Profile, Provider } from '../types/filament';
import { Upload } from '../upload/upload';
import { ProductDetailsComponent } from './product-details.component';

describe('ProductDetailsComponent', () => {
	let component: ProductDetailsComponent;
	let fixture: ComponentFixture<ProductDetailsComponent>;
	let productService: {
		getProductById: ReturnType<typeof vi.fn>;
		updateProduct: ReturnType<typeof vi.fn>;
		getColors: ReturnType<typeof vi.fn>;
		colors: () => FilamentColorsResponse[];
		colorsLoading: () => boolean;
	};
	let toastrService: {
		success: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
	};
	let activatedRoute: ActivatedRoute;

	const mockProduct: ProductResponse = {
		id: 1,
		name: 'Test Product',
		description: 'Test Description',
		image: 'https://example.com/test.jpg',
		stl: 'https://example.com/test.stl',
		price: 29.99,
		filamentType: 'PLA',
		color: 'red',
		imageGallery: [
			'https://example.com/gallery1.jpg',
			'https://example.com/gallery2.jpg',
		],
	};

	const mockFilaments: FilamentColorsResponse[] = [
		{
			name: 'Red PLA',
			provider: Provider.Polymaker,
			public: true,
			available: true,
			color: 'PLA',
			profile: Profile.Pla,
			hexValue: 'ff0000',
			publicId: 'red-pla',
		},
		{
			name: 'Blue PLA',
			provider: Provider.Polymaker,
			public: true,
			available: true,
			color: 'PLA',
			profile: Profile.Pla,
			hexValue: '0000ff',
			publicId: 'blue-pla',
		},
		{
			name: 'Green PETG',
			provider: Provider.Polymaker,
			public: true,
			available: true,
			color: 'PETG',
			profile: Profile.Petg,
			hexValue: '00ff00',
			publicId: 'green-petg',
		},
	];

	const mockColorsSignal = signal(mockFilaments);
	const mockColorsLoadingSignal = signal(false);

	// Helper to stabilize change detection (Angular 21 OnPush fix)
	async function detectChanges() {
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
	}

	beforeEach(async () => {
		const productServiceSpy = {
			getProductById: vi.fn(),
			updateProduct: vi.fn(),
			getColors: vi.fn(),
			colors: mockColorsSignal,
			colorsLoading: mockColorsLoadingSignal,
		};

		const toastrServiceSpy = {
			success: vi.fn(),
			error: vi.fn(),
		};

		activatedRoute = {
			params: of({ id: '1' }),
			snapshot: {
				data: {
					colorOptions: mockFilaments,
				},
			},
		} as unknown as ActivatedRoute;

		await TestBed.configureTestingModule({
			imports: [
				ProductDetailsComponent,
				HttpClientTestingModule,
				RouterTestingModule,
				ReactiveFormsModule,
			],
			providers: [
				{ provide: ProductService, useValue: productServiceSpy },
				{ provide: ToastrService, useValue: toastrServiceSpy },
				{ provide: ActivatedRoute, useValue: activatedRoute },
				provideAnimations(),
				provideToastr({
					timeOut: 3000,
					positionClass: 'toast-top-right',
					preventDuplicates: true,
				}),
			],
		})
			.overrideComponent(ProductDetailsComponent, {
				remove: { imports: [ColorPickerComponent, Upload] },
				add: {
					imports: [],
					schemas: [NO_ERRORS_SCHEMA],
				},
			})
			.compileComponents();

		fixture = TestBed.createComponent(ProductDetailsComponent);
		component = fixture.componentInstance;
		productService = TestBed.inject(
			ProductService,
		) as unknown as typeof productService;
		toastrService = TestBed.inject(
			ToastrService,
		) as unknown as typeof toastrService;

		// Setup spies to accept any parameter type
		productService.getProductById.mockReturnValue(of(mockProduct));
		productService.getColors.mockReturnValue(of(mockFilaments));
		productService.updateProduct.mockReturnValue(of(undefined));
	});

	describe('Component Initialization', () => {
		it('should create', () => {
			expect(component).toBeTruthy();
		});

		it('should initialize with default values', () => {
			expect(component.isEditing()).toBe(false);
			expect(component.productDetails).toBeNull();
			expect(component.colorOptions()).toEqual([]);
			expect(component.isLoading()).toBe(false);
			expect(component.filteredColorOptions()).toEqual([]);
			expect(component.imageGallery()).toEqual([]);
		});

		it('should load product on initialization', () => {
			fixture.detectChanges();

			expect(productService.getProductById).toHaveBeenCalledWith(1);
			expect(component.productDetails).toEqual(mockProduct);
			expect(component.colorOptions()).toEqual(mockFilaments);
		});

		it('should initialize form with product data', () => {
			fixture.detectChanges();

			expect(component.productForm).toBeDefined();
			expect(component.productForm.get('name')?.value).toBe(mockProduct.name);
			expect(component.productForm.get('description')?.value).toBe(
				mockProduct.description,
			);
			expect(component.productForm.get('price')?.value).toBe(mockProduct.price);
			expect(component.productForm.get('filamentType')?.value).toBe(
				mockProduct.filamentType,
			);
			expect(component.colorControl.value).toBe(mockProduct.color);
		});
	});

	describe('Image Gallery Processing', () => {
		it('should handle imageGallery as array', async () => {
			const productWithArrayGallery = {
				...mockProduct,
				imageGallery: ['image1.jpg', 'image2.jpg'],
			};
			productService.getProductById.mockReturnValue(
				of(productWithArrayGallery),
			);

			await detectChanges();

			expect(component.safeImageGallery).toEqual(['image1.jpg', 'image2.jpg']);
			expect(component.imageGallery()).toEqual(['image1.jpg', 'image2.jpg']);
		});

		it('should parse imageGallery from JSON string', () => {
			interface ExtendedProductResponse
				extends Omit<ProductResponse, 'imageGallery'> {
				imageGallery: string | string[];
			}
			const productWithStringGallery: ExtendedProductResponse = {
				...mockProduct,
				imageGallery: JSON.stringify(['image1.jpg', 'image2.jpg']),
			};
			productService.getProductById.mockReturnValue(
				of(productWithStringGallery as ProductResponse),
			);

			fixture.detectChanges();

			expect(component.safeImageGallery).toEqual(['image1.jpg', 'image2.jpg']);
		});

		it('should handle invalid JSON string in imageGallery', () => {
			vi.spyOn(console, 'error');
			interface ExtendedInvalidProduct
				extends Omit<ProductResponse, 'imageGallery'> {
				imageGallery: string | string[];
			}
			const productWithInvalidJson: ExtendedInvalidProduct = {
				...mockProduct,
				imageGallery: 'invalid json string',
			};
			productService.getProductById.mockReturnValue(
				of(productWithInvalidJson as ProductResponse),
			);

			fixture.detectChanges();

			expect(component.safeImageGallery).toEqual([]);
			expect(console.error).toHaveBeenCalled();
		});

		it('should handle null/undefined imageGallery', async () => {
			const productWithoutGallery = { ...mockProduct, imageGallery: undefined };
			productService.getProductById.mockReturnValue(of(productWithoutGallery));

			await detectChanges();

			expect(component.safeImageGallery).toEqual([]);
		});
	});

	describe('Color Filtering', () => {
		beforeEach(() => {
			fixture.detectChanges();
		});

		it('should filter colors by filament type', () => {
			component.updateFilteredColorOptions();

			const filtered = component.filteredColorOptions();
			expect(filtered.length).toBe(2); // Only PLA colors
			expect(filtered.every((color) => color.color === 'PLA')).toBe(true);
		});

		it('should update filtered colors when filament type changes', () => {
			component.productForm.get('filamentType')?.setValue('PETG');
			component.updateFilteredColorOptions();

			const filtered = component.filteredColorOptions();
			expect(filtered.length).toBe(1); // Only PETG color
			expect(filtered[0].color).toBe('PETG');
		});

		it('should fetch colors when filament type changes', async () => {
			await component.fetchColorsByFilamentType('PETG');

			expect(productService.getColors).toHaveBeenCalledWith('PETG');
			expect(component.colorOptions()).toEqual(mockFilaments);
			expect(component.isLoading()).toBe(false);
		});

		it('should handle error when fetching colors', async () => {
			productService.getColors.mockReturnValue(throwError('API Error'));
			vi.spyOn(console, 'error');

			await component.fetchColorsByFilamentType('PETG');

			expect(console.error).toHaveBeenCalledWith(
				'Failed to fetch colors:',
				'API Error',
			);
			expect(component.isLoading()).toBe(false);
		});
	});

	describe('Form Validation', () => {
		beforeEach(async () => {
			await detectChanges();
		});

		it('should validate required name field', () => {
			const nameControl = component.productForm.get('name');

			nameControl?.setValue('');
			expect(nameControl?.hasError('required')).toBe(true);

			nameControl?.setValue('ab');
			expect(nameControl?.hasError('minlength')).toBe(true);

			nameControl?.setValue('Valid Name');
			expect(nameControl?.valid).toBe(true);
		});

		it('should validate required description field', () => {
			const descriptionControl = component.productForm.get('description');

			descriptionControl?.setValue('');
			expect(descriptionControl?.hasError('required')).toBe(true);

			descriptionControl?.setValue('Valid description');
			expect(descriptionControl?.valid).toBe(true);
		});

		it('should validate required STL field', () => {
			const stlControl = component.productForm.get('stl');

			stlControl?.setValue('');
			expect(stlControl?.hasError('required')).toBe(true);

			stlControl?.setValue('https://example.com/model.stl');
			expect(stlControl?.valid).toBe(true);
		});

		it('should validate price field', () => {
			const priceControl = component.productForm.get('price');

			priceControl?.setValue('');
			expect(priceControl?.hasError('required')).toBe(true);

			priceControl?.setValue(-1);
			expect(priceControl?.hasError('min')).toBe(true);

			priceControl?.setValue(29.99);
			expect(priceControl?.valid).toBe(true);
		});

		it('should validate color field', () => {
			component.colorControl.setValue(null);
			expect(component.colorControl.hasError('required')).toBe(true);

			component.colorControl.setValue('red');
			expect(component.colorControl.valid).toBe(true);
		});
	});

	describe('Edit Mode', () => {
		beforeEach(async () => {
			await detectChanges();
		});

		it('should toggle edit mode', async () => {
			expect(component.isEditing()).toBe(false);

			component.isEditing.set(!component.isEditing());
			await detectChanges();
			expect(component.isEditing()).toBe(true);
		});

		it('should display edit button in view mode', async () => {
			component.isEditing.set(false);
			await detectChanges();

			const editButton = fixture.debugElement.query(By.css('button'));
			expect(editButton.nativeElement.textContent.trim()).toBe('Edit');
		});

		it('should display cancel button in edit mode', async () => {
			component.isEditing.set(true);
			await detectChanges();

			const cancelButton = fixture.debugElement.query(By.css('button'));
			expect(cancelButton.nativeElement.textContent.trim()).toBe('Cancel');
		});
	});

	describe('Save Changes', () => {
		beforeEach(async () => {
			await detectChanges();
			component.isEditing.set(true);
		});

		it('should save valid form changes', () => {
			productService.updateProduct.mockReturnValue(of(undefined));

			component.productForm.patchValue({
				name: 'Updated Product',
				description: 'Updated Description',
			});

			component.saveChanges();

			expect(productService.updateProduct).toHaveBeenCalled();
			expect(toastrService.success).toHaveBeenCalledWith(
				'Product updated successfully',
			);
			expect(component.isEditing()).toBe(false);
		});

		it('should not save invalid form', () => {
			component.productForm.patchValue({
				name: '', // Invalid - required
				price: -1, // Invalid - min value
			});

			component.saveChanges();

			expect(productService.updateProduct).not.toHaveBeenCalled();
		});

		it('should handle save error', () => {
			productService.updateProduct.mockReturnValue(throwError('Save Error'));

			component.saveChanges();

			expect(toastrService.error).toHaveBeenCalledWith(
				'Error updating product',
			);
		});

		it('should not save when form is null', () => {
			(
				component as unknown as {
					productForm: typeof component.productForm | null;
				}
			).productForm = null;

			component.saveChanges();

			expect(productService.updateProduct).not.toHaveBeenCalled();
		});
	});

	describe('Gallery Management', () => {
		beforeEach(() => {
			fixture.detectChanges();
		});

		it('should add image to gallery', () => {
			const testUrl = 'https://example.com/new-image.jpg';
			const initialGallery = ['https://example.com/existing.jpg'];
			component.imageGallery.set(initialGallery);

			component.onGalleryImageUpload(testUrl);

			expect(component.imageGallery()).toEqual([...initialGallery, testUrl]);
			expect(component.productForm.get('imageGallery')?.value).toEqual([
				...initialGallery,
				testUrl,
			]);
		});

		it('should remove image from gallery by index', () => {
			const initialGallery = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
			component.imageGallery.set(initialGallery);
			component.productForm.get('imageGallery')?.setValue(initialGallery);

			component.removeGalleryImage(1); // Remove second image

			expect(component.imageGallery()).toEqual(['image1.jpg', 'image3.jpg']);
			expect(component.productForm.get('imageGallery')?.value).toEqual([
				'image1.jpg',
				'image3.jpg',
			]);
		});

		it('should handle image load success', () => {
			const testUrl = 'https://example.com/test.jpg';

			// Should not throw any errors
			expect(() => component.onImageLoad(testUrl)).not.toThrow();
		});
	});

	describe('Component Lifecycle', () => {
		it('should complete destroy subject on destroy', () => {
			vi.spyOn(component.destroy$, 'next');
			vi.spyOn(component.destroy$, 'complete');

			component.ngOnDestroy();

			expect(component.destroy$.next).toHaveBeenCalled();
			expect(component.destroy$.complete).toHaveBeenCalled();
		});

		it('should handle route parameter changes', () => {
			const paramsSubject = new Subject<Params>();
			activatedRoute.params = paramsSubject.asObservable();

			component.ngOnInit();

			paramsSubject.next({ id: '2' });

			expect(productService.getProductById).toHaveBeenCalledWith(2);
		});
	});

	describe('Error Handling', () => {
		it('should handle product loading error', async () => {
			productService.getProductById.mockReturnValue(
				throwError(() => 'Loading Error'),
			);
			vi.spyOn(console, 'error');

			fixture.detectChanges();
			await fixture.whenStable(); // 👈 prevents afterAll teardown error

			expect(console.error).toHaveBeenCalled();
		});
	});

	describe('Display Content', () => {
		beforeEach(async () => {
			await detectChanges();
		});

		it('should display product details in view mode', async () => {
			component.isEditing.set(false);
			await detectChanges();

			const compiled = fixture.nativeElement;
			expect(compiled.textContent).toContain(mockProduct.name);
			expect(compiled.textContent).toContain(mockProduct.description);
			expect(compiled.textContent).toContain(mockProduct.price.toString());
		});

		it('should display form inputs in edit mode', () => {
			component.isEditing.set(true);
			fixture.detectChanges();

			const nameInput = fixture.debugElement.query(
				By.css('input[formControlName="name"]'),
			);
			const descriptionTextarea = fixture.debugElement.query(
				By.css('textarea[formControlName="description"]'),
			);

			expect(nameInput).toBeTruthy();
			expect(descriptionTextarea).toBeTruthy();
			expect(nameInput.nativeElement.value).toBe(mockProduct.name);
		});
	});
});
