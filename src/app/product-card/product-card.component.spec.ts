import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import type {} from 'jasmine';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { type ProductResponse, ProductService } from '../product.service';
import { ProductCardComponent } from './product-card.component';

describe('ProductCardComponent', () => {
	let component: ProductCardComponent;
	let fixture: ComponentFixture<ProductCardComponent>;
	let productService: jasmine.SpyObj<ProductService>;
	let toastrService: jasmine.SpyObj<ToastrService>;
	const productsResource = {
		reload: jasmine.createSpy('reload'),
	};

	const mockProduct: ProductResponse = {
		id: 1,
		name: 'Test Product',
		description:
			'This is a test product description that should be displayed in the card',
		image: 'https://example.com/test-image.jpg',
		stl: 'https://example.com/test.stl',
		price: 29.99,
		filamentType: 'PLA',
		color: '#FF0000',
		imageGallery: [
			'https://example.com/gallery1.jpg',
			'https://example.com/gallery2.jpg',
		],
	};

	beforeEach(async () => {
		productService = jasmine.createSpyObj('ProductService', ['deleteProduct'], {
			productsResource,
		});
		productService.deleteProduct.and.returnValue(
			of({ success: true, message: 'Product deleted successfully' }),
		);

		toastrService = jasmine.createSpyObj('ToastrService', ['success', 'error']);

		await TestBed.configureTestingModule({
			imports: [ProductCardComponent, RouterTestingModule],
			providers: [
				{ provide: ProductService, useValue: productService },
				{ provide: ToastrService, useValue: toastrService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ProductCardComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('product', mockProduct);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should display product information correctly', () => {
		const nameElement = fixture.debugElement.query(By.css('h3'));
		const descriptionElement = fixture.debugElement.query(By.css('p'));
		const priceElement = fixture.debugElement.query(By.css('.absolute span'));
		const filamentTypeElement = fixture.debugElement.query(
			By.css('.bg-blue-100'),
		);

		expect(nameElement.nativeElement.textContent.trim()).toBe('Test Product');
		expect(descriptionElement.nativeElement.textContent.trim()).toBe(
			'This is a test product description that should be displayed in the card',
		);
		expect(priceElement.nativeElement.textContent.trim()).toBe('$29.99');
		expect(filamentTypeElement.nativeElement.textContent.trim()).toBe('PLA');
	});

	it('should display product image with correct attributes', () => {
		const imageElement = fixture.debugElement.query(By.css('img'));

		expect(imageElement.nativeElement.src).toBe(
			'https://example.com/test-image.jpg',
		);
		expect(imageElement.nativeElement.alt).toBe('Test Product');
	});

	it('should display color information', () => {
		const colorElement = fixture.debugElement.query(
			By.css('.w-4.h-4.rounded-full'),
		);
		const colorTextElement = fixture.debugElement.query(
			By.css('.text-xs.text-gray-500'),
		);

		expect(colorElement.nativeElement.style.backgroundColor).toBe(
			'rgb(255, 0, 0)',
		);
		expect(colorTextElement.nativeElement.textContent.trim()).toBe('#FF0000');
	});

	it('should have a router link to product details', () => {
		const linkElement = fixture.debugElement.query(By.css('a'));

		expect(linkElement).toBeTruthy();
		expect(linkElement.nativeElement.textContent.trim()).toBe('View Details');
	});

	it('should apply hover classes for transitions', () => {
		const cardElement = fixture.debugElement.query(By.css('.bg-white'));

		expect(cardElement.nativeElement.classList).toContain('hover:shadow-lg');
		expect(cardElement.nativeElement.classList).toContain('transition-shadow');
	});

	it('should display different filament types correctly', () => {
		fixture.componentRef.setInput('product', {
			...mockProduct,
			filamentType: 'PETG',
		});
		fixture.detectChanges();

		const filamentTypeElement = fixture.debugElement.query(
			By.css('.bg-blue-100'),
		);
		expect(filamentTypeElement.nativeElement.textContent.trim()).toBe('PETG');
	});

	it('should handle different price formats', () => {
		fixture.componentRef.setInput('product', { ...mockProduct, price: 100.5 });
		fixture.detectChanges();

		const priceElement = fixture.debugElement.query(By.css('.absolute span'));
		expect(priceElement.nativeElement.textContent.trim()).toBe('$100.50');
	});

	it('should truncate long descriptions', () => {
		const longDescription =
			'This is a very long product description that should be truncated to show only the first two lines and then cut off with ellipsis to maintain the card layout consistency across all product cards in the grid view';
		fixture.componentRef.setInput('product', {
			...mockProduct,
			description: longDescription,
		});
		fixture.detectChanges();

		const descriptionElement = fixture.debugElement.query(By.css('p'));
		expect(descriptionElement.nativeElement.classList).toContain(
			'line-clamp-2',
		);
	});

	it('should truncate long product names', () => {
		const longName =
			'This is a very long product name that should be truncated';
		fixture.componentRef.setInput('product', {
			...mockProduct,
			name: longName,
		});
		fixture.detectChanges();

		const nameElement = fixture.debugElement.query(By.css('h3'));
		expect(nameElement.nativeElement.classList).toContain('line-clamp-1');
	});

	it('should call deleteProduct and reload products when delete button is clicked', () => {
		const deleteButton = fixture.debugElement.query(By.css('button'));
		deleteButton.triggerEventHandler('click', null);
		fixture.detectChanges();

		expect(productService.deleteProduct).toHaveBeenCalledWith(mockProduct.id);
		expect(productsResource.reload).toHaveBeenCalled();
		expect(toastrService.success).toHaveBeenCalledWith(
			'Product deleted successfully',
			'Success',
		);
	});
});
