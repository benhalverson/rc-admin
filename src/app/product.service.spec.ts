import {
	HttpClientTestingModule,
	HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../environments/environment';
import {
	type Product,
	type ProductResponse,
	ProductService,
} from './product.service';
import type { FilamentColorsResponse } from './types/filament';
import { Profile, Provider } from './types/filament';

describe('ProductService', () => {
	let service: ProductService;
	let httpMock: HttpTestingController;

	const mockProduct: Product = {
		name: 'Test Product',
		description: 'Test Description',
		image: 'test-image.jpg',
		stl: 'test-file.stl',
		price: 29.99,
		filamentType: 'PLA',
		color: 'red',
		imageGallery: ['image1.jpg', 'image2.jpg'],
	};

	const mockSingleProductResponse: ProductResponse = {
		...mockProduct,
		id: 1,
	};

	const mockProductResponse: ProductResponse[] = [mockSingleProductResponse];

	const mockFilamentColorsArray: FilamentColorsResponse[] = [
		{
			name: 'Red PLA',
			provider: Provider.Polymaker,
			public: true,
			available: true,
			color: 'PLA',
			profile: Profile.Pla,
			hexValue: 'f91010',
			publicId: 'red-pla',
		},
		{
			name: 'Blue PLA',
			provider: Provider.Polymaker,
			public: true,
			available: true,
			color: 'PLA',
			profile: Profile.Pla,
			hexValue: '0db9f2',
			publicId: 'blue-pla',
		},
	];

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [ProductService],
		});
		service = TestBed.inject(ProductService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe('Service Initialization', () => {
		it('should be created', () => {
			expect(service).toBeTruthy();
		});

		it('should have correct baseUrl', () => {
			expect(service.baseUrl).toBe(environment.baseurl);
		});
	});

	describe('getProducts', () => {
		it('should retrieve products from API', () => {
			service.getProducts().subscribe((response) => {
				expect(response).toEqual(mockProductResponse);
			});

			const req = httpMock.expectOne(`${environment.baseurl}/products`);
			expect(req.request.method).toBe('GET');
			req.flush(mockProductResponse);
		});

		it('should handle getProducts error', () => {
			service.getProducts().subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(500);
					expect(error.statusText).toBe('Internal Server Error');
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/products`);
			req.flush(
				{ error: 'Server error' },
				{ status: 500, statusText: 'Internal Server Error' },
			);
		});
	});

	describe('getColors', () => {
		it('should retrieve PLA colors from API', () => {
			service.getColors('PLA').subscribe((response) => {
				expect(Array.isArray(response)).toBe(true);
				expect(response.length).toBe(2);
				expect(response[0].hexValue).toBe('f91010');
			});

			const req = httpMock.expectOne(
				`${environment.baseurl}/colors?filamentType=PLA`,
			);
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('filamentType')).toBe('PLA');
			req.flush(mockFilamentColorsArray);
		});

		it('should retrieve PETG colors from API', () => {
			const petgColorsArray: FilamentColorsResponse[] = [
				{
					name: 'Clear PETG',
					provider: Provider.Polymaker,
					public: true,
					available: true,
					color: 'PETG',
					profile: Profile.Petg,
					hexValue: 'ffffff',
					publicId: 'clear-petg',
				},
			];

			service.getColors('PETG').subscribe((response) => {
				expect(response.length).toBe(1);
				expect(response[0].profile).toBe('PETG');
			});

			const req = httpMock.expectOne(
				`${environment.baseurl}/colors?filamentType=PETG`,
			);
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('filamentType')).toBe('PETG');
			req.flush(petgColorsArray);
		});

		it('should handle getColors error', () => {
			service.getColors('PLA').subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(404);
					expect(error.statusText).toBe('Not Found');
				},
			});

			const req = httpMock.expectOne(
				`${environment.baseurl}/colors?filamentType=PLA`,
			);
			req.flush(
				{ error: 'Colors not found' },
				{ status: 404, statusText: 'Not Found' },
			);
		});
	});

	describe('getProductById', () => {
		it('should retrieve a specific product by ID', () => {
			const productId = 1;

			service.getProductById(productId).subscribe((response) => {
				expect(response).toEqual(mockSingleProductResponse);
				expect(response.id).toBe(productId);
			});

			const req = httpMock.expectOne(
				`${environment.baseurl}/product/${productId}`,
			);
			expect(req.request.method).toBe('GET');
			req.flush(mockSingleProductResponse);
		});

		it('should handle getProductById error for non-existent product', () => {
			const productId = 999;

			service.getProductById(productId).subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(404);
					expect(error.statusText).toBe('Not Found');
				},
			});

			const req = httpMock.expectOne(
				`${environment.baseurl}/product/${productId}`,
			);
			req.flush(
				{ error: 'Product not found' },
				{ status: 404, statusText: 'Not Found' },
			);
		});
	});

	describe('updateProduct', () => {
		it('should update an existing product', () => {
			const updatedProduct: Product = {
				...mockProduct,
				name: 'Updated Product Name',
				price: 39.99,
			};

			service.updateProduct(updatedProduct).subscribe((response) => {
				expect(response).toBeNull(); // Void response returns null
			});

			const req = httpMock.expectOne(`${environment.baseurl}/update-product`);
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toEqual(updatedProduct);
			req.flush(null);
		});

		it('should handle updateProduct error', () => {
			service.updateProduct(mockProduct).subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(400);
					expect(error.statusText).toBe('Bad Request');
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/update-product`);
			req.flush(
				{ error: 'Invalid product data' },
				{ status: 400, statusText: 'Bad Request' },
			);
		});
	});

	describe('deleteProduct', () => {
		it('should delete an existing product', () => {
			const productId = 1;
			const deleteResponse = {
				success: true,
				message: 'Product deleted successfully',
			};

			service.deleteProduct(productId).subscribe((response) => {
				expect(response).toEqual(deleteResponse);
			});

			const req = httpMock.expectOne(
				`${environment.baseurl}/delete-product/${productId}`,
			);
			expect(req.request.method).toBe('DELETE');
			expect(req.request.body).toBeNull();
			req.flush(deleteResponse);
		});
	});

	describe('createProduct', () => {
		it('should create a new product', () => {
			service.createProduct(mockProduct).subscribe((response) => {
				expect(response).toEqual(mockSingleProductResponse);
				expect(response.id).toBe(1);
			});

			const req = httpMock.expectOne(`${environment.baseurl}/add-product`);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual(mockProduct);
			req.flush(mockSingleProductResponse);
		});

		it('should handle createProduct error', () => {
			service.createProduct(mockProduct).subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(400);
					expect(error.statusText).toBe('Bad Request');
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/add-product`);
			req.flush(
				{ error: 'Product creation failed' },
				{ status: 400, statusText: 'Bad Request' },
			);
		});

		it('should create product with minimal required fields', () => {
			const minimalProduct: Product = {
				name: 'Minimal Product',
				description: 'Basic description',
				image: '',
				stl: 'minimal.stl',
				price: 10.0,
				filamentType: 'PLA',
				color: 'white',
			};

			const expectedResponse: ProductResponse = {
				...minimalProduct,
				id: 2,
			};

			service.createProduct(minimalProduct).subscribe((response) => {
				expect(response).toEqual(expectedResponse);
				expect(response.imageGallery).toBeUndefined();
			});

			const req = httpMock.expectOne(`${environment.baseurl}/add-product`);
			expect(req.request.body).toEqual(minimalProduct);
			req.flush(expectedResponse);
		});
	});
});
