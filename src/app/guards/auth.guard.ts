import { computed, inject } from '@angular/core';
import {
	type ActivatedRouteSnapshot,
	type CanActivateFn,
	Router,
	type RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = (
	_route: ActivatedRouteSnapshot,
	state: RouterStateSnapshot,
) => {
	const authService = inject(AuthService);
	const router = inject(Router);
	const authStore = authService.getAuthStore();

	// Wait for auth initialization to complete
	const isInitialized = computed(() => authStore.isInitialized());
	const isAuthenticated = computed(() => authStore.isAuthenticated());
	const isLoading = computed(() => authStore.loading());

	// If not initialized yet or still loading, wait for it
	if (!isInitialized() || isLoading()) {
		// Return a promise that resolves when initialization is complete
		return new Promise((resolve) => {
			const checkInit = () => {
				const currentInitialized = isInitialized();
				const currentLoading = isLoading();
				const currentAuthenticated = isAuthenticated();

				if (currentInitialized && !currentLoading) {
					if (currentAuthenticated) {
						resolve(true);
					} else {
						// Store the attempted URL for redirecting after login
						const returnUrl = state.url;
						router.navigate(['/signin'], { queryParams: { returnUrl } });
						resolve(false);
					}
				} else {
					// Check again in next tick
					setTimeout(checkInit, 100);
				}
			};
			checkInit();
		});
	}

	// If already initialized, check authentication immediately
	if (isAuthenticated()) {
		return true;
	} else {
		// Store the attempted URL for redirecting after login
		const returnUrl = state.url;
		router.navigate(['/signin'], { queryParams: { returnUrl } });
		return false;
	}
};
