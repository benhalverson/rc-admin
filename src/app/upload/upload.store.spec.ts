import { TestBed } from '@angular/core/testing';
import { UploadStore } from './upload.store';

describe('UploadStore', () => {
  let store: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(UploadStore);
  });

  describe('Store Initialization', () => {
    it('should be created', () => {
      expect(store).toBeTruthy();
    });

    it('should have initial state', () => {
      expect(store.selectedFile()).toBeNull();
      expect(store.message()).toBe('');
    });
  });

  describe('setFile method', () => {
    it('should set valid STL file', () => {
      const mockFile = new File(['test content'], 'test.stl', { type: 'application/octet-stream' });

      store.setFile(mockFile);

      expect(store.selectedFile()).toBe(mockFile);
      expect(store.message()).toBe('');
    });

    it('should set valid STL file with uppercase extension', () => {
      const mockFile = new File(['test content'], 'test.STL', { type: 'application/octet-stream' });

      store.setFile(mockFile);

      expect(store.selectedFile()).toBe(mockFile);
      expect(store.message()).toBe('');
    });

    it('should reject non-STL file', () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      store.setFile(mockFile);

      expect(store.selectedFile()).toBeNull();
      expect(store.message()).toBe('Please select a valid STL file.');
    });

    it('should handle null file', () => {
      store.setFile(null);

      expect(store.selectedFile()).toBeNull();
      expect(store.message()).toBe('Please select a valid STL file.');
    });

    it('should clear previous message when setting valid file', () => {
      // First set invalid file to create a message
      const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      store.setFile(invalidFile);
      expect(store.message()).toBe('Please select a valid STL file.');

      // Then set valid file
      const validFile = new File(['test content'], 'test.stl', { type: 'application/octet-stream' });
      store.setFile(validFile);

      expect(store.selectedFile()).toBe(validFile);
      expect(store.message()).toBe('');
    });
  });

  describe('setMessage method', () => {
    it('should set message', () => {
      const testMessage = 'Test message';

      store.setMessage(testMessage);

      expect(store.message()).toBe(testMessage);
    });

    it('should update existing message', () => {
      store.setMessage('First message');
      expect(store.message()).toBe('First message');

      store.setMessage('Second message');
      expect(store.message()).toBe('Second message');
    });
  });

  describe('reset method', () => {
    it('should reset store to initial state', () => {
      // Set some state
      const mockFile = new File(['test content'], 'test.stl', { type: 'application/octet-stream' });
      store.setFile(mockFile);
      store.setMessage('Some message');

      expect(store.selectedFile()).toBe(mockFile);
      expect(store.message()).toBe('Some message');

      // Reset
      store.reset();

      expect(store.selectedFile()).toBeNull();
      expect(store.message()).toBe('');
    });
  });

  describe('isFileSelected method', () => {
    it('should return false when no file is selected', () => {
      expect(store.isFileSelected()).toBe(false);
    });

    it('should return true when file is selected', () => {
      const mockFile = new File(['test content'], 'test.stl', { type: 'application/octet-stream' });
      store.setFile(mockFile);

      expect(store.isFileSelected()).toBe(true);
    });

    it('should return false after reset', () => {
      const mockFile = new File(['test content'], 'test.stl', { type: 'application/octet-stream' });
      store.setFile(mockFile);
      expect(store.isFileSelected()).toBe(true);

      store.reset();
      expect(store.isFileSelected()).toBe(false);
    });

    it('should return false when invalid file is set', () => {
      const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      store.setFile(invalidFile);

      expect(store.isFileSelected()).toBe(false);
    });
  });

  describe('File validation logic', () => {
    it('should accept files with .stl extension regardless of case', () => {
      const testCases = [
        'file.stl',
        'file.STL',
        'file.Stl',
        'file.sTl'
      ];

      testCases.forEach(fileName => {
        const mockFile = new File(['test content'], fileName, { type: 'application/octet-stream' });
        store.setFile(mockFile);

        expect(store.selectedFile()).toBe(mockFile);
        expect(store.message()).toBe('');

        store.reset(); // Reset for next test
      });
    });

    it('should reject files without .stl extension', () => {
      const testCases = [
        'file.obj',
        'file.txt',
        'file.jpg',
        'file.pdf',
        'filestl', // No dot
        'file.stl.txt' // Wrong extension at end
      ];

      testCases.forEach(fileName => {
        const mockFile = new File(['test content'], fileName, { type: 'application/octet-stream' });
        store.setFile(mockFile);

        expect(store.selectedFile()).toBeNull();
        expect(store.message()).toBe('Please select a valid STL file.');

        store.reset(); // Reset for next test
      });
    });
  });
});
