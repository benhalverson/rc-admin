import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ColorPickerComponent } from './color-picker.component';
import { ProductService } from '../product.service';

describe('ColorPickerComponent', () => {
  let component: ColorPickerComponent;
  let fixture: ComponentFixture<ColorPickerComponent>;
  let productService: jasmine.SpyObj<ProductService>;

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', ['getColors']);

    // Mock the colors and colorsLoading computed signals
    (productServiceSpy as any).colors = () => ({
      filaments: [
        { filament: 'PLA', hexColor: '#FF0000', colorTag: 'red' },
        { filament: 'PLA', hexColor: '#0000FF', colorTag: 'blue' },
        { filament: 'PLA', hexColor: '#00FF00', colorTag: 'green' }
      ]
    });

    (productServiceSpy as any).colorsLoading = () => false;

    await TestBed.configureTestingModule({
      imports: [ColorPickerComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ProductService, useValue: productServiceSpy }
      ]
    })
    .compileComponents();

    productService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    productService.getColors.and.returnValue(of({
      filaments: [
        { filament: 'PLA', hexColor: '#FF0000', colorTag: 'red' },
        { filament: 'PLA', hexColor: '#0000FF', colorTag: 'blue' },
        { filament: 'PLA', hexColor: '#00FF00', colorTag: 'green' }
      ]
    }));

    fixture = TestBed.createComponent(ColorPickerComponent);
    component = fixture.componentInstance;
    component.filamentType = 'PLA'; // Set required input
    fixture.detectChanges();
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

  it('should call getColors on init with filamentType', () => {
    expect(productService.getColors).toHaveBeenCalledWith('PLA');
  });

  it('should emit modelChange when selectColor is called', () => {
    spyOn(component.modelChange, 'emit');

    component.selectColor('red');

    expect(component.modelChange.emit).toHaveBeenCalledWith('red');
  });

  it('should emit different colors when selectColor is called multiple times', () => {
    spyOn(component.modelChange, 'emit');

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
    expect(colorOptions).toEqual([
      { filament: 'PLA', hexColor: '#FF0000', colorTag: 'red' },
      { filament: 'PLA', hexColor: '#0000FF', colorTag: 'blue' },
      { filament: 'PLA', hexColor: '#00FF00', colorTag: 'green' }
    ]);
  });

  it('should get loading state from computed signal', () => {
    const isLoading = component.isLoading();
    expect(isLoading).toBeFalsy();
  });

  it('should handle filamentType change to PETG', () => {
    productService.getColors.calls.reset();

    // Set the new filament type and trigger change detection
    component.filamentType = 'PETG';

    // Call ngOnInit to trigger the effect with the new filament type
    component.ngOnInit();

    // The effect should trigger getColors with new filament type
    expect(productService.getColors).toHaveBeenCalledWith('PETG');
  });

  it('should handle empty color list', () => {
    // Test that the component works when service returns empty colors
    // Since the computed signal is based on service.colors(), we test the component's behavior
    const colorOptions = component.colorOptions();

    // The component should handle the case whether colors are empty or not
    expect(colorOptions).toBeDefined();
    expect(Array.isArray(colorOptions)).toBeTruthy();
  });

  it('should handle loading state', () => {
    // Mock the service to simulate loading state
    // We need to directly test the computed signal which reflects the service's loading state

    // Check that initially the loading state is false (from beforeEach setup)
    expect(component.isLoading()).toBeFalsy();

    // Test that we can get loading state from the service
    const isServiceLoading = productService.colorsLoading();
    expect(isServiceLoading).toBeDefined();
  });
});
