import {
	HttpClientTestingModule,
	HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../environments/environment';
import {
	FilamentType,
	type ProductCreateRequest,
	type ProductResponse,
	ProductService,
} from './product.service';
import type { FilamentColorsResponse } from './types/filament';
import { Profile, Provider } from './types/filament';

describe('ProductService', () => {
	let service: ProductService;
	let httpMock: HttpTestingController;

	const mockProduct: ProductCreateRequest = {
		name: 'Test Product',
		description: 'Test Description',
		image: 'test-image.jpg',
		publicFileServiceId: 'file_123',
		price: 29.99,
		filamentType: FilamentType.PLA,
		color: 'red',
		imageGallery: ['image1.jpg', 'image2.jpg'],
	};

	const mockSingleProductResponse: ProductResponse = {
		...mockProduct,
		id: 1,
		stl: 'https://slant3d.com/files/fresh-test-file.stl',
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
			service.getColors(FilamentType.PLA).subscribe((response) => {
				expect(Array.isArray(response)).toBe(true);
				expect(response.length).toBe(2);
				expect(response[0].hexValue).toBe('f91010');
			});

			const req = httpMock.expectOne(
				`${environment.baseurl}/v2/colors?filamentType=PLA`,
			);
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('filamentType')).toBe('PLA');
			req.flush({ data: mockFilamentColorsArray });
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

			service.getColors(FilamentType.PETG).subscribe((response) => {
				expect(response.length).toBe(1);
				expect(response[0].profile).toBe('PETG');
			});

			const req = httpMock.expectOne(
				`${environment.baseurl}/v2/colors?filamentType=PETG`,
			);
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('filamentType')).toBe('PETG');
			req.flush({ data: petgColorsArray });
		});

		it('should handle getColors error', () => {
			service.getColors(FilamentType.PLA).subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(404);
					expect(error.statusText).toBe('Not Found');
				},
			});

			const req = httpMock.expectOne(
				`${environment.baseurl}/v2/colors?filamentType=PLA`,
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
			const updatedProduct: ProductResponse = {
				...mockSingleProductResponse,
				name: 'Updated Product Name',
				price: 39.99,
			};

			service.updateProduct(updatedProduct).subscribe((response) => {
				expect(response).toBeNull(); // Void response returns null
			});

			const req = httpMock.expectOne(`${environment.baseurl}/update-product`);
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toEqual({
				id: updatedProduct.id,
				name: updatedProduct.name,
				description: updatedProduct.description,
				price: updatedProduct.price,
				filamentType: updatedProduct.filamentType,
				color: updatedProduct.color,
				image: updatedProduct.image,
				imageGallery: updatedProduct.imageGallery,
			});
			req.flush(null);
		});

		it('should handle updateProduct error', () => {
			service.updateProduct(mockSingleProductResponse).subscribe({
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
			const reloadSpy = vi
				.spyOn(service, 'reloadProductResources')
				.mockImplementation(() => undefined);

			service.createProduct(mockProduct).subscribe((response) => {
				expect(response).toEqual(mockSingleProductResponse);
				expect(response.id).toBe(1);
			});

			const req = httpMock.expectOne(`${environment.baseurl}/v2/add-product`);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual(mockProduct);
			req.flush({
				success: true,
				message: 'created',
				product: mockSingleProductResponse,
			});
			expect(reloadSpy).toHaveBeenCalledTimes(1);
		});

		it('should strip deprecated STL URLs from create payloads', () => {
			const reloadSpy = vi
				.spyOn(service, 'reloadProductResources')
				.mockImplementation(() => undefined);
			const productWithDeprecatedStl: ProductCreateRequest = {
				...mockProduct,
				stl: 'https://slant3d.com/files/expiring-url.stl',
			};

			service.createProduct(productWithDeprecatedStl).subscribe();

			const req = httpMock.expectOne(`${environment.baseurl}/v2/add-product`);
			expect(req.request.body).toEqual(mockProduct);
			req.flush({
				success: true,
				message: 'created',
				product: mockSingleProductResponse,
			});
			expect(reloadSpy).toHaveBeenCalledTimes(1);
		});

		it('should handle createProduct error', () => {
			const reloadSpy = vi
				.spyOn(service, 'reloadProductResources')
				.mockImplementation(() => undefined);

			service.createProduct(mockProduct).subscribe({
				next: () => expect.unreachable('Expected an error'),
				error: (error) => {
					expect(error.status).toBe(400);
					expect(error.statusText).toBe('Bad Request');
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/v2/add-product`);
			req.flush(
				{ error: 'Product creation failed' },
				{ status: 400, statusText: 'Bad Request' },
			);
			expect(reloadSpy).not.toHaveBeenCalled();
		});

		it('should create product with minimal required fields', () => {
			const reloadSpy = vi
				.spyOn(service, 'reloadProductResources')
				.mockImplementation(() => undefined);

			const minimalProduct: ProductCreateRequest = {
				name: 'Minimal Product',
				description: 'Basic description',
				image: '',
				publicFileServiceId: 'file_minimal',
				price: 10.0,
				filamentType: FilamentType.PLA,
				color: 'white',
			};

			const expectedResponse: ProductResponse = {
				...minimalProduct,
				id: 2,
				stl: 'https://slant3d.com/files/minimal.stl',
			};

			service.createProduct(minimalProduct).subscribe((response) => {
				expect(response).toEqual(expectedResponse);
				expect(response.imageGallery).toBeUndefined();
			});

			const req = httpMock.expectOne(`${environment.baseurl}/v2/add-product`);
			expect(req.request.body).toEqual(minimalProduct);
			req.flush({
				success: true,
				message: 'created',
				product: expectedResponse,
			});
			expect(reloadSpy).toHaveBeenCalledTimes(1);
		});
	});
});
