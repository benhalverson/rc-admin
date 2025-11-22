import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { type ProductResponse, ProductService } from '../product.service';

@Component({
	selector: 'app-product-card',
	standalone: true,
	imports: [CommonModule, RouterLink, CurrencyPipe],
	templateUrl: './product-card.component.html',
	styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
	product = input.required<ProductResponse>();
	private readonly service = inject(ProductService);
	private readonly toastService = inject(ToastrService);

	products = this.service.productsResource;

	delete() {
		return this.service
			.deleteProduct(this.product().id)
			.pipe(
				tap((data) => {
					const response: { message: string } = data;
					this.toastService.success(`${response.message}`, 'Success');
				}),
				finalize(() => {
					this.products.reload();
				}),
				catchError((error) => {
					if (error instanceof Error) {
						this.toastService.error(
							`Error deleting product: ${error.message}`,
							'Error',
						);
					} else {
						this.toastService.error('Error deleting product', 'Error');
					}
					return EMPTY;
				}),
			)
			.subscribe();
	}
}
