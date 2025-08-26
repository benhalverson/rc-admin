import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService, Product, ProductResponse } from './product.service';
import { environment } from '../environments/environment';
import { FilamentColorsResponse, Filament } from './types/filament';

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

  const mockFilamentColorsArray: Filament[] = [
    { filament: 'PLA RED', hexColor: '#f91010', colorTag: 'red' },
    { filament: 'PLA BLUE', hexColor: '#0db9f2', colorTag: 'blue' }
  ];

  const mockFilamentColors: FilamentColorsResponse = {
    filaments: mockFilamentColorsArray
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
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
      service.getProducts().subscribe(response => {
        expect(response).toEqual(mockProductResponse);
      });

      const req = httpMock.expectOne(`${environment.baseurl}/products`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProductResponse);
    });

    it('should handle getProducts error', () => {
      service.getProducts().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
        }
      });

      const req = httpMock.expectOne(`${environment.baseurl}/products`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
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
      const petgColorsArray: Filament[] = [
        { filament: 'PETG CLEAR', hexColor: '#ffffff', colorTag: 'clear' }
      ];

      const petgColors: FilamentColorsResponse = {
        filaments: petgColorsArray
      };

      service.getColors('PETG').subscribe(response => {
        expect(response).toEqual(petgColors);
        expect(response.filaments[0].filament).toBe('PETG CLEAR');
      });

      const req = httpMock.expectOne(`${environment.baseurl}/colors?filamentType=PETG`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('filamentType')).toBe('PETG');
      req.flush(petgColorsArray);
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
});
