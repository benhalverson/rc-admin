import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import {
	type CatalogProductReadiness,
	type ProductResponse,
	ProductService,
} from '../product.service';

@Component({
	selector: 'app-product-card',
	standalone: true,
	imports: [CommonModule, RouterLink, CurrencyPipe],
	templateUrl: './product-card.component.html',
	styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
	product = input.required<ProductResponse>();
	readiness = input<CatalogProductReadiness | null>(null);
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

	readinessLabel() {
		const readiness = this.readiness();
		if (!readiness) {
			return 'Readiness unknown';
		}
		return readiness.checkoutReady ? 'Checkout ready' : 'Needs setup';
	}

	readinessReasons() {
		return this.readiness()?.reasons.join(', ') ?? '';
	}
}
