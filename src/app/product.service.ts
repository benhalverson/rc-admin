import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { FilamentColorsResponse } from './types/filament';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  baseUrl = environment.baseurl;

  constructor(private http: HttpClient) { }

  getProducts(): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/products` );
  }

  getColors(filamentType: 'PLA' | 'PETG'): Observable<FilamentColorsResponse> {

    return this.http.get<FilamentColorsResponse>(`${this.baseUrl}/colors`, {
      params: { filamentType },
    });
  }

  getProductById(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/product/${id}`);
  }

  updateProduct(product: Product): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/update-product`, product, {
      withCredentials: true,
    });
  }

  createProduct(product: Product): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.baseUrl}/add-product`, product, {
      withCredentials: true,
    });
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
}

