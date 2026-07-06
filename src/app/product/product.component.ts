import { Component, computed, inject } from '@angular/core';
import { ProductService } from '../product.service';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
	selector: 'app-product',
	imports: [ProductCardComponent],
	templateUrl: './product.component.html',
	styleUrl: './product.component.css',
})
export class ProductComponent {
	service = inject(ProductService);
	products = this.service.productsResource || [];
	readiness = this.service.catalogReadinessResource;
	readinessByProductId = computed(() => {
		const response = this.readiness.value();
		return new Map(
			response?.products.map((product) => [product.productId, product]) ?? [],
		);
	});
}
