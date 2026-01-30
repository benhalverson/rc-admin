import { HttpClient, httpResource } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
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
			.get<FilamentColorsApiResponse>(`${this.baseUrl}/v2/colors`, {
				params: { filamentType },
			})
			.pipe(
				map((response) => response.data),
				tap((colors) => {
					this.colorsSignal.set(colors);
				}),
				finalize(() => {
					this.colorsLoadingSignal.set(false);
				}),
			);
	}

	getProductById(id: number): Observable<ProductResponse> {
		return this.http.get<ProductResponse>(`${this.baseUrl}/product/${id}`);
	}

	updateProduct(product: ProductResponse): Observable<void> {
		const basePayload: ProductUpdatePayload = {
			id: product.id,
			name: product.name,
			description: product.description,
			stl: product.stl,
			price: product.price,
			filamentType: product.filamentType,
			color: product.color,
			image: product.image,
		};

		const imageGallery = product.imageGallery ?? [];
		const payload =
			imageGallery.length > 0
				? { ...basePayload, imageGallery }
				: basePayload;

		return this.http.put<void>(`${this.baseUrl}/update-product`, payload);
	}

	createProduct(product: Product): Observable<ProductResponse> {
		return this.http.post<ProductResponse>(
			`${this.baseUrl}/add-product`,
			product,
		);
	}

	deleteProduct(id: number): Observable<DeleteProductResponse> {
		return this.http.delete<DeleteProductResponse>(
			`${this.baseUrl}/delete-product/${id}`,
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

export interface DeleteProductResponse {
	success: boolean;
	message: string;
}

interface FilamentColorsApiResponse {
	success: boolean;
	message: string;
	data: FilamentColorsResponse[];
	count: number;
	lastUpdated: string;
}

interface ProductUpdatePayload {
	id: number;
	name: string;
	description: string;
	stl: string;
	price: number;
	filamentType: 'PLA' | 'PETG';
	color: string;
	image: string;
	imageGallery?: string[];
}
