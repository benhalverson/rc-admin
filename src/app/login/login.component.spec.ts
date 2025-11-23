import { HttpClientTestingModule } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideToastr, ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
	let component: LoginComponent;
	let fixture: ComponentFixture<LoginComponent>;
	let authService: {
		signin: ReturnType<typeof vi.fn>;
	};
	let toastrService: {
		success: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
	};
	let router: {
		navigateByUrl: ReturnType<typeof vi.fn>;
	};

	beforeEach(async () => {
		const authServiceSpy = {
			signin: vi.fn(),
		};
		const toastrServiceSpy = {
			success: vi.fn(),
			error: vi.fn(),
		};
		const routerSpy = {
			navigateByUrl: vi.fn(),
		};

		const activatedRouteMock = {
			snapshot: {
				queryParams: {},
			},
		};

		await TestBed.configureTestingModule({
			imports: [
				LoginComponent,
				HttpClientTestingModule,
				RouterTestingModule,
				ReactiveFormsModule,
			],
			providers: [
				provideAnimations(),
				provideToastr({
					timeOut: 3000,
					positionClass: 'toast-top-right',
					preventDuplicates: true,
				}),
				{ provide: AuthService, useValue: authServiceSpy },
				{ provide: ToastrService, useValue: toastrServiceSpy },
				{ provide: Router, useValue: routerSpy },
				{ provide: ActivatedRoute, useValue: activatedRouteMock },
			],
		}).compileComponents();

		authService = TestBed.inject(AuthService) as unknown as typeof authService;
		toastrService = TestBed.inject(
			ToastrService,
		) as unknown as typeof toastrService;
		router = TestBed.inject(Router) as unknown as typeof router;

		fixture = TestBed.createComponent(LoginComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should initialize form with empty values', () => {
		expect(component.loginForm.value).toEqual({
			email: '',
			password: '',
		});
	});

	/**
	 * Helper function to configure TestBed with custom ActivatedRoute query params
	 */
	function configureTestBedWithActivatedRoute(
		queryParams: Record<string, string>,
	) {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			imports: [
				LoginComponent,
				HttpClientTestingModule,
				RouterTestingModule,
				ReactiveFormsModule,
			],
			providers: [
				provideAnimations(),
				provideToastr({
					timeOut: 3000,
					positionClass: 'toast-top-right',
					preventDuplicates: true,
				}),
				{ provide: AuthService, useValue: authService },
				{ provide: ToastrService, useValue: toastrService },
				{ provide: Router, useValue: router },
				{
					provide: ActivatedRoute,
					useValue: { snapshot: { queryParams } },
				},
			],
		}).compileComponents();

		const testFixture = TestBed.createComponent(LoginComponent);
		const testComponent = testFixture.componentInstance;
		testFixture.detectChanges();

		return { testFixture, testComponent };
	}

	it('should initialize returnUrl from query params', () => {
		const testReturnUrl = '/dashboard';
		const { testComponent } = configureTestBedWithActivatedRoute({
			returnUrl: testReturnUrl,
		});

		expect((testComponent as unknown as { returnUrl: string }).returnUrl).toBe(
			testReturnUrl,
		);
	});

	it('should use default returnUrl when no query params', () => {
		const { testComponent } = configureTestBedWithActivatedRoute({});

		expect((testComponent as unknown as { returnUrl: string }).returnUrl).toBe(
			'/',
		);
	});

	it('should submit valid form successfully', async () => {
		const mockResponse = { message: 'Login successful' };
		authService.signin.mockReturnValue(of(mockResponse));

		component.loginForm.patchValue({
			email: 'test@example.com',
			password: 'password123',
		});

		await component.onSubmit();

		expect(authService.signin).toHaveBeenCalledWith({
			email: 'test@example.com',
			password: 'password123',
		});
		expect(toastrService.success).toHaveBeenCalledWith('Login successful');
		expect(router.navigateByUrl).toHaveBeenCalledWith('/');
	});

	it('should handle signin error with error message', async () => {
		const mockError = {
			error: {
				error: 'Invalid credentials',
			},
		};
		authService.signin.mockReturnValue(throwError(mockError));

		component.loginForm.patchValue({
			email: 'test@example.com',
			password: 'wrongpassword',
		});

		await component.onSubmit();

		expect(toastrService.error).toHaveBeenCalledWith(
			'Failed to login. Invalid credentials',
		);
	});

	it('should handle signin error with details message', async () => {
		const mockError = {
			error: {
				details: 'Account locked',
			},
		};
		authService.signin.mockReturnValue(throwError(mockError));

		component.loginForm.patchValue({
			email: 'test@example.com',
			password: 'password123',
		});

		await component.onSubmit();

		expect(toastrService.error).toHaveBeenCalledWith(
			'Failed to login. Account locked',
		);
	});

	it('should handle signin error with unknown error', async () => {
		const mockError = {
			error: {},
		};
		authService.signin.mockReturnValue(throwError(mockError));

		component.loginForm.patchValue({
			email: 'test@example.com',
			password: 'password123',
		});

		await component.onSubmit();

		expect(toastrService.error).toHaveBeenCalledWith(
			'Failed to login. Unknown error',
		);
	});

	it('should not submit invalid form', async () => {
		// Leave form invalid (empty required fields)
		await component.onSubmit();

		expect(authService.signin).not.toHaveBeenCalled();
		expect(toastrService.success).not.toHaveBeenCalled();
	});

	it('should handle custom return URL navigation', async () => {
		// Set custom return URL
		(component as unknown as { returnUrl: string }).returnUrl = '/products';

		const mockResponse = { message: 'Welcome back!' };
		authService.signin.mockReturnValue(of(mockResponse));

		component.loginForm.patchValue({
			email: 'test@example.com',
			password: 'password123',
		});

		await component.onSubmit();

		expect(router.navigateByUrl).toHaveBeenCalledWith('/products');
		expect(toastrService.success).toHaveBeenCalledWith('Welcome back!');
	});

	it('should handle response without message', async () => {
		// Provide minimal user shape without message to trigger default toast
		const mockResponse = { email: 'test@example.com' };
		authService.signin.mockReturnValue(of(mockResponse));

		component.loginForm.patchValue({
			email: 'test@example.com',
			password: 'password123',
		});

		await component.onSubmit();

		expect(toastrService.success).toHaveBeenCalledWith('Login successful');
	});

	it('should validate email format', () => {
		const emailControl = component.loginForm.get('email');

		emailControl?.setValue('invalid-email');
		expect(emailControl?.hasError('email')).toBeTruthy();

		emailControl?.setValue('valid@email.com');
		expect(emailControl?.hasError('email')).toBeFalsy();
	});

	it('should require email field', () => {
		const emailControl = component.loginForm.get('email');

		emailControl?.setValue('');
		expect(emailControl?.hasError('required')).toBeTruthy();

		emailControl?.setValue('test@example.com');
		expect(emailControl?.hasError('required')).toBeFalsy();
	});

	it('should require password field', () => {
		const passwordControl = component.loginForm.get('password');

		passwordControl?.setValue('');
		expect(passwordControl?.hasError('required')).toBeTruthy();

		passwordControl?.setValue('password123');
		expect(passwordControl?.hasError('required')).toBeFalsy();
	});
});
