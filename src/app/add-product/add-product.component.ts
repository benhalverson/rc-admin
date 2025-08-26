import { CommonModule } from '@angular/common';
import { Component, effect, OnInit, signal, inject, computed } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Product, ProductService } from '../product.service';
import { ToastrService } from 'ngx-toastr';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { Filament } from '../types/filament';
import { Upload } from '../upload/upload';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ColorPickerComponent, Upload],
  templateUrl: './add-product.component.html',
})
export class AddProductComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly toastr = inject(ToastrService);

  productForm: FormGroup;
  colorControl: FormControl<string | null>;
  imageGallery = signal<string[]>([]);

  constructor() {
    this.colorControl = new FormControl<string | null>(null, Validators.required);

    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      image: [''],
      stl: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      filamentType: ['PLA', Validators.required],
      color: this.colorControl,
      imageGallery: [[]],
    });
  }

  ngOnInit() {
    console.log('imageGallery', this.productForm);
    // Initialize with PLA colors
    this.productService.getColors('PLA').subscribe();
  }

  onStlUploaded(url: string) {
    console.log('STL file uploaded:', url);
    this.productForm.get('stl')?.setValue(url);
  }

  onPngUpload(url: string) {
    console.log('Png file uploaded:', url);
    this.productForm.get('image')?.setValue(url);
  }

  onGalleryImageUpload(url: string) {
    console.log('Gallery image uploaded:', url);
    const currentGallery = this.imageGallery();
    const updatedGallery = [...currentGallery, url];
    this.imageGallery.set(updatedGallery);
    this.productForm.get('imageGallery')?.setValue(updatedGallery);
  }

  removeGalleryImage(index: number) {
    const currentGallery = this.imageGallery();
    const updatedGallery = currentGallery.filter((_, i) => i !== index);
    this.imageGallery.set(updatedGallery);
    this.productForm.get('imageGallery')?.setValue(updatedGallery);
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
          color: null,
          imageGallery: [],
        });
        this.imageGallery.set([]);
      } catch (error) {
        console.error('Failed to add product', error);
        this.toastr.error('Failed to add product.');
      }
    }
  }
}

