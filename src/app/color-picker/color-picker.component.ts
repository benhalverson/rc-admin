import { CommonModule } from '@angular/common';
import {
	Component,
	computed,
	EventEmitter,
	Input,
	inject,
	type OnChanges,
	type OnInit,
	Output,
	type SimpleChanges,
} from '@angular/core';
import { ProductService } from '../product.service';

@Component({
	selector: 'app-color-picker',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './color-picker.component.html',
})
export class ColorPickerComponent implements OnInit, OnChanges {
	private productService = inject(ProductService);

	@Input({ required: true }) filamentType!: 'PLA' | 'PETG';
	@Input() model: string | null = null;
	@Output() modelChange = new EventEmitter<string>();

	// Use computed signals from the product service
	colorOptions = computed(() => this.productService.colors());
	isLoading = computed(() => this.productService.colorsLoading());

	ngOnInit() {
		if (this.filamentType) {
			this.fetchColors();
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['filamentType'] && !changes['filamentType'].firstChange) {
			this.fetchColors();
		}
	}

	private fetchColors() {
		this.productService.getColors(this.filamentType).subscribe();
	}

	selectColor(color: string) {
		this.modelChange.emit(color);
	}
}
