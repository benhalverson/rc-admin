import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideToastr, ToastrService } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { DebugElement, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';

import { ProductDetailsComponent } from './product-details.component';
import { ProductService, Product, ProductResponse } from '../product.service';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { Upload } from '../upload/upload';
import { Filament } from '../types/filament';

describe('ProductDetailsComponent', () => {
  let component: ProductDetailsComponent;
  let fixture: ComponentFixture<ProductDetailsComponent>;
  let productService: jasmine.SpyObj<ProductService>;
  let toastrService: jasmine.SpyObj<ToastrService>;
  let activatedRoute: any;

  const mockProduct: ProductResponse = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    image: 'https://example.com/test.jpg',
    stl: 'https://example.com/test.stl',
    price: 29.99,
    filamentType: 'PLA',
    color: 'red',
    imageGallery: ['https://example.com/gallery1.jpg', 'https://example.com/gallery2.jpg']
  };

  const mockFilaments: Filament[] = [
    { filament: 'PLA', hexColor: '#ff0000', colorTag: 'red' },
    { filament: 'PLA', hexColor: '#0000ff', colorTag: 'blue' },
    { filament: 'PETG', hexColor: '#00ff00', colorTag: 'green' }
  ];

  const mockColorsSignal = signal(mockFilaments);
  const mockColorsLoadingSignal = signal(false);

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', [
      'getProductById',
      'updateProduct',
      'getColors'
    ], {
      colors: mockColorsSignal,
      colorsLoading: mockColorsLoadingSignal
    });

    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error'
    ]);

    activatedRoute = {
      params: of({ id: '1' }),
      snapshot: {
        data: {
          colorOptions: mockFilaments
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        ProductDetailsComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
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
        })
      ]
    })
    .overrideComponent(ProductDetailsComponent, {
      remove: { imports: [ColorPickerComponent, Upload] },
      add: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductDetailsComponent);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;

    // Setup spies to accept any parameter type
    productService.getProductById.and.returnValue(of(mockProduct));
    productService.getColors.and.returnValue(of({ filaments: mockFilaments }));
    productService.updateProduct.and.returnValue(of(undefined));
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.isEditing).toBe(false);
      expect(component.productDetails).toBeNull();
      expect(component.colorOptions()).toEqual([]);
      expect(component.isLoading()).toBe(false);
      expect(component.filteredColorOptions()).toEqual([]);
      expect(component.imageGallery()).toEqual([]);
    });

    it('should load product on initialization', () => {
      fixture.detectChanges();

      expect(productService.getProductById).toHaveBeenCalledWith('1' as any);
      expect(component.productDetails).toEqual(mockProduct);
      expect(component.colorOptions()).toEqual(mockFilaments);
    });

    it('should initialize form with product data', () => {
      fixture.detectChanges();

      expect(component.productForm).toBeDefined();
      expect(component.productForm.get('name')?.value).toBe(mockProduct.name);
      expect(component.productForm.get('description')?.value).toBe(mockProduct.description);
      expect(component.productForm.get('price')?.value).toBe(mockProduct.price);
      expect(component.productForm.get('filamentType')?.value).toBe(mockProduct.filamentType);
      expect(component.colorControl.value).toBe(mockProduct.color);
    });
  });

  describe('Image Gallery Processing', () => {
    it('should handle imageGallery as array', () => {
      const productWithArrayGallery = { ...mockProduct, imageGallery: ['image1.jpg', 'image2.jpg'] };
      productService.getProductById.and.returnValue(of(productWithArrayGallery));

      fixture.detectChanges();

      expect(component.safeImageGallery).toEqual(['image1.jpg', 'image2.jpg']);
      expect(component.imageGallery()).toEqual(['image1.jpg', 'image2.jpg']);
    });

    it('should parse imageGallery from JSON string', () => {
      const productWithStringGallery = {
        ...mockProduct,
        imageGallery: JSON.stringify(['image1.jpg', 'image2.jpg']) as any
      };
      productService.getProductById.and.returnValue(of(productWithStringGallery));

      fixture.detectChanges();

      expect(component.safeImageGallery).toEqual(['image1.jpg', 'image2.jpg']);
    });

    it('should handle invalid JSON string in imageGallery', () => {
      // Spy on console.error to prevent error logging during test
      spyOn(console, 'error');

      const productWithInvalidJson = {
        ...mockProduct,
        imageGallery: 'invalid json string' as any
      };
      productService.getProductById.and.returnValue(of(productWithInvalidJson));

      fixture.detectChanges();

      expect(component.safeImageGallery).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to parse imageGallery:', jasmine.any(SyntaxError));
    });

    it('should handle null/undefined imageGallery', () => {
      const productWithoutGallery = { ...mockProduct, imageGallery: undefined };
      productService.getProductById.and.returnValue(of(productWithoutGallery));

      fixture.detectChanges();

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
      expect(filtered.every(color => color.filament === 'PLA')).toBe(true);
    });

    it('should update filtered colors when filament type changes', () => {
      component.productForm.get('filamentType')?.setValue('PETG');
      component.updateFilteredColorOptions();

      const filtered = component.filteredColorOptions();
      expect(filtered.length).toBe(1); // Only PETG color
      expect(filtered[0].filament).toBe('PETG');
    });

    it('should fetch colors when filament type changes', async () => {
      await component.fetchColorsByFilamentType('PETG');

      expect(productService.getColors).toHaveBeenCalledWith('PETG');
      expect(component.colorOptions()).toEqual(mockFilaments);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle error when fetching colors', async () => {
      productService.getColors.and.returnValue(throwError('API Error'));
      spyOn(console, 'error');

      await component.fetchColorsByFilamentType('PETG');

      expect(console.error).toHaveBeenCalledWith('Failed to fetch colors:', 'API Error');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
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
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle edit mode', () => {
      expect(component.isEditing).toBe(false);

      component.isEditing = !component.isEditing;
      expect(component.isEditing).toBe(true);
    });

    it('should display edit button in view mode', () => {
      component.isEditing = false;
      fixture.detectChanges();

      const editButton = fixture.debugElement.query(By.css('button'));
      expect(editButton.nativeElement.textContent.trim()).toBe('Edit');
    });

    it('should display cancel button in edit mode', () => {
      component.isEditing = true;
      fixture.detectChanges();

      const cancelButton = fixture.debugElement.query(By.css('button'));
      expect(cancelButton.nativeElement.textContent.trim()).toBe('Cancel');
    });
  });

  describe('Save Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.isEditing = true;
    });

    it('should save valid form changes', () => {
      productService.updateProduct.and.returnValue(of(undefined));

      component.productForm.patchValue({
        name: 'Updated Product',
        description: 'Updated Description'
      });

      component.saveChanges();

      expect(productService.updateProduct).toHaveBeenCalled();
      expect(toastrService.success).toHaveBeenCalledWith('Product updated successfully');
      expect(component.isEditing).toBe(false);
    });

    it('should not save invalid form', () => {
      component.productForm.patchValue({
        name: '', // Invalid - required
        price: -1 // Invalid - min value
      });

      component.saveChanges();

      expect(productService.updateProduct).not.toHaveBeenCalled();
    });

    it('should handle save error', () => {
      productService.updateProduct.and.returnValue(throwError('Save Error'));

      component.saveChanges();

      expect(toastrService.error).toHaveBeenCalledWith('Error updating product');
    });

    it('should not save when form is null', () => {
      component.productForm = null as any;

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
      expect(component.productForm.get('imageGallery')?.value).toEqual([...initialGallery, testUrl]);
    });

    it('should remove image from gallery by index', () => {
      const initialGallery = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      component.imageGallery.set(initialGallery);
      component.productForm.get('imageGallery')?.setValue(initialGallery);

      component.removeGalleryImage(1); // Remove second image

      expect(component.imageGallery()).toEqual(['image1.jpg', 'image3.jpg']);
      expect(component.productForm.get('imageGallery')?.value).toEqual(['image1.jpg', 'image3.jpg']);
    });

    it('should handle image load success', () => {
      const testUrl = 'https://example.com/test.jpg';

      // Should not throw any errors
      expect(() => component.onImageLoad(testUrl)).not.toThrow();
    });

    it('should handle image load error', () => {
      spyOn(console, 'error');
      const mockEvent = {
        target: {
          naturalWidth: 0,
          naturalHeight: 0,
          src: 'https://example.com/broken.jpg'
        }
      };
      const testUrl = 'https://example.com/broken.jpg';

      component.onImageError(mockEvent, testUrl);

      expect(console.error).toHaveBeenCalledWith('Image failed to load:', testUrl);
    });
  });

  describe('Component Lifecycle', () => {
    it('should complete destroy subject on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should handle route parameter changes', () => {
      const paramsSubject = new Subject<Params>();
      activatedRoute.params = paramsSubject.asObservable();

      component.ngOnInit();

      paramsSubject.next({ id: '2' });

      expect(productService.getProductById).toHaveBeenCalledWith('2' as any);
    });
  });

  describe('Error Handling', () => {
    it('should handle product loading error', () => {
      productService.getProductById.and.returnValue(throwError('Loading Error'));
      spyOn(console, 'error');

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle missing route data gracefully', () => {
      activatedRoute.snapshot.data = {};

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });
  });

  describe('Display Content', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display product details in view mode', () => {
      component.isEditing = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain(mockProduct.name);
      expect(compiled.textContent).toContain(mockProduct.description);
      expect(compiled.textContent).toContain(mockProduct.price.toString());
    });

    it('should display form inputs in edit mode', () => {
      component.isEditing = true;
      fixture.detectChanges();

      const nameInput = fixture.debugElement.query(By.css('input[formControlName="name"]'));
      const descriptionTextarea = fixture.debugElement.query(By.css('textarea[formControlName="description"]'));

      expect(nameInput).toBeTruthy();
      expect(descriptionTextarea).toBeTruthy();
      expect(nameInput.nativeElement.value).toBe(mockProduct.name);
    });
  });
});
