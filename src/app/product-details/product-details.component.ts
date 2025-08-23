import { Component, signal } from '@angular/core';
import { Product, ProductService } from '../product.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  catchError,
  firstValueFrom,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { Filament } from '../types/filament';
import { CommonModule } from '@angular/common';
import { Upload } from '../upload/upload';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [ReactiveFormsModule, ColorPickerComponent, CommonModule, Upload],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent {
  productForm!: FormGroup;
  colorControl = new FormControl<string | null>(null);
  productDetails: Product | null = null;
  isEditing = false;
  colorOptions = signal<Filament[]>([]);
  isLoading = signal(false);
  filteredColorOptions = signal<Filament[]>([]);
  imageGallery = signal<string[]>([]);

  private destroy$ = new Subject<void>();

  constructor(
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly toastr: ToastrService
  ) {}

  get safeImageGallery(): string[] {
    if (!this.productDetails?.imageGallery) {
      return [];
    }

    if (typeof this.productDetails.imageGallery === 'string') {
      try {
        return JSON.parse(this.productDetails.imageGallery);
      } catch {
        return [];
      }
    }

    return Array.isArray(this.productDetails.imageGallery) ? this.productDetails.imageGallery : [];
  }

  ngOnInit() {
    this.route.params
      .pipe(
        switchMap((params: Params) =>
          this.productService.getProductById(params['id'])
        ),
        tap((product) => {
          console.log('Raw product from backend:', product);
          console.log('imageGallery before processing:', product.imageGallery, typeof product.imageGallery);

          // Parse imageGallery if it's a string
          if (product.imageGallery && typeof product.imageGallery === 'string') {
            try {
              product.imageGallery = JSON.parse(product.imageGallery);
              console.log('Successfully parsed imageGallery:', product.imageGallery);
            } catch (error) {
              console.error('Failed to parse imageGallery:', error);
              product.imageGallery = [];
            }
          }

          // Ensure imageGallery is always an array
          if (!Array.isArray(product.imageGallery)) {
            product.imageGallery = [];
          }

          console.log('Final imageGallery:', product.imageGallery, typeof product.imageGallery);

          this.productDetails = product;
          this.initForm(product);

          const initialColors = this.route.snapshot.data['colorOptions'];
          this.colorOptions.set(initialColors);

          this.updateFilteredColorOptions();

          this.productForm
            .get('filamentType')
            ?.valueChanges.subscribe((filamentType) => {
              console.log('Filament type changed:', filamentType);
              this.fetchColorsByFilamentType(filamentType);
            });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  updateFilteredColorOptions() {
    const selectedFilamentType = this.productForm?.get('filamentType')?.value;
    const filtered = this.colorOptions().filter(
      (option) => option.filament === selectedFilamentType
    );
    this.filteredColorOptions.set(filtered);
  }

  async fetchColorsByFilamentType(filamentType: 'PLA' | 'PETG') {
    try {
      this.isLoading.set(true);
      const colorsResponse = await firstValueFrom(
        this.productService.getColors(filamentType)
      );
      console.log('Fetched colors response:', colorsResponse);


      this.colorOptions.set(colorsResponse.filaments); // ✅ not .colors, use .filaments
    } catch (error) {
      console.error('Failed to fetch colors:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  initForm(product: Product) {
    this.colorControl = new FormControl<string | null>(
      product.color ?? null,
      Validators.required
    );

    // Initialize imageGallery signal with product's gallery or empty array
    this.imageGallery.set(product.imageGallery || []);

    this.productForm = this.fb.group({
      name: [
        product.name || '',
        [Validators.required, Validators.minLength(3)],
      ],
      description: [product.description || '', Validators.required],
      image: [product.image || ''],
      stl: [product.stl || '', Validators.required],
      price: [product.price || 0, [Validators.required, Validators.min(0)]],
      filamentType: [product.filamentType || 'PLA', Validators.required],
      color: this.colorControl, // 🎯 wire color control into form
      imageGallery: [product.imageGallery || []],
    });
  }

  saveChanges() {
    if (!this.productForm || this.productForm.invalid) {
      return;
    }

    const updatedProduct: Product = {
      ...this.productDetails!,
      ...this.productForm.value,
      color: this.colorControl.value,
      imageGallery: this.imageGallery(),
    };

    this.productService
      .updateProduct(updatedProduct)
      .pipe(
        tap(() => {
          this.productDetails = updatedProduct;
          this.isEditing = false;
          this.toastr.success('Product updated successfully');
        }),
        catchError((error) => {
          this.toastr.error('Error updating product');
          return of(error);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  onGalleryImageUpload(url: string) {
    console.log('Gallery image uploaded:', url);
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

  onImageLoad(imageUrl: string) {
    console.log('Image loaded successfully:', imageUrl);
  }

  onImageError(event: any, imageUrl: string) {
    console.error('Image failed to load:', imageUrl);
    console.error('Error event:', event);
    // Try to provide fallback or debugging info
    const img = event.target as HTMLImageElement;
    console.error('Image natural dimensions:', img.naturalWidth, img.naturalHeight);
    console.error('Image current src:', img.src);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
