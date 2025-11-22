import { HttpClient, httpResource } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import type { FilamentColorsResponse } from './types/filament';

@Injectable({
	providedIn: 'root',
})
export class ProductService {
	private http = inject(HttpClient);
	baseUrl = environment.baseurl;

	// Signals for managing state
	private productsSignal = signal<ProductResponse[]>([]);
	private productsLoadingSignal = signal(false);
	// Store colors as an array so the color picker can iterate over them
	private colorsSignal = signal<FilamentColorsResponse[]>([]);
	private colorsLoadingSignal = signal(false);

	// Computed signals for easy access
	products = computed<ProductResponse[]>(() => this.productsSignal());
	productsLoading = computed<boolean>(() => this.productsLoadingSignal());
	colors = computed<FilamentColorsResponse[]>(() => this.colorsSignal());
	colorsLoading = computed<boolean>(() => this.colorsLoadingSignal());

	readonly productsResource = httpResource<ProductResponse[]>(() => {
		return `${this.baseUrl}/products`;
	});
	/** @deprecated use productsResource instead */
	getProducts(): Observable<ProductResponse[]> {
		this.productsLoadingSignal.set(true);
		return this.http.get<ProductResponse[]>(`${this.baseUrl}/products`).pipe(
			tap((products) => {
				this.productsSignal.set(products);
				this.productsLoadingSignal.set(false);
			}),
		);
	}

	getColors(
		filamentType: 'PLA' | 'PETG',
	): Observable<FilamentColorsResponse[]> {
		this.colorsLoadingSignal.set(true);
		return this.http
			.get<FilamentColorsResponse[]>(`${this.baseUrl}/colors`, {
				params: { filamentType },
			})
			.pipe(
				map((colors) => {
					const arr = Array.isArray(colors) ? colors : [];
					this.colorsSignal.set(arr);
					this.colorsLoadingSignal.set(false);
					return arr;
				}),
			);
	}

	getProductById(id: number): Observable<ProductResponse> {
		return this.http.get<ProductResponse>(`${this.baseUrl}/product/${id}`);
	}

	updateProduct(product: Product): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/update-product`, product);
	}

	createProduct(product: Product): Observable<ProductResponse> {
		return this.http.post<ProductResponse>(
			`${this.baseUrl}/add-product`,
			product,
		);
	}

	// Method to manually refresh products
	refreshProducts(): void {
		this.getProducts().subscribe();
	}
}

export interface ProductResponse extends Product {
	id: number;
}

export interface Product {
	name: string;
	description: string;
	image: string;
	stl: string;
	price: number;
	filamentType: 'PLA' | 'PETG';
	color: string;
	imageGallery?: string[];
}
