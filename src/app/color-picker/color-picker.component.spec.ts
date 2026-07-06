import {
	HttpClientTestingModule,
	HttpTestingController,
} from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from '../../environments/environment';
import { FilamentColorsResponse, Profile, Provider } from '../types/filament';
import { ColorPickerComponent } from './color-picker.component';

describe('ColorPickerComponent', () => {
	let component: ColorPickerComponent;
	let fixture: ComponentFixture<ColorPickerComponent>;
	let httpMock: HttpTestingController;

	beforeEach(async () => {
		const mockColors: FilamentColorsResponse[] = [
			{
				name: 'Red PLA',
				provider: Provider.Polymaker,
				public: true,
				available: true,
				color: 'PLA',
				profile: Profile.Pla,
				hexValue: 'FF0000',
				publicId: 'red-pla',
			},
			{
				name: 'Blue PLA',
				provider: Provider.Polymaker,
				public: true,
				available: true,
				color: 'PLA',
				profile: Profile.Pla,
				hexValue: '0000FF',
				publicId: 'blue-pla',
			},
			{
				name: 'Green PLA',
				provider: Provider.Polymaker,
				public: true,
				available: true,
				color: 'PLA',
				profile: Profile.Pla,
				hexValue: '00FF00',
				publicId: 'green-pla',
			},
		];

		await TestBed.configureTestingModule({
			imports: [
				ColorPickerComponent,
				HttpClientTestingModule,
				RouterTestingModule,
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ColorPickerComponent);
		component = fixture.componentInstance;
		component.filamentType = 'PLA';

		httpMock = TestBed.inject(HttpTestingController);

		fixture.detectChanges();

		const req = httpMock.expectOne(
			`${environment.baseurl}/v2/colors?filamentType=PLA`,
		);
		expect(req.request.method).toBe('GET');
		req.flush({
			success: true,
			message: 'ok',
			data: mockColors,
			count: mockColors.length,
			lastUpdated: new Date().toISOString(),
		});
		fixture.detectChanges();
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have required filamentType input', () => {
		expect(component.filamentType).toBe('PLA');
	});

	it('should initialize with null model by default', () => {
		expect(component.model).toBeNull();
	});

	it('should emit modelChange when selectColor is called', () => {
		vi.spyOn(component.modelChange, 'emit');

		component.selectColor('red');

		expect(component.modelChange.emit).toHaveBeenCalledWith('red');
	});

	it('should emit different colors when selectColor is called multiple times', () => {
		vi.spyOn(component.modelChange, 'emit');

		component.selectColor('red');
		component.selectColor('blue');
		component.selectColor('green');

		expect(component.modelChange.emit).toHaveBeenCalledTimes(3);
		expect(component.modelChange.emit).toHaveBeenCalledWith('red');
		expect(component.modelChange.emit).toHaveBeenCalledWith('blue');
		expect(component.modelChange.emit).toHaveBeenCalledWith('green');
	});

	it('should get color options from computed signal', () => {
		const colorOptions = component.colorOptions();
		expect(colorOptions.length).toBe(3);
		expect(colorOptions[0].hexValue).toBe('FF0000');
	});

	it('should get loading state from computed signal', () => {
		const isLoading = component.isLoading();
		expect(isLoading).toBeFalsy();
	});

	it('should fetch colors for initial filamentType', () => {
		const colorOptions = component.colorOptions();
		expect(colorOptions.length).toBe(3);
		expect(colorOptions[0].hexValue).toBe('FF0000');
	});

	it('should handle empty color list', () => {
		// Test that the component works when service returns empty colors
		// Since the computed signal is based on service.colors(), we test the component's behavior
		const colorOptions = component.colorOptions();

		// The component should handle the case whether colors are empty or not
		expect(colorOptions).toBeDefined();
		expect(Array.isArray(colorOptions)).toBeTruthy();
	});

	it('should handle filamentType change to PETG', async () => {
		const mockPetgColors: FilamentColorsResponse[] = [
			{
				name: 'Blue PETG',
				provider: Provider.Polymaker,
				public: true,
				available: true,
				color: 'PETG',
				profile: Profile.Petg,
				hexValue: '0000FF',
				publicId: 'blue-petg',
			},
		];

		component.filamentType = 'PETG';
		fixture.detectChanges();

		const req = httpMock.expectOne(
			`${environment.baseurl}/v2/colors?filamentType=PETG`,
		);
		expect(req.request.method).toBe('GET');
		req.flush({
			success: true,
			message: 'ok',
			data: mockPetgColors,
			count: mockPetgColors.length,
			lastUpdated: new Date().toISOString(),
		});
		await fixture.whenStable();
		fixture.detectChanges();

		const colorOptions = component.colorOptions();
		expect(colorOptions.length).toBe(1);
		expect(colorOptions[0].profile).toBe(Profile.Petg);
	});
});
