import { Component, Input, Output, EventEmitter, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-picker.component.html',
})
export class ColorPickerComponent {
  @Input({ required: true }) filamentType!: string;
  @Input({ required: true }) colorOptions!: Signal<Filament[]>;
  @Input() isLoading: Signal<boolean> = signal(false);
  @Input() model: string | null = null;
  @Output() modelChange = new EventEmitter<string>();

  selectColor(color: string) {
    this.modelChange.emit(color);
  }
}

// Interfaces
interface Filament {
  filament: string;
  hexColor: string;
  colorTag: string;
  profile: string;
}
