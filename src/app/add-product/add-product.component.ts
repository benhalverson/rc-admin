import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Product, ProductService } from '../product.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-add-product',
    imports: [ReactiveFormsModule, CommonModule,],
    templateUrl: './add-product.component.html',
    styleUrl: './add-product.component.css'
})
export class AddProductComponent {
  productForm: FormGroup;

  constructor(private readonly fb: FormBuilder, private readonly productService: ProductService, private readonly toastr: ToastrService) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      image: [''],
      stl: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      filamentType: ['PLA', Validators.required],
      color: ['#000000', Validators.required],
    });
  }

  async onSubmit() {
    if (this.productForm.valid) {
      const formData: Product = {
        ...this.productForm.value,
        price: parseFloat(this.productForm.value.price) || 0,
      };

      try {
        await firstValueFrom(this.productService.createProduct(formData));
        this.toastr.success('Product added successfully!');

        this.productForm.reset({
          name: '',
          description: '',
          image: '',
          stl: '',
          price: 0,
          filamentType: 'PLA',
          color: '#000000',
        });
      } catch (error) {
        console.error('Failed to add data', error);
        this.toastr.error('Failed to add product.');
      }
    } else {
      console.warn('Form is invalid');
    }
  }
}
