import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import type { FilamentResponse, FilamentColorsResponse } from './types/filament';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // constructor(private readonly http: HttpClient) {}
  private http = inject(HttpClient);
  baseUrl = environment.baseurl;



  // Signals for managing state
  private productsSignal = signal<ProductResponse[]>([]);
  private productsLoadingSignal = signal(false);
  private colorsSignal = signal<FilamentColorsResponse | null>(null);
  private colorsLoadingSignal = signal(false);

  // Computed signals for easy access
  products = computed(() => this.productsSignal());
  productsLoading = computed(() => this.productsLoadingSignal());
  colors = computed(() => this.colorsSignal());
  colorsLoading = computed(() => this.colorsLoadingSignal());

  readonly productsResource = httpResource<ProductResponse[]>(() => {
    return `${this.baseUrl}/products`;
  });

  reload() {
    return this.productsResource.reload();
  }

  getColors(filamentType: 'PLA' | 'PETG'): Observable<FilamentColorsResponse> {
    this.colorsLoadingSignal.set(true);
    // The backend returns an array of `FilamentResponse` objects.
    return this.http.get<FilamentResponse[]>(`${this.baseUrl}/colors`, {
      params: { filamentType },
    }).pipe(
      map((colors) => ({
        filaments: colors.map(c => ({
          // Map the backend response to the client-facing Filament shape
          filament: c.profile || '',
          hexColor: c.hexValue?.startsWith('#') ? c.hexValue : `#${c.hexValue}`,
          colorTag: c.color || c.name || ''
        }))
      })),
      tap((colorResponses: FilamentColorsResponse)=> {
        this.colorsSignal.set(colorResponses);
        this.colorsLoadingSignal.set(false);
      })
    );
  }

  getProductById(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/product/${id}`);
  }

  updateProduct(product: Product): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/update-product`, product);
  }

  deleteProduct(product: ProductResponse): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete-product/${product.id}`);
  }

  createProduct(product: Product): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.baseUrl}/add-product`, product);
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

export interface ProductDeleteResponse {
  success: boolean,
  message: string;
}
