import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css',
})
export class AddProductComponent {
  productForm: FormGroup;

  constructor(private readonly fb: FormBuilder, private readonly http: HttpClient) {
    this.productForm = this.fb.group({
      // name: ['', Validators.required, Validators.minLength(3)],
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
    console.log(this.productForm.value);
    if(this.productForm.valid) {
      const formData = this.productForm.value;
      try {
       const response = await firstValueFrom(this.http.post('http://localhost:8787/add-product', formData));
       console.log('Response', response);
      } catch (error) {
        console.error('Failed to add data', error);
      }
    }
  }
}
