import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ProductDeleteResponse, ProductResponse, ProductService } from '../product.service';
import { catchError, tap, EMPTY, finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  product = input.required<ProductResponse>();
  service = inject(ProductService);
  toastService = inject(ToastrService);
  products = this.service.productsResource;
  
  delete() {
    return this.service.deleteProduct({ id: this.product().id } as ProductResponse)
      .pipe(
        tap((data) => {
          const response = data as unknown as ProductDeleteResponse;
          this.toastService.success(`${response.message}`, 'Success');
        }),
        finalize(() => {
          this.products.reload();
        }),
        catchError((error) => {
          if (error instanceof Error) {
            this.toastService.error(`Error deleting product: ${error.message}`, 'Error');
          } else {
            this.toastService.error('Error deleting product', 'Error');
          }
          return EMPTY;
        })
      )
      .subscribe();
  }
}

