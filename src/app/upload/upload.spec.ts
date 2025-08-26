import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';

import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let httpMock: HttpTestingController;

  const mockUploadResponse = {
    message: 'File uploaded successfully',
    key: 'test-file-key-123',
    url: 'https://example.com/uploaded-file.jpg'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UploadService]
    });
    service = TestBed.inject(UploadService);
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

  describe('uploadFile', () => {
    it('should upload a file successfully', () => {
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');

      service.uploadFile(mockFormData).subscribe(response => {
        expect(response).toEqual(mockUploadResponse);
        expect(response.message).toBe('File uploaded successfully');
        expect(response.key).toBe('test-file-key-123');
        expect(response.url).toBe('https://example.com/uploaded-file.jpg');
      });

      const req = httpMock.expectOne(`${environment.baseurl}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(mockFormData);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockUploadResponse);
    });

    it('should handle upload error', () => {
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');

      service.uploadFile(mockFormData).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.statusText).toBe('Bad Request');
        }
      });

      const req = httpMock.expectOne(`${environment.baseurl}/upload`);
      req.flush({ error: 'Invalid file format' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle server error during upload', () => {
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');

      service.uploadFile(mockFormData).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
        }
      });

      const req = httpMock.expectOne(`${environment.baseurl}/upload`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle file size limit error', () => {
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'large-file.txt');

      service.uploadFile(mockFormData).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(413);
          expect(error.statusText).toBe('Payload Too Large');
        }
      });

      const req = httpMock.expectOne(`${environment.baseurl}/upload`);
      req.flush({ error: 'File too large' }, { status: 413, statusText: 'Payload Too Large' });
    });

    it('should handle unsupported file type error', () => {
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['test content'], { type: 'application/exe' }), 'virus.exe');

      service.uploadFile(mockFormData).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(415);
          expect(error.statusText).toBe('Unsupported Media Type');
        }
      });

      const req = httpMock.expectOne(`${environment.baseurl}/upload`);
      req.flush({ error: 'Unsupported file type' }, { status: 415, statusText: 'Unsupported Media Type' });
    });
  });
});
