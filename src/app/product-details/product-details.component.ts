import { Component } from '@angular/core';
import { Product, ProductService } from '../product.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { catchError, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-details',
  imports: [ReactiveFormsModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent {

  productForm: FormGroup
  productDetails = {} as Product;
  editableDetails = {} as Product;
  isEditing = false;
  private destroy$ = new Subject<void>();


  constructor(
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly toastr: ToastrService
  ) {
    this.productForm = this.fb.group({
      name: [''],
      description: ['', ],
      filamentType: [''],
    });
  }

  ngOnInit() {
    this.route.params
      .pipe(
        switchMap((params: Params) =>
          this.productService.getProductById(params['id'])
        ),
        tap((product) => {
          this.productDetails = product;
          this.productForm.patchValue(product);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  saveChanges() {
    if(this.productForm.invalid) {
      return;
    }

    const updatedProduct: Product = {
      ...this.productDetails,
      ...this.productForm.value,
    }

    this.productService
      .updateProduct(updatedProduct)
      .pipe(
        tap(() => {
          this.productDetails = updatedProduct;
          this.isEditing = false;
          this.toastr.success('Product updated successfully');
          this.router.navigate(['/products']);
        }),
        catchError((error) => {
          this.toastr.error('Error updating product');
          // this.router.navigate(['/']);
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
