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

    component.filamentType = 'PETG';
    fixture.detectChanges();

    // The effect should trigger getColors with new filament type
    expect(productService.getColors).toHaveBeenCalledWith('PETG');
  });

  it('should handle empty color list', () => {
    (productService as any).colors = () => ({ filaments: [] });

    const colorOptions = component.colorOptions();
    expect(colorOptions).toEqual([]);
  });

  it('should handle loading state', () => {
    (productService as any).colorsLoading = () => true;

    const isLoading = component.isLoading();
    expect(isLoading).toBeTruthy();
  });
});
