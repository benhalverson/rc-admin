import { HttpClientTestingModule } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
	let authService: jasmine.SpyObj<AuthService>;
	let toastrService: jasmine.SpyObj<ToastrService>;
	let router: jasmine.SpyObj<Router>;
	let activatedRoute: ActivatedRoute;

	beforeEach(async () => {
		const authServiceSpy = jasmine.createSpyObj('AuthService', ['signin']);
		const toastrServiceSpy = jasmine.createSpyObj('ToastrService', [
			'success',
			'error',
		]);
		const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

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

		authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
		toastrService = TestBed.inject(
			ToastrService,
		) as jasmine.SpyObj<ToastrService>;
		router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
		activatedRoute = TestBed.inject(ActivatedRoute);

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

	it('should initialize returnUrl from query params', () => {
		const testReturnUrl = '/dashboard';
		activatedRoute.snapshot.queryParams = { returnUrl: testReturnUrl };

		const fb = TestBed.inject(FormBuilder);
		const newComponent = new LoginComponent(
			router,
			activatedRoute,
			authService,
			fb,
			toastrService,
		);

		expect((newComponent as unknown as { returnUrl: string }).returnUrl).toBe(
			testReturnUrl,
		);
	});

	it('should use default returnUrl when no query params', () => {
		activatedRoute.snapshot.queryParams = {};

		const fb = TestBed.inject(FormBuilder);
		const newComponent = new LoginComponent(
			router,
			activatedRoute,
			authService,
			fb,
			toastrService,
		);

		expect((newComponent as unknown as { returnUrl: string }).returnUrl).toBe(
			'/',
		);
	});

	it('should submit valid form successfully', async () => {
		const mockResponse = { message: 'Login successful' };
		authService.signin.and.returnValue(of(mockResponse));

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
		authService.signin.and.returnValue(throwError(mockError));

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
		authService.signin.and.returnValue(throwError(mockError));

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
		authService.signin.and.returnValue(throwError(mockError));

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
		authService.signin.and.returnValue(of(mockResponse));

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
		authService.signin.and.returnValue(of(mockResponse));

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
