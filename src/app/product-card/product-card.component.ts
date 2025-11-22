import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ProductResponse } from '../product.service';

@Component({
	selector: 'app-product-card',
	standalone: true,
	imports: [CommonModule, RouterLink, CurrencyPipe],
	templateUrl: './product-card.component.html',
	styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
	product = input.required<ProductResponse>();
}
