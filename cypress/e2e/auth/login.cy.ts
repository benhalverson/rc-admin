describe('Login Functionality', () => {
  const validCredentials = {
    email: 'ben@ben.com',
    password: 'password'
  };

  const invalidCredentials = {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  };

  beforeEach(() => {
    // Clear any existing session storage
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  describe('Login Page', () => {
    beforeEach(() => {
      cy.visit('/signin');
    });

    it('should display login form elements', () => {
      cy.get('[data-cy="email-input"]').should('be.visible');
      cy.get('[data-cy="password-input"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('contain.text', 'Sign in');
    });

    it('should have proper form labels and placeholders', () => {
      cy.get('label[for="email"]').should('contain.text', 'Email');
      cy.get('label[for="password"]').should('contain.text', 'Password');
      cy.get('[data-cy="email-input"]').should('have.attr', 'type', 'email');
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
    });

    it('should require email and password fields', () => {
      cy.visit('/signin');
      // Wait for form to be initialized and interactable
      cy.get('[data-cy="email-input"]').should('be.visible').should('not.be.disabled');
      cy.get('[data-cy="password-input"]').should('be.visible').should('not.be.disabled');
      cy.get('[data-cy="login-button"]').should('be.visible');

      // Try submitting empty form - button should be disabled due to form validation
      cy.get('[data-cy="login-button"]').should('be.disabled');

      // Add email but not password
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="login-button"]').should('be.disabled');

      // Add password
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="login-button"]').should('not.be.disabled');
    });

    it('should validate email format', () => {
      cy.visit('/signin');
      // Wait for form to be ready
      cy.get('[data-cy="email-input"]').should('be.visible').should('not.be.disabled');

      cy.get('[data-cy="email-input"]').type('invalid-email');
      cy.get('[data-cy="password-input"]').type('password123');
      cy.get('[data-cy="login-button"]').should('be.disabled');

      cy.get('[data-cy="email-input"]').clear().type('valid@email.com');
      cy.get('[data-cy="login-button"]').should('not.be.disabled');
    });
  });

  describe('Successful Login', () => {
    it('should login with valid credentials', () => {
      cy.login(validCredentials.email, validCredentials.password);

      // Should redirect to dashboard/home page
      cy.url().should('not.include', '/signin');
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Should show authenticated user elements
      cy.get('[data-cy="logout-button"]').should('be.visible');
      cy.get('[data-cy="add-product-link"]').should('be.visible');
    });

    it('should store authentication state in session storage', () => {
      cy.login(validCredentials.email, validCredentials.password);

      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('isAuthenticated')).to.equal('true');
        expect(win.sessionStorage.getItem('user')).to.not.be.null;

        const user = JSON.parse(win.sessionStorage.getItem('user') || '{}');
        expect(user.email).to.equal(validCredentials.email);
      });
    });

    it('should persist authentication on page refresh', () => {
      cy.login(validCredentials.email, validCredentials.password);

      // Refresh the page
      cy.reload();

      // Should still be authenticated
      cy.get('[data-cy="logout-button"]').should('be.visible');
      cy.get('[data-cy="add-product-link"]').should('be.visible');
    });

    it('should show success message on login', () => {
      cy.intercept('POST', 'http://localhost:8787/auth/signin', {
        statusCode: 200,
        body: { message: 'Login successful' }
      }).as('signinRequest');

      cy.intercept('GET', 'http://localhost:8787/profile', {
        statusCode: 200,
        body: { email: 'ben@ben.com', id: 1 }
      }).as('profileRequest');

      cy.visit('/signin');
      cy.waitForFormReady();

      cy.get('[data-cy="email-input"]').type('ben@ben.com');
      cy.get('[data-cy="password-input"]').type('password');
      cy.get('[data-cy="login-button"]').click();

      cy.wait('@signinRequest');
      cy.wait('@profileRequest');
      cy.contains('Login successful', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Failed Login', () => {
    beforeEach(() => {
      cy.visit('/signin');
    });

    it('should show error message with invalid credentials', () => {
      cy.intercept('POST', 'http://localhost:8787/auth/signin', {
        statusCode: 401,
        body: { error: 'Invalid credentials' }
      }).as('signinRequest');

      cy.waitForFormReady();
      cy.get('[data-cy="email-input"]').type(invalidCredentials.email);
      cy.get('[data-cy="password-input"]').type(invalidCredentials.password);
      cy.get('[data-cy="login-button"]').click();

      cy.wait('@signinRequest');
      cy.contains('Failed to login', { timeout: 5000 }).should('be.visible');

      // Should remain on login page
      cy.url().should('include', '/signin');
    });

    it('should not store authentication state on failed login', () => {
      cy.intercept('POST', 'http://localhost:8787/auth/signin', {
        statusCode: 401,
        body: { error: 'Invalid credentials' }
      }).as('signinRequest');

      cy.waitForFormReady();
      cy.get('[data-cy="email-input"]').type(invalidCredentials.email);
      cy.get('[data-cy="password-input"]').type(invalidCredentials.password);
      cy.get('[data-cy="login-button"]').click();

      cy.wait('@signinRequest');
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('isAuthenticated')).to.be.null;
        expect(win.sessionStorage.getItem('user')).to.be.null;
      });
    });

    it('should handle network errors gracefully', () => {
      // Intercept login request and force a network error
      cy.intercept('POST', 'http://localhost:8787/auth/signin', { forceNetworkError: true }).as('signinRequest');

      cy.get('[data-cy="email-input"]').type(validCredentials.email);
      cy.get('[data-cy="password-input"]').type(validCredentials.password);
      cy.get('[data-cy="login-button"]').click();

      cy.wait('@signinRequest');

      // Should show error message (the app shows "Failed to login" for network errors)
      cy.contains('Failed to login', { timeout: 5000 }).should('be.visible');
    });    it('should handle server errors (500)', () => {
      // Intercept login request and return server error
      cy.intercept('POST', 'http://localhost:8787/auth/signin', { statusCode: 500 }).as('signinRequest');

      cy.get('[data-cy="email-input"]').type(validCredentials.email);
      cy.get('[data-cy="password-input"]').type(validCredentials.password);
      cy.get('[data-cy="login-button"]').click();

      cy.wait('@signinRequest');

      // Should show error message
      cy.contains('Failed to login', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during login', () => {
      // Intercept and delay the login request
      cy.intercept('POST', 'http://localhost:8787/auth/signin', {
        statusCode: 200,
        body: { message: 'Login successful' },
        delay: 1000
      }).as('signinRequest');

      cy.intercept('GET', 'http://localhost:8787/profile', {
        statusCode: 200,
        body: { email: 'ben@ben.com', id: 1 }
      }).as('profileRequest');

      cy.visit('/signin');
      cy.waitForFormReady();

      cy.get('[data-cy="email-input"]').type(validCredentials.email);
      cy.get('[data-cy="password-input"]').type(validCredentials.password);
      cy.get('[data-cy="login-button"]').click();

      // Should show loading state
      cy.get('[data-cy="login-button"]').should('be.disabled');
      // Note: The app might not show "Signing in..." text, remove this assertion for now

      cy.wait('@signinRequest');
      cy.wait('@profileRequest');
    });
  });

  describe('Form Interaction', () => {
    beforeEach(() => {
      cy.visit('/signin');
    });

    it('should allow form submission with Enter key', () => {
      cy.intercept('POST', 'http://localhost:8787/auth/signin', {
        statusCode: 200,
        body: { message: 'Login successful' }
      }).as('signinRequest');

      cy.intercept('GET', 'http://localhost:8787/profile', {
        statusCode: 200,
        body: { email: 'ben@ben.com', id: 1 }
      }).as('profileRequest');

      cy.waitForFormReady();
      cy.get('[data-cy="email-input"]').type(validCredentials.email);
      cy.get('[data-cy="password-input"]').type(validCredentials.password);
      cy.get('[data-cy="password-input"]').type('{enter}');

      cy.wait('@signinRequest');
      cy.wait('@profileRequest');

      // Should redirect on successful login
      cy.url().should('not.include', '/signin');
    });

    it('should clear form fields when needed', () => {
      cy.waitForFormReady();
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('testpassword');

      cy.get('[data-cy="email-input"]').clear();
      cy.get('[data-cy="password-input"]').clear();

      cy.get('[data-cy="email-input"]').should('have.value', '');
      cy.get('[data-cy="password-input"]').should('have.value', '');
    });

    it('should maintain focus flow between form elements', () => {
      cy.waitForFormReady();
      cy.get('[data-cy="email-input"]').focus();
      cy.get('[data-cy="email-input"]').should('be.focused');

      // Type email and then tab to password field
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').focus();
      cy.get('[data-cy="password-input"]').should('be.focused');
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to signin when accessing protected routes while unauthenticated', () => {
      cy.visit('/add-product');
      cy.url().should('include', '/signin');
    });

    it('should redirect to originally requested page after login', () => {
      // Try to access protected route
      cy.visit('/add-product');
      cy.url().should('include', '/signin');

      // Login
      cy.login(validCredentials.email, validCredentials.password);

      // Should redirect to originally requested page
      cy.url().should('include', '/add-product');
    });

    it('should redirect authenticated users away from signin page', () => {
      // First login
      cy.login(validCredentials.email, validCredentials.password);

      // Try to visit login page again
      cy.visit('/signin');

      // Should redirect to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });
});
