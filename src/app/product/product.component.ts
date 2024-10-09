import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.service';
import { Observable, of } from 'rxjs';
import { CommonModule, NgFor, NgForOf } from '@angular/common';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css',
})
export class ProductComponent implements OnInit {
  constructor(private readonly product: ProductService) {}

  data: Observable<any> = of([]);
  ngOnInit(): void {
    this.data = this.product.getProducts()
  }
}

