describe('Authentication State Management', () => {
  const validCredentials = {
    email: 'a@b.com',
    password: 'password'
  };

  beforeEach(() => {
    // Clear session storage before each test
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  describe('Session Persistence', () => {
    it('should maintain authentication across browser refresh', () => {
      // Login first
      cy.login(validCredentials.email, validCredentials.password);

      // Verify initial authentication
      cy.get('[data-cy="logout-button"]').should('be.visible');

      // Refresh the page
      cy.reload();

      // Should still be authenticated
      cy.get('[data-cy="logout-button"]').should('be.visible');
      cy.url().should('not.include', '/signin');
    });

    it('should restore user data from session storage', () => {
      // Login and verify session storage
      cy.login(validCredentials.email, validCredentials.password);

      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('isAuthenticated')).to.equal('true');

        const userData = win.sessionStorage.getItem('user');
        expect(userData).to.not.be.null;

        const user = JSON.parse(userData || '{}');
        expect(user.email).to.equal(validCredentials.email);
      });

      // Refresh and verify data is still there
      cy.reload();

      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('isAuthenticated')).to.equal('true');
        const user = JSON.parse(win.sessionStorage.getItem('user') || '{}');
        expect(user.email).to.equal(validCredentials.email);
      });
    });

    it('should handle corrupted session storage gracefully', () => {
      // First login normally
      cy.login(validCredentials.email, validCredentials.password);

      // Corrupt the session storage
      cy.window().then((win) => {
        win.sessionStorage.setItem('user', 'invalid-json');
        win.sessionStorage.setItem('isAuthenticated', 'maybe');
      });

      // Refresh the page
      cy.reload();

      // Should redirect to login due to corrupted data
      cy.url().should('include', '/signin');
      cy.get('[data-cy="signin-link"]').should('be.visible');
    });
  });

  describe('Route Protection', () => {
    it('should redirect unauthenticated users from /add-product to signin', () => {
      cy.visit('/add-product');
      cy.url().should('include', '/signin');
    });

    it('should allow authenticated users to access /add-product', () => {
      cy.login(validCredentials.email, validCredentials.password);
      cy.visit('/add-product');
      cy.url().should('include', '/add-product');
      cy.get('[data-cy="logout-button"]').should('be.visible');
    });

    it('should redirect to originally requested route after login', () => {
      // Try to access protected route
      cy.visit('/add-product');
      cy.url().should('include', '/signin');

      // Complete login process
      cy.get('[data-cy="email-input"]').type(validCredentials.email);
      cy.get('[data-cy="password-input"]').type(validCredentials.password);
      cy.get('[data-cy="login-button"]').click();

      // Should redirect to originally requested page
      cy.url().should('include', '/add-product');
    });

    it('should prevent authenticated users from accessing signin page', () => {
      cy.login(validCredentials.email, validCredentials.password);

      // Try to visit signin page
      cy.visit('/signin');

      // Should redirect to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('[data-cy="logout-button"]').should('be.visible');
    });
  });

  describe('Authentication Status Checks', () => {
    it('should check authentication status on app initialization', () => {
      // Set up session storage manually to simulate existing session
      cy.window().then((win) => {
        win.sessionStorage.setItem('isAuthenticated', 'true');
        win.sessionStorage.setItem('user', JSON.stringify({
          email: validCredentials.email,
          id: 1
        }));
      });

      // Visit the app
      cy.visit('/');

      // Should show authenticated state
      cy.get('[data-cy="logout-button"]').should('be.visible');
      cy.get('[data-cy="add-product-link"]').should('be.visible');
    });

    it('should handle server validation failure', () => {
      // Set up session storage
      cy.window().then((win) => {
        win.sessionStorage.setItem('isAuthenticated', 'true');
        win.sessionStorage.setItem('user', JSON.stringify({ email: validCredentials.email }));
      });

      // Intercept profile validation to return unauthorized
      cy.intercept('GET', 'http://localhost:8787/profile', { statusCode: 401 }).as('profileCheck');

      cy.visit('/');

      // Should detect invalid session and redirect to signin
      cy.url().should('include', '/signin');
    });
  });

  describe('Multiple Tab Behavior', () => {
    it('should handle logout from one tab affecting other tabs', () => {
      cy.login(validCredentials.email, validCredentials.password);

      // Simulate logout in another tab by clearing session storage
      cy.window().then((win) => {
        win.sessionStorage.clear();

        // Trigger storage event to simulate cross-tab communication
        win.dispatchEvent(new StorageEvent('storage', {
          key: 'isAuthenticated',
          oldValue: 'true',
          newValue: null,
          storageArea: win.sessionStorage
        }));
      });

      // Should detect logout and update UI
      cy.get('[data-cy="signin-link"]').should('be.visible');
    });

    it('should sync authentication state across storage events', () => {
      cy.visit('/');
      cy.get('[data-cy="signin-link"]').should('be.visible');

      // Simulate login in another tab
      cy.window().then((win) => {
        win.sessionStorage.setItem('isAuthenticated', 'true');
        win.sessionStorage.setItem('user', JSON.stringify({ email: validCredentials.email }));

        // Trigger storage event
        win.dispatchEvent(new StorageEvent('storage', {
          key: 'isAuthenticated',
          oldValue: null,
          newValue: 'true',
          storageArea: win.sessionStorage
        }));
      });

      // Should update to show authenticated state
      cy.get('[data-cy="logout-button"]').should('be.visible');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication check', () => {
      // Intercept and delay profile check
      cy.intercept('GET', 'http://localhost:8787/profile', {
        statusCode: 200,
        body: { email: validCredentials.email },
        delay: 1000
      }).as('profileCheck');

      // Set up session storage to trigger auth check
      cy.window().then((win) => {
        win.sessionStorage.setItem('isAuthenticated', 'true');
        win.sessionStorage.setItem('user', JSON.stringify({ email: validCredentials.email }));
      });

      cy.visit('/');

      // Should show loading state
      cy.get('[data-cy="loading-spinner"]').should('be.visible');

      cy.wait('@profileCheck');

      // Loading should be complete
      cy.get('[data-cy="logout-button"]').should('be.visible');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors during auth check', () => {
      // Set up session storage
      cy.window().then((win) => {
        win.sessionStorage.setItem('isAuthenticated', 'true');
        win.sessionStorage.setItem('user', JSON.stringify({ email: validCredentials.email }));
      });

      // First request fails with network error
      cy.intercept('GET', 'http://localhost:8787/profile', { forceNetworkError: true }).as('profileError');

      cy.visit('/');

      // Should handle error gracefully
      cy.url().should('include', '/signin');
    });

    it('should handle expired sessions gracefully', () => {
      cy.login(validCredentials.email, validCredentials.password);

      // Intercept requests to return unauthorized (simulating expired session)
      cy.intercept('GET', 'http://localhost:8787/profile', { statusCode: 401 }).as('expiredSession');

      // Try to access protected resource
      cy.visit('/add-product');

      // Should redirect to signin page
      cy.url().should('include', '/signin');

      // Session storage should be cleared
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('isAuthenticated')).to.be.null;
        expect(win.sessionStorage.getItem('user')).to.be.null;
      });
    });
  });
});
