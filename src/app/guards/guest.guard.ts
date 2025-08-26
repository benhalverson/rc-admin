import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { computed } from '@angular/core';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authStore = authService.getAuthStore();

  // Wait for auth initialization to complete
  const isInitialized = computed(() => authStore.isInitialized());
  const isAuthenticated = computed(() => authStore.isAuthenticated());

  // If not initialized yet, wait for it
  if (!isInitialized()) {
    // Return a promise that resolves when initialization is complete
    return new Promise((resolve) => {
      const checkInit = () => {
        if (isInitialized()) {
          if (isAuthenticated()) {
            // Already authenticated, redirect to home
            router.navigate(['/']);
            resolve(false);
          } else {
            // Not authenticated, allow access to login page
            resolve(true);
          }
        } else {
          // Check again in next tick
          setTimeout(checkInit, 10);
        }
      };
      checkInit();
    });
  }

  // If already initialized, check authentication immediately
  if (isAuthenticated()) {
    // Already authenticated, redirect to home
    router.navigate(['/']);
    return false;
  } else {
    // Not authenticated, allow access to login page
    return true;
  }
};
