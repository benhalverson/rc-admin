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
	readonly catalogReadinessResource = httpResource<CatalogReadinessResponse>(
		() => {
			return `${this.baseUrl}/admin/catalog/readiness`;
		},
	);
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

	getColors(filamentType: FilamentType): Observable<FilamentColorsResponse[]> {
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
			price: product.price,
			filamentType: product.filamentType,
			color: product.color,
			image: product.image,
		};

		const imageGallery = product.imageGallery ?? [];
		const payload =
			imageGallery.length > 0 ? { ...basePayload, imageGallery } : basePayload;

		return this.http.put<void>(`${this.baseUrl}/update-product`, payload);
	}

	createProduct(product: ProductCreateRequest): Observable<ProductResponse> {
		const { stl: _deprecatedStl, ...canonicalProduct } = product;
		const imageGallery = canonicalProduct.imageGallery ?? [];
		const payload =
			imageGallery.length > 0
				? { ...canonicalProduct, imageGallery }
				: { ...canonicalProduct, imageGallery: undefined };

		return this.http
			.post<AddProductV2Response>(`${this.baseUrl}/v2/add-product`, payload)
			.pipe(
				map((response) => response.product),
				tap(() => this.reloadProductResources()),
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

	reloadProductResources(): void {
		this.productsResource.reload();
		this.catalogReadinessResource.reload();
	}
}

export interface ProductResponse extends Product {
	id: number;
	publicFileServiceId: string | null;
}

export interface CatalogProductReadiness {
	productId: number;
	skuNumber: string | null;
	name: string | null;
	checkoutReady: boolean;
	reasons: string[];
	stripePriceId: string | null;
	publicFileServiceId: string | null;
	defaultFilamentId: string;
}

export interface CatalogReadinessResponse {
	products: CatalogProductReadiness[];
	summary: {
		total: number;
		ready: number;
		notReady: number;
	};
}

export interface Product {
	name: string;
	description: string;
	image: string;
	/** @deprecated Compatibility response field hydrated by the API; not product identity. */
	stl: string;
	price: number;
	filamentType: FilamentType;
	color: string;
	imageGallery?: string[];
}

export interface ProductCreateRequest extends Omit<Product, 'stl'> {
	publicFileServiceId: string;
	/** @deprecated Product creation stores publicFileServiceId, not STL URLs. */
	stl?: string;
}

export interface ProductV2Response {
	name: string;
	description: string;
	image: string;
	imageGallery: string[];
	stl: string;
	price: number;
	filamentType: FilamentType;
	skuNumber: string;
	color: string;
	stripeProductId: string;
	stripePriceId: string;
	publicFileServiceId: string | null;
	categories: {
		categoryId: number;
		categoryName: string;
	}[];
}

export interface ProductV2Response extends Product {
	id: number;
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

interface AddProductV2Response {
	success: boolean;
	message: string;
	product: ProductResponse;
}

interface ProductUpdatePayload {
	id: number;
	name: string;
	description: string;
	price: number;
	filamentType: FilamentType;
	color: string;
	image: string;
	imageGallery?: string[];
}

export enum FilamentType {
	PLA = 'PLA',
	PETG = 'PETG',
}
