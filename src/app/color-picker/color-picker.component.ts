import { Component, Input, Output, EventEmitter, OnInit, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Filament } from '../types/filament';
import { ProductService } from '../product.service';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-picker.component.html',
})
export class ColorPickerComponent implements OnInit {
  private productService = inject(ProductService);

  @Input({ required: true }) filamentType!: 'PLA' | 'PETG';
  @Input() model: string | null = null;
  @Output() modelChange = new EventEmitter<string>();

  // Use computed signals from the product service
  colorOptions = computed(() => this.productService.colors().filaments);
  isLoading = computed(() => this.productService.colorsLoading());

  constructor() {
    // Effect to watch for filament type changes
    effect(() => {
      if (this.filamentType) {
        this.productService.getColors(this.filamentType).subscribe();
      }
    });
  }

  ngOnInit() {
    // Load colors for the initial filament type
    if (this.filamentType) {
      this.productService.getColors(this.filamentType).subscribe();
    }
  }

  selectColor(color: string) {
    this.modelChange.emit(color);
  }
}
