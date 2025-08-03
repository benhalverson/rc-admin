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

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [ReactiveFormsModule, ColorPickerComponent],
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

  private destroy$ = new Subject<void>();

  constructor(
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        switchMap((params: Params) =>
          this.productService.getProductById(params['id'])
        ),
        tap((product) => {
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
