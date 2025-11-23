import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
	ActivatedRouteSnapshot,
	CanActivateFn,
	Router,
	RouterStateSnapshot,
} from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../auth.service';

export const guestGuard: CanActivateFn = (
	_route: ActivatedRouteSnapshot,
	_state: RouterStateSnapshot,
) => {
	const authService = inject(AuthService);
	const authStore = authService.getAuthStore();
	const router = inject(Router);

	// Wait for auth initialization to complete
	const initialized$ = toObservable(authStore.isInitialized).pipe(
		filter(Boolean),
		take(1),
	);

	return initialized$.pipe(
		map(() => {
			return authStore.isAuthenticated() ? router.createUrlTree(['/']) : true;
		}),
	);
};
