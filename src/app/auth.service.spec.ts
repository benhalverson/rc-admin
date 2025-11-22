import {
	HttpClientTestingModule,
	HttpTestingController,
} from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../environments/environment';
import { AuthService, AuthStore, type MyFormData } from './auth.service';

describe('AuthService', () => {
	let service: AuthService;
	let authStore: InstanceType<typeof AuthStore>;
	let httpMock: HttpTestingController;
	let mockSessionStorage: any;

	// Mock sessionStorage
	const mockStorage = {
		store: {} as any,
		getItem: jasmine
			.createSpy('getItem')
			.and.callFake((key: string) => mockStorage.store[key] || null),
		setItem: jasmine
			.createSpy('setItem')
			.and.callFake((key: string, value: string) => {
				mockStorage.store[key] = value;
			}),
		removeItem: jasmine
			.createSpy('removeItem')
			.and.callFake((key: string) => delete mockStorage.store[key]),
		clear: jasmine.createSpy('clear').and.callFake(() => {
			mockStorage.store = {};
		}),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [AuthService, { provide: PLATFORM_ID, useValue: 'browser' }],
		});

		service = TestBed.inject(AuthService);
		authStore = TestBed.inject(AuthStore);
		httpMock = TestBed.inject(HttpTestingController);

		// Mock sessionStorage
		mockSessionStorage = mockStorage;
		Object.defineProperty(window, 'sessionStorage', {
			value: mockSessionStorage,
		});

		// Clear storage before each test
		mockSessionStorage.clear();
	});

	afterEach(() => {
		httpMock.verify();
		mockSessionStorage.clear();
	});

	describe('Service Initialization', () => {
		it('should be created', () => {
			// Handle the initial auth check that happens in constructor
			const req = httpMock.expectOne(`${environment.baseurl}/profile`);
			req.flush(
				{ error: 'Unauthorized' },
				{ status: 401, statusText: 'Unauthorized' },
			);

			expect(service).toBeTruthy();
		});

		it('should check auth status on browser platform initialization', () => {
			// The constructor automatically calls checkAuthStatus for browser platform
			const req = httpMock.expectOne(`${environment.baseurl}/profile`);
			expect(req.request.method).toBe('GET');

			// Simulate successful auth check
			req.flush({ id: 1, email: 'test@test.com' });

			expect(authStore.isAuthenticated()).toBe(true);
			expect(authStore.isInitialized()).toBe(true);
		});

		it('should handle auth check failure on initialization', () => {
			// The constructor automatically calls checkAuthStatus
			const req = httpMock.expectOne(`${environment.baseurl}/profile`);

			// Simulate auth check failure
			req.flush(
				{ error: 'Unauthorized' },
				{ status: 401, statusText: 'Unauthorized' },
			);

			expect(authStore.isAuthenticated()).toBe(false);
			expect(authStore.isInitialized()).toBe(true);
		});
	});

	describe('signin', () => {
		it('should successfully sign in user and fetch profile', (done) => {
			const formData: MyFormData = {
				email: 'test@test.com',
				password: 'password',
			};
			const mockUser = { id: 1, email: 'test@test.com', name: 'Test User' };

			// Skip the initial auth check
			const initialReq = httpMock.expectOne(`${environment.baseurl}/profile`);
			initialReq.flush(
				{ error: 'Unauthorized' },
				{ status: 401, statusText: 'Unauthorized' },
			);

			service.signin(formData).subscribe({
				next: (_response) => {
					expect(authStore.isAuthenticated()).toBe(true);
					expect(authStore.user()).toEqual(mockUser);
					expect(authStore.loading()).toBe(false);
					expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
						'isAuthenticated',
						'true',
					);
					expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
						'user',
						JSON.stringify(mockUser),
					);
					done();
				},
			});

			// Handle signin request
			const signinReq = httpMock.expectOne(
				`${environment.baseurl}/auth/signin`,
			);
			expect(signinReq.request.method).toBe('POST');
			expect(signinReq.request.body).toEqual({
				email: formData.email,
				password: formData.password,
			});
			signinReq.flush({ success: true });

			// Handle profile fetch request
			const profileReq = httpMock.expectOne(`${environment.baseurl}/profile`);
			expect(profileReq.request.method).toBe('GET');
			profileReq.flush(mockUser);
		});

		it('should handle signin failure', (done) => {
			const formData: MyFormData = {
				email: 'test@test.com',
				password: 'wrongpassword',
			};

			// Skip the initial auth check
			const initialReq = httpMock.expectOne(`${environment.baseurl}/profile`);
			initialReq.flush(
				{ error: 'Unauthorized' },
				{ status: 401, statusText: 'Unauthorized' },
			);

			service.signin(formData).subscribe({
				next: () => {},
				error: () => {
					expect(authStore.isAuthenticated()).toBe(false);
					expect(authStore.loading()).toBe(false);
					expect(authStore.error()).toBeTruthy();
					expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
						'isAuthenticated',
					);
					expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('user');
					done();
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/auth/signin`);
			req.flush(
				{ error: 'Invalid credentials' },
				{ status: 401, statusText: 'Unauthorized' },
			);
		});

		it('should handle profile fetch failure after successful signin', (done) => {
			const formData: MyFormData = {
				email: 'test@test.com',
				password: 'password',
			};
			const expectedBasicUser = { email: formData.email };

			// Skip the initial auth check
			const initialReq = httpMock.expectOne(`${environment.baseurl}/profile`);
			initialReq.flush(
				{ error: 'Unauthorized' },
				{ status: 401, statusText: 'Unauthorized' },
			);

			service.signin(formData).subscribe({
				next: () => {
					expect(authStore.isAuthenticated()).toBe(true);
					expect(authStore.user()).toEqual(expectedBasicUser);
					expect(authStore.loading()).toBe(false);
					expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
						'isAuthenticated',
						'true',
					);
					expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
						'user',
						JSON.stringify(expectedBasicUser),
					);
					done();
				},
			});

			// Handle signin request
			const signinReq = httpMock.expectOne(
				`${environment.baseurl}/auth/signin`,
			);
			signinReq.flush({ success: true });

			// Handle profile fetch failure
			const profileReq = httpMock.expectOne(`${environment.baseurl}/profile`);
			profileReq.flush(
				{ error: 'Profile not found' },
				{ status: 404, statusText: 'Not Found' },
			);
		});
	});

	describe('logout', () => {
		beforeEach(() => {
			// Skip initial auth check
			const req = httpMock.expectOne(`${environment.baseurl}/profile`);
			req.flush(
				{ error: 'Unauthorized' },
				{ status: 401, statusText: 'Unauthorized' },
			);
		});

		it('should successfully logout user', (done) => {
			// First set user as authenticated
			authStore.setAuthenticated(true, { id: 1, email: 'test@test.com' });

			service.logout().subscribe({
				next: () => {
					expect(authStore.isAuthenticated()).toBe(false);
					expect(authStore.user()).toBe(null);
					expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
						'isAuthenticated',
					);
					expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('user');
					done();
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/auth/signout`);
			expect(req.request.method).toBe('GET');
			req.flush({ success: true });
		});

		it('should clear local state even if server logout fails', (done) => {
			// First set user as authenticated
			authStore.setAuthenticated(true, { id: 1, email: 'test@test.com' });

			service.logout().subscribe({
				next: () => {
					expect(authStore.isAuthenticated()).toBe(false);
					expect(authStore.user()).toBe(null);
					expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
						'isAuthenticated',
					);
					expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('user');
					done();
				},
			});

			const req = httpMock.expectOne(`${environment.baseurl}/auth/signout`);
			req.flush(
				{ error: 'Server error' },
				{ status: 500, statusText: 'Internal Server Error' },
			);
		});
	});

	describe('isAuthenticated', () => {
		beforeEach(() => {
			// Skip initial auth check
			const req = httpMock.expectOne(`${environment.baseurl}/profile`);
			req.flush(
				{ error: 'Unauthorized' },
				{ status: 401, statusText: 'Unauthorized' },
			);
		});

		it('should return authentication status', () => {
			expect(service.isAuthenticated()).toBe(false);

			authStore.setAuthenticated(true, { id: 1, email: 'test@test.com' });
			expect(service.isAuthenticated()).toBe(true);
		});
	});

	describe('getAuthStore', () => {
		it('should return the auth store instance', () => {
			// Handle the initial auth check that happens in constructor
			const req = httpMock.expectOne(`${environment.baseurl}/profile`);
			req.flush(
				{ error: 'Unauthorized' },
				{ status: 401, statusText: 'Unauthorized' },
			);

			expect(service.getAuthStore()).toBe(authStore);
		});
	});
});

describe('AuthService SSR', () => {
	it('should not check auth status on server platform', () => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [AuthService, { provide: PLATFORM_ID, useValue: 'server' }],
		});

		const _serverService = TestBed.inject(AuthService);
		const serverAuthStore = TestBed.inject(AuthStore);
		const serverHttpMock = TestBed.inject(HttpTestingController);

		// No HTTP requests should be made on server
		serverHttpMock.expectNone(`${environment.baseurl}/profile`);
		expect(serverAuthStore.isInitialized()).toBe(true);

		serverHttpMock.verify();
	});
});

describe('AuthStore', () => {
	let store: InstanceType<typeof AuthStore>;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		store = TestBed.inject(AuthStore);
	});

	it('should have initial state', () => {
		expect(store.isAuthenticated()).toBe(false);
		expect(store.user()).toBe(null);
		expect(store.loading()).toBe(false);
		expect(store.error()).toBe(null);
		expect(store.isInitialized()).toBe(false);
	});

	it('should set authenticated state', () => {
		const user = { id: 1, email: 'test@test.com' };
		store.setAuthenticated(true, user);

		expect(store.isAuthenticated()).toBe(true);
		expect(store.user()).toEqual(user);
		expect(store.isInitialized()).toBe(true);
	});

	it('should set loading state', () => {
		store.setLoading(true);
		expect(store.loading()).toBe(true);

		store.setLoading(false);
		expect(store.loading()).toBe(false);
	});

	it('should set error state', () => {
		const error = 'Test error';
		store.setError(error);
		expect(store.error()).toBe(error);

		store.setError(null);
		expect(store.error()).toBe(null);
	});

	it('should set initialized state', () => {
		store.setInitialized(true);
		expect(store.isInitialized()).toBe(true);

		store.setInitialized(false);
		expect(store.isInitialized()).toBe(false);
	});

	it('should logout and reset state', () => {
		// First set some state
		store.setAuthenticated(true, { id: 1, email: 'test@test.com' });
		store.setError('Some error');

		// Then logout
		store.logout();

		expect(store.isAuthenticated()).toBe(false);
		expect(store.user()).toBe(null);
		expect(store.error()).toBe(null);
	});
});
