import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductService {


  constructor(private http: HttpClient) {}

  baseUrl = "https://3dprinter-web-api.benhalverson.workers.dev";
  // baseUrl = "http://localhost:8787";
  getProducts() {
    return this.http.get<ProductResponse>(`${this.baseUrl}/products`);
  }

}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  image: string;
  stl: string;
  price: number;
  filamentType: string;
  color: string;
}
