import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
	selector: 'app-navbar',
	imports: [RouterModule, NgIf],
	templateUrl: './navbar.component.html',
	styleUrl: './navbar.component.css',
})
export class NavbarComponent {
	private authService = inject(AuthService);
	private router = inject(Router);

	authStore = this.authService.getAuthStore();
	isMobileMenuOpen = false;

	toggleMobileMenu() {
		this.isMobileMenuOpen = !this.isMobileMenuOpen;
	}

	async logout() {
		try {
			await firstValueFrom(this.authService.logout());
			this.router.navigate(['/signin']);
			this.isMobileMenuOpen = false; // Close mobile menu on logout
		} catch (error) {
			console.error('Logout failed:', error);
			// Still navigate to signin even if logout request fails
			this.router.navigate(['/signin']);
			this.isMobileMenuOpen = false;
		}
	}
}
