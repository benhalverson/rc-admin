import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.service';
import { Observable, of } from 'rxjs';
import { AsyncPipe, NgFor, } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-product',
    imports: [RouterLink, NgFor, AsyncPipe],
    templateUrl: './product.component.html',
    styleUrl: './product.component.css'
})
export class ProductComponent implements OnInit {
  constructor(private readonly product: ProductService) {}

  data: Observable<any> = of([]);
  ngOnInit(): void {
    try {
      this.data = this.product.getProducts();
    } catch (error) {
      console.error('Failed to load data', error);
    }
  }
}
