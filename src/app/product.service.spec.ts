import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductService, Product, ProductResponse } from './product.service';
import { environment } from '../environments/environment';
import type { FilamentResponse, FilamentColorsResponse } from './types/filament';
import { provideHttpClient } from '@angular/common/http';

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
    imageGallery: ['image1.jpg', 'image2.jpg']
  };

  const mockSingleProductResponse: ProductResponse = {
    ...mockProduct,
    id: 1
  };

  const mockProductResponse: ProductResponse[] = [mockSingleProductResponse];

  // Backend-shaped response (what the API returns)
  const mockFilamentColorsArray: FilamentResponse[] = [
    { name: 'PLA RED', provider: 'Provider A', public: true, available: true, color: 'red', profile: 'PLA RED', hexValue: '#f91010', publicId: '1' },
    { name: 'PLA BLUE', provider: 'Provider A', public: true, available: true, color: 'blue', profile: 'PLA BLUE', hexValue: '#0db9f2', publicId: '2' }
  ];

  // Expected client-facing shape after mapping
  const mockFilamentColors: FilamentColorsResponse = {
    filaments: [
      { filament: 'PLA RED', hexColor: '#f91010', colorTag: 'red' },
      { filament: 'PLA BLUE', hexColor: '#0db9f2', colorTag: 'blue' }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService,
        // provideHttpClient(),
        // provideHttpClientTesting()
      ]
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

  describe('getColors', () => {
    it('should retrieve PLA colors from API', () => {
      service.getColors('PLA').subscribe(response => {
        expect(response).toEqual(mockFilamentColors);
        expect(response.filaments.length).toBe(2);
        expect(response.filaments[0].filament).toBe('PLA RED');
      });

      const req = httpMock.expectOne(`${environment.baseurl}/colors?filamentType=PLA`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('filamentType')).toBe('PLA');
      req.flush(mockFilamentColorsArray);
    });

    it('should retrieve PETG colors from API', () => {
      const petgBackendArray: FilamentResponse[] = [
        { name: 'PETG CLEAR', provider: 'Provider B', public: true, available: true, color: 'clear', profile: 'PETG CLEAR', hexValue: '#ffffff', publicId: '3' }
      ];

      const petgColors: FilamentColorsResponse = {
        filaments: [ { filament: 'PETG CLEAR', hexColor: '#ffffff', colorTag: 'clear' } ]
      };

      service.getColors('PETG').subscribe(response => {
        expect(response).toEqual(petgColors);
        expect(response.filaments[0].filament).toBe('PETG CLEAR');
      });

      const req = httpMock.expectOne(`${environment.baseurl}/colors?filamentType=PETG`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('filamentType')).toBe('PETG');
      req.flush(petgBackendArray);
    });

    it('should handle getColors error', () => {
      service.getColors('PLA').subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne(`${environment.baseurl}/colors?filamentType=PLA`);
      req.flush({ error: 'Colors not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getProductById', () => {
    it('should retrieve a specific product by ID', () => {
      const productId = 1;

      service.getProductById(productId).subscribe(response => {
        expect(response).toEqual(mockSingleProductResponse);
        expect(response.id).toBe(productId);
      });

      const req = httpMock.expectOne(`${environment.baseurl}/product/${productId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSingleProductResponse);
    });

    it('should handle getProductById error for non-existent product', () => {
      const productId = 999;

      service.getProductById(productId).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne(`${environment.baseurl}/product/${productId}`);
      req.flush({ error: 'Product not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', () => {
      const updatedProduct: Product = {
        ...mockProduct,
        name: 'Updated Product Name',
        price: 39.99
      };

      service.updateProduct(updatedProduct).subscribe(response => {
        expect(response).toBeNull(); // Void response returns null
      });

      const req = httpMock.expectOne(`${environment.baseurl}/update-product`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedProduct);
      req.flush(null);
    });

    it('should handle updateProduct error', () => {
      service.updateProduct(mockProduct).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.statusText).toBe('Bad Request');
        }
      });

      const req = httpMock.expectOne(`${environment.baseurl}/update-product`);
      req.flush({ error: 'Invalid product data' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('createProduct', () => {
    it('should create a new product', () => {
      service.createProduct(mockProduct).subscribe(response => {
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
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.statusText).toBe('Bad Request');
        }
      });

      const req = httpMock.expectOne(`${environment.baseurl}/add-product`);
      req.flush({ error: 'Product creation failed' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should create product with minimal required fields', () => {
      const minimalProduct: Product = {
        name: 'Minimal Product',
        description: 'Basic description',
        image: '',
        stl: 'minimal.stl',
        price: 10.00,
        filamentType: 'PLA',
        color: 'white'
      };

      const expectedResponse: ProductResponse = {
        ...minimalProduct,
        id: 2
      };

      service.createProduct(minimalProduct).subscribe(response => {
        expect(response).toEqual(expectedResponse);
        expect(response.imageGallery).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.baseurl}/add-product`);
      expect(req.request.body).toEqual(minimalProduct);
      req.flush(expectedResponse);
    });
  });

  describe('deleteProduct', () => {

    it('should delete an existing product', () => {
    const productId = 1;
    service.deleteProduct(mockSingleProductResponse).subscribe(response => {
      const res = response as unknown as { message: string; };
      expect(res.message).toBe('Product deleted successfully');
    });

    const req = httpMock.expectOne(`${environment.baseurl}/delete-product/${productId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Product deleted successfully' });
    });
  });
  });
