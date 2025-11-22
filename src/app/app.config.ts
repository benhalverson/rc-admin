import {
	provideHttpClient,
	withFetch,
	withInterceptors,
} from '@angular/common/http';
import {
	type ApplicationConfig,
	provideZoneChangeDetection,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';
import { credentialsInterceptor } from './interceptors/credentials.interceptor';

export const appConfig: ApplicationConfig = {
	providers: [
		provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideClientHydration(),
		provideAnimations(), // required animations providers
		provideToastr({
			timeOut: 3000,
			positionClass: 'toast-top-right',
			preventDuplicates: true,
		}),
	],
};
