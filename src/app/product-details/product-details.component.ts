import { Component } from '@angular/core';
import { Product, ProductResponse, ProductService } from '../product.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-product-details',
    imports: [],
    templateUrl: './product-details.component.html',
    styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent {

  constructor(private readonly productService: ProductService, private readonly route: ActivatedRoute) { }

  productDetails = {} as Product;
  editableDetails = {} as Product;
  isEditing = false;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.productService.getProductById(params['id']).subscribe((product: ProductResponse) => {
        this.productDetails = product;
      });
    });
  }

  saveChanges() {
    this.productService.updateProduct(this.productDetails).subscribe(() => {});
  }

}
