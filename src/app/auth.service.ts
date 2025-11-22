import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { catchError, type Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../environments/environment';

// Auth store using NgRx signals
export const AuthStore = signalStore(
	{ providedIn: 'root' },
	withState({
		isAuthenticated: false,
		user: null as User | null,
		loading: false,
		error: null as string | null,
		isInitialized: false,
	}),
	withMethods((store) => ({
		setAuthenticated: (isAuthenticated: boolean, user?: User | null) => {
			patchState(store, {
				isAuthenticated,
				user: user,
				isInitialized: true,
			});
		},
		setLoading: (loading: boolean) => {
			patchState(store, { loading });
		},
		setError: (error: string | null) => {
			patchState(store, { error });
		},
		setInitialized: (isInitialized: boolean) => {
			patchState(store, { isInitialized });
		},
		logout: () => {
			patchState(store, { isAuthenticated: false, user: null, error: null });
		},
	})),
);

interface User {
	id?: number;
	email: string;
	name?: string;
}

export interface AuthResponse {
	message: string;
}

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private readonly authStore = inject(AuthStore);
	private readonly platformId = inject(PLATFORM_ID);
	private readonly http = inject(HttpClient);

	constructor() {
		// Only check auth status on browser
		if (isPlatformBrowser(this.platformId)) {
			this.checkAuthStatus();
		} else {
			this.authStore.setInitialized(true);
		}
	}

	signin(formData: MyFormData): Observable<User | AuthResponse> {
		this.authStore.setLoading(true);
		this.authStore.setError(null);

		return this.http
			.post<AuthResponse>(`${environment.baseurl}/auth/signin`, {
				email: formData.email,
				password: formData.password,
			})
			.pipe(
				switchMap((_response: AuthResponse) => {
					// After successful signin, fetch the user profile to get complete user data
					return this.http.get<User>(`${environment.baseurl}/profile`).pipe(
						tap({
							next: (profileResponse: User) => {
								this.authStore.setAuthenticated(true, profileResponse);
								this.authStore.setLoading(false);

								// Store auth state in sessionStorage for page refresh persistence
								if (isPlatformBrowser(this.platformId)) {
									sessionStorage.setItem('isAuthenticated', 'true');
									sessionStorage.setItem(
										'user',
										JSON.stringify(profileResponse),
									);
								}
							},
						}),
						catchError((_profileError) => {
							// Fallback to basic user data if profile fetch fails
							const basicUser: User = { email: formData.email };
							this.authStore.setAuthenticated(true, basicUser);
							this.authStore.setLoading(false);

							if (isPlatformBrowser(this.platformId)) {
								sessionStorage.setItem('isAuthenticated', 'true');
								sessionStorage.setItem('user', JSON.stringify(basicUser));
							}
							return of(basicUser);
						}),
					);
				}),
				catchError((error) => {
					this.authStore.setError(error.error?.message || 'Login failed');
					this.authStore.setLoading(false);

					// Clear sessionStorage on login failure
					if (isPlatformBrowser(this.platformId)) {
						sessionStorage.removeItem('isAuthenticated');
						sessionStorage.removeItem('user');
					}
					throw error;
				}),
			);
	}

	logout(): Observable<AuthResponse> {
		// Call server signout endpoint to clear the signed cookie
		return this.http
			.get<AuthResponse>(`${environment.baseurl}/auth/signout`)
			.pipe(
				tap({
					next: () => {
						this.authStore.logout();
						// Clear sessionStorage on logout
						if (isPlatformBrowser(this.platformId)) {
							sessionStorage.removeItem('isAuthenticated');
							sessionStorage.removeItem('user');
						}
					},
					error: () => {
						// Even if server logout fails, clear local state
						this.authStore.logout();
						if (isPlatformBrowser(this.platformId)) {
							sessionStorage.removeItem('isAuthenticated');
							sessionStorage.removeItem('user');
						}
					},
				}),
				catchError(() => {
					// Ensure we always clear local state even on error
					this.authStore.logout();
					if (isPlatformBrowser(this.platformId)) {
						sessionStorage.removeItem('isAuthenticated');
						sessionStorage.removeItem('user');
					}
					return of({ message: 'Logged out locally' });
				}),
			);
	}

	isAuthenticated(): boolean {
		return this.authStore.isAuthenticated();
	}

	getAuthStore() {
		return this.authStore;
	}

	private checkAuthStatus(): void {
		this.authStore.setLoading(true);

		// Check authentication status by calling the protected /profile endpoint
		// The signed cookie will be automatically included with withCredentials: true
		this.http
			.get<User>(`${environment.baseurl}/profile`)
			.pipe(
				tap({
					next: (response: User) => {
						// If the request succeeds, user is authenticated
						this.authStore.setAuthenticated(true, response);
						this.authStore.setLoading(false);

						// Store auth state in sessionStorage for consistency
						if (isPlatformBrowser(this.platformId)) {
							sessionStorage.setItem('isAuthenticated', 'true');
							sessionStorage.setItem('user', JSON.stringify(response));
						}
					},
					error: (_error) => {
						// If the request fails, user is not authenticated
						this.authStore.setAuthenticated(false);
						this.authStore.setLoading(false);

						// Clear sessionStorage on auth failure
						if (isPlatformBrowser(this.platformId)) {
							sessionStorage.removeItem('isAuthenticated');
							sessionStorage.removeItem('user');
						}
					},
				}),
				catchError((_error) => {
					this.authStore.setAuthenticated(false);
					this.authStore.setLoading(false);

					// Clear sessionStorage on error
					if (isPlatformBrowser(this.platformId)) {
						sessionStorage.removeItem('isAuthenticated');
						sessionStorage.removeItem('user');
					}
					return of(null);
				}),
			)
			.subscribe();
	}
}

export interface MyFormData {
	email: string;
	password: string;
}
