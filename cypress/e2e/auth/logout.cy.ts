describe('Logout Functionality', () => {
  const validCredentials = {
    email: 'ben@ben.com',
    password: 'password'
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
    it('should logout successfully and redirect to home page', () => {
      cy.get('[data-cy="logout-button"]').should('be.visible');
      cy.logout();

      // Should redirect to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Should show unauthenticated state
      cy.get('[data-cy="signin-link"]').should('be.visible');
      cy.get('[data-cy="logout-button"]').should('not.exist');
      cy.get('[data-cy="add-product-link"]').should('not.exist');
    });

    it('should clear authentication state from session storage', () => {
      cy.logout();

      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('isAuthenticated')).to.be.null;
        expect(win.sessionStorage.getItem('user')).to.be.null;
      });
    });

    it('should prevent access to protected routes after logout', () => {
      cy.logout();

      // Try to access protected route
      cy.visit('/add-product');

      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should handle logout from navbar', () => {
      // Test logout from main navigation
      cy.get('[data-cy="navbar"]').within(() => {
        cy.get('[data-cy="logout-button"]').click();
      });

      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('[data-cy="signin-link"]').should('be.visible');
    });

    it('should handle logout from mobile menu', () => {
      // Test mobile menu logout (if applicable)
      cy.viewport('iphone-6'); // Switch to mobile viewport

      cy.get('[data-cy="mobile-menu-toggle"]').click();
      cy.get('[data-cy="mobile-menu"]').within(() => {
        cy.get('[data-cy="logout-button"]').click();
      });

      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('[data-cy="signin-link"]').should('be.visible');
    });
  });

  describe('Logout Error Handling', () => {
    it('should handle logout API errors gracefully', () => {
      // Intercept logout request and force an error
      cy.intercept('POST', '**/auth/logout', { statusCode: 500 }).as('logoutRequest');

      cy.logout();

      cy.wait('@logoutRequest');

      // Should still log out locally even if server request fails
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('[data-cy="signin-link"]').should('be.visible');

      // Session storage should be cleared
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('isAuthenticated')).to.be.null;
      });
    });

    it('should handle network errors during logout', () => {
      // Intercept logout request and force a network error
      cy.intercept('POST', '**/auth/logout', { forceNetworkError: true }).as('logoutRequest');

      cy.logout();

      cy.wait('@logoutRequest');

      // Should still log out locally
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('[data-cy="signin-link"]').should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('should handle multiple logout attempts', () => {
      cy.logout();

      // Try to logout again (button should not exist)
      cy.get('[data-cy="logout-button"]').should('not.exist');

      // Verify still in logged out state
      cy.get('[data-cy="signin-link"]').should('be.visible');
    });

    it('should handle logout with concurrent sessions', () => {
      // This test simulates logging out when there might be multiple tabs open
      cy.logout();

      // Simulate another tab logging out by clearing session storage
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });

      cy.reload();

      // Should show logged out state
      cy.get('[data-cy="signin-link"]').should('be.visible');
      cy.get('[data-cy="logout-button"]').should('not.exist');
    });
  });

  describe('UI State After Logout', () => {
    it('should update navbar to show unauthenticated state', () => {
      cy.logout();

      cy.get('[data-cy="navbar"]').within(() => {
        cy.get('[data-cy="home-link"]').should('be.visible');
        cy.get('[data-cy="signin-link"]').should('be.visible');
        cy.get('[data-cy="add-product-link"]').should('not.exist');
        cy.get('[data-cy="logout-button"]').should('not.exist');
      });
    });

    it('should update mobile menu to show unauthenticated state', () => {
      cy.viewport('iphone-6');

      cy.logout();

      cy.get('[data-cy="mobile-menu-toggle"]').click();
      cy.get('[data-cy="mobile-menu"]').within(() => {
        cy.get('[data-cy="home-link"]').should('be.visible');
        cy.get('[data-cy="signin-link"]').should('be.visible');
        cy.get('[data-cy="add-product-link"]').should('not.exist');
        cy.get('[data-cy="logout-button"]').should('not.exist');
      });
    });

    it('should close mobile menu after logout', () => {
      cy.viewport('iphone-6');

      cy.get('[data-cy="mobile-menu-toggle"]').click();
      cy.get('[data-cy="mobile-menu"]').should('be.visible');

      cy.get('[data-cy="mobile-menu"]').within(() => {
        cy.get('[data-cy="logout-button"]').click();
      });

      // Mobile menu should be closed after logout
      cy.get('[data-cy="mobile-menu"]').should('not.be.visible');
    });
  });
});
