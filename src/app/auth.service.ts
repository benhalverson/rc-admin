import { Injectable, inject, PLATFORM_ID, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, tap, catchError, of, switchMap } from 'rxjs';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { isPlatformBrowser } from '@angular/common';

// Auth store using NgRx signals
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState({
    isAuthenticated: false,
    user: null as any,
    loading: false,
    error: null as string | null,
    isInitialized: false
  }),
  withMethods((store) => ({
    setAuthenticated: (isAuthenticated: boolean, user?: any) => {
      patchState(store, { isAuthenticated, user: user || null, isInitialized: true });
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
    }
  }))
);

interface User {
  id?: number;
  email: string;
  name?: string;
}

interface AuthResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
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

  signin(formData: MyFormData): Observable<any> {
    console.log('environment', environment);
    this.authStore.setLoading(true);
    this.authStore.setError(null);

    return this.http.post<AuthResponse>(
      `${environment.baseurl}/auth/signin`,
      { email: formData.email, password: formData.password }
    ).pipe(
      switchMap((response: AuthResponse) => {
        console.log('Signin successful, fetching user profile...');
        // After successful signin, fetch the user profile to get complete user data
        return this.http.get<User>(`${environment.baseurl}/profile`).pipe(
          tap({
            next: (profileResponse: User) => {
              console.log('Profile fetched:', profileResponse);
              this.authStore.setAuthenticated(true, profileResponse);
              this.authStore.setLoading(false);

              // Store auth state in sessionStorage for page refresh persistence
              if (isPlatformBrowser(this.platformId)) {
                sessionStorage.setItem('isAuthenticated', 'true');
                sessionStorage.setItem('user', JSON.stringify(profileResponse));
              }
            }
          }),
          catchError((profileError) => {
            console.log('Profile fetch failed, using basic user data:', profileError);
            // Fallback to basic user data if profile fetch fails
            const basicUser: User = { email: formData.email };
            this.authStore.setAuthenticated(true, basicUser);
            this.authStore.setLoading(false);

            if (isPlatformBrowser(this.platformId)) {
              sessionStorage.setItem('isAuthenticated', 'true');
              sessionStorage.setItem('user', JSON.stringify(basicUser));
            }
            return of(basicUser);
          })
        );
      }),
      catchError((error) => {
        console.log('Signin failed:', error);
        this.authStore.setError(error.error?.message || 'Login failed');
        this.authStore.setLoading(false);

        // Clear sessionStorage on login failure
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.removeItem('isAuthenticated');
          sessionStorage.removeItem('user');
        }
        throw error;
      })
    );
  }

  logout(): Observable<any> {
    // Call server signout endpoint to clear the signed cookie
    return this.http.get(`${environment.baseurl}/auth/signout`).pipe(
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
        }
      }),
      catchError(() => {
        // Ensure we always clear local state even on error
        this.authStore.logout();
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.removeItem('isAuthenticated');
          sessionStorage.removeItem('user');
        }
        return of(null);
      })
    );
  }

  isAuthenticated(): boolean {
    return this.authStore.isAuthenticated();
  }

  getAuthStore() {
    return this.authStore;
  }

  private checkAuthStatus(): void {
    console.log('Checking auth status...');
    this.authStore.setLoading(true);

    // Check authentication status by calling the protected /profile endpoint
    // The signed cookie will be automatically included with withCredentials: true
    this.http.get<User>(`${environment.baseurl}/profile`).pipe(
      tap({
        next: (response: User) => {
          console.log('Auth check successful:', response);
          // If the request succeeds, user is authenticated
          this.authStore.setAuthenticated(true, response);
          this.authStore.setLoading(false);

          // Store auth state in sessionStorage for consistency
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('user', JSON.stringify(response));
          }
        },
        error: (error) => {
          console.log('Auth check failed:', error);
          // If the request fails, user is not authenticated
          this.authStore.setAuthenticated(false);
          this.authStore.setLoading(false);

          // Clear sessionStorage on auth failure
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.removeItem('isAuthenticated');
            sessionStorage.removeItem('user');
          }
        }
      }),
      catchError((error) => {
        console.log('Auth check error:', error);
        this.authStore.setAuthenticated(false);
        this.authStore.setLoading(false);

        // Clear sessionStorage on error
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.removeItem('isAuthenticated');
          sessionStorage.removeItem('user');
        }
        return of(null);
      })
    ).subscribe();
  }
}

export interface MyFormData {
  email: string;
  password: string;
}
