import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { FilamentColorsResponse, Filament } from './types/filament';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  baseUrl = environment.baseurl;

  // Signals for managing state
  private productsSignal = signal<ProductResponse[]>([]);
  private productsLoadingSignal = signal(false);
  private colorsSignal = signal<FilamentColorsResponse>({ filaments: [] });
  private colorsLoadingSignal = signal(false);

  // Computed signals for easy access
  products = computed(() => this.productsSignal());
  productsLoading = computed(() => this.productsLoadingSignal());
  colors = computed(() => this.colorsSignal());
  colorsLoading = computed(() => this.colorsLoadingSignal());

  getProducts(): Observable<ProductResponse[]> {
    this.productsLoadingSignal.set(true);
    return this.http.get<ProductResponse[]>(`${this.baseUrl}/products`).pipe(
      tap(products => {
        this.productsSignal.set(products);
        this.productsLoadingSignal.set(false);
      })
    );
  }

  getColors(filamentType: 'PLA' | 'PETG'): Observable<FilamentColorsResponse> {
    this.colorsLoadingSignal.set(true);
    return this.http.get<Filament[]>(`${this.baseUrl}/colors`, {
      params: { filamentType },
    }).pipe(
      map((colors: Filament[]) => ({
        filaments: colors.map(color => ({
          filament: color.filament,
          hexColor: color.hexColor,
          colorTag: color.colorTag
        }))
      })),
      tap(colorsResponse => {
        this.colorsSignal.set(colorsResponse);
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

  createProduct(product: Product): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.baseUrl}/add-product`, product);
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

