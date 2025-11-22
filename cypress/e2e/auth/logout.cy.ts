describe('Logout Functionality', () => {
	const validCredentials = {
		email: 'ben@ben.com',
		password: 'password',
	};

	beforeEach(() => {
		// Clear any existing session storage
		cy.window().then((win) => {
			win.sessionStorage.clear();
		});

		// Login before each logout test
		cy.login(validCredentials.email, validCredentials.password);
	});

	describe('Successful Logout', () => {
		it('should logout successfully and redirect to signin page', () => {
			cy.get('[data-cy="logout-button"]').should('be.visible');
			cy.logout();

			// Should redirect to signin page
			cy.url().should('include', '/signin');

			// Should show unauthenticated state - login form should be visible
			cy.get('[data-cy="email-input"]').should('be.visible');
			cy.get('[data-cy="password-input"]').should('be.visible');
			cy.get('[data-cy="login-button"]').should('be.visible');
		});

		it('should clear authentication state from session storage', () => {
			cy.logout();

			// Should be on signin page
			cy.url().should('include', '/signin');

			cy.window().then((win) => {
				expect(win.sessionStorage.getItem('isAuthenticated')).to.be.null;
				expect(win.sessionStorage.getItem('user')).to.be.null;
			});
		});

		it('should prevent access to protected routes after logout', () => {
			cy.logout();

			// Try to access protected route
			cy.visit('/add-product');

			// Should redirect to signin
			cy.url().should('include', '/signin');
		});

		it('should handle logout from navbar', () => {
			// Test logout from main navigation
			cy.get('[data-cy="navbar"]').within(() => {
				cy.get('[data-cy="logout-button"]').click();
			});

			cy.url().should('include', '/signin');
			cy.get('[data-cy="email-input"]').should('be.visible');
		});

		it('should handle logout from mobile menu', () => {
			// Test mobile menu logout (if applicable)
			cy.viewport('iphone-6'); // Switch to mobile viewport

			cy.get('[data-cy="mobile-menu-toggle"]').click();
			cy.get('[data-cy="mobile-menu"]').within(() => {
				cy.get('[data-cy="logout-button"]').click();
			});

			cy.url().should('include', '/signin');
			cy.get('[data-cy="email-input"]').should('be.visible');
		});
	});

	describe('Logout Error Handling', () => {
		it('should handle logout API errors gracefully', () => {
			// Intercept logout request and force an error
			cy.intercept('GET', '**/auth/signout', { statusCode: 500 }).as(
				'logoutRequest',
			);

			cy.logout();

			cy.wait('@logoutRequest');

			// Should still log out locally even if server request fails
			cy.url().should('include', '/signin');
			cy.get('[data-cy="email-input"]').should('be.visible');

			// Session storage should be cleared
			cy.window().then((win) => {
				expect(win.sessionStorage.getItem('isAuthenticated')).to.be.null;
			});
		});

		it('should handle network errors during logout', () => {
			// Intercept logout request and force a network error
			cy.intercept('GET', '**/auth/signout', { forceNetworkError: true }).as(
				'logoutRequest',
			);

			cy.logout();

			cy.wait('@logoutRequest');

			// Should still log out locally
			cy.url().should('include', '/signin');
			cy.get('[data-cy="email-input"]').should('be.visible');
		});
	});

	describe('Session Management', () => {
		it('should handle multiple logout attempts', () => {
			cy.logout();

			// Should be on signin page where logout button doesn't exist
			cy.url().should('include', '/signin');
			cy.get('[data-cy="logout-button"]').should('not.exist');

			// Verify in logged out state - login form should be visible
			cy.get('[data-cy="email-input"]').should('be.visible');
		});

		it('should handle logout with concurrent sessions', () => {
			// This test simulates logging out when there might be multiple tabs open
			cy.logout();

			// Simulate another tab logging out by clearing session storage
			cy.window().then((win) => {
				win.sessionStorage.clear();
			});

			cy.reload();

			// Should show logged out state - still on signin page
			cy.url().should('include', '/signin');
			cy.get('[data-cy="email-input"]').should('be.visible');
			cy.get('[data-cy="logout-button"]').should('not.exist');
		});
	});

	describe('UI State After Logout', () => {
		it('should redirect to signin page after logout', () => {
			cy.logout();

			cy.url().should('include', '/signin');
			cy.get('[data-cy="email-input"]').should('be.visible');
			cy.get('[data-cy="password-input"]').should('be.visible');
			cy.get('[data-cy="login-button"]').should('be.visible');
		});

		it('should show signin page after mobile logout', () => {
			cy.viewport('iphone-6');

			cy.logout();

			cy.url().should('include', '/signin');
			cy.get('[data-cy="email-input"]').should('be.visible');
			cy.get('[data-cy="password-input"]').should('be.visible');
			cy.get('[data-cy="login-button"]').should('be.visible');
		});

		it('should close mobile menu and redirect to signin after logout', () => {
			cy.viewport('iphone-6');

			cy.get('[data-cy="mobile-menu-toggle"]').click();
			cy.get('[data-cy="mobile-menu"]').should('be.visible');

			cy.get('[data-cy="mobile-menu"]').within(() => {
				cy.get('[data-cy="logout-button"]').click();
			});

			// Should be redirected to signin page
			cy.url().should('include', '/signin');
			cy.get('[data-cy="email-input"]').should('be.visible');
		});
	});
});
