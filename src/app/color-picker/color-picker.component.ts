import { httpResource } from '@angular/common/http';
import {
	Component,
	computed,
	EventEmitter,
	Input,
	Output,
	signal,
} from '@angular/core';
import { environment } from '../../environments/environment';
import type { FilamentColorsResponse } from '../types/filament';

@Component({
	selector: 'app-color-picker',
	standalone: true,
	imports: [],
	templateUrl: './color-picker.component.html',
})
export class ColorPickerComponent {
	private filamentTypeSignal = signal<'PLA' | 'PETG'>('PLA');

	@Input({ required: true })
	set filamentType(value: 'PLA' | 'PETG') {
		this.filamentTypeSignal.set(value);
	}

	get filamentType(): 'PLA' | 'PETG' {
		return this.filamentTypeSignal();
	}

	@Input() model: string | null = null;
	@Output() modelChange = new EventEmitter<string>();

	readonly colorsResource = httpResource<FilamentColorsApiResponse>(
		() =>
			`${environment.baseurl}/v2/colors?filamentType=${this.filamentTypeSignal()}`,
	);

	colorOptions = computed<FilamentColorsResponse[]>(() => {
		if (this.colorsResource.hasValue()) {
			return this.colorsResource.value().data;
		}
		return [];
	});

	filteredColorOptions = computed(() =>
		this.colorOptions().filter(
			(option) => option.profile === this.filamentType,
		),
	);

	isLoading = computed(() => this.colorsResource.isLoading());

	selectColor(color: string) {
		this.modelChange.emit(color);
	}
}

interface FilamentColorsApiResponse {
	success: boolean;
	message: string;
	data: FilamentColorsResponse[];
	count: number;
	lastUpdated: string;
}
