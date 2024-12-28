import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { Product, ProductService } from '../product.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { catchError, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  WMLThreeCommonObjectProps,
  WMLThreeCommonProps,
} from '@windmillcode/wml-three';
import { BoxGeometry, Vector3, MeshBasicMaterial } from 'three';

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


  @ViewChild('renderer', { read: ViewContainerRef, static: true })
  renderer!: ViewContainerRef;
  ngUnsub = new Subject<void>();
  three!: WMLThreeCommonProps;

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

  let box = new WMLThreeCommonObjectProps({
      geometry: new BoxGeometry(7, 7, 7),
      material: new MeshBasicMaterial({
        color: 0x11ff00,
      }),
    });
    this.three = new WMLThreeCommonProps({
      rendererParentElement: this.renderer.element.nativeElement,
      objects: [box],
    });

    this.three.init({});
    this.three.updateCameraPosition({
      position: new Vector3(-60, 20, -20),
      updateControls: true,
    });

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
