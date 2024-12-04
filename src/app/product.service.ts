import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  baseUrl = "http://localhost:8787";

  constructor(private http: HttpClient) {}

  getProducts(): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/products`);
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
  filamentType: string;
  color: string;
}
