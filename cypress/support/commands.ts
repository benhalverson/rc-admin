// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
declare namespace Cypress {
  interface Chainable<Subject = any> {
    login(email: string, password: string): typeof login;
    logout(): typeof logout;
    waitForFormReady(): void;
  }
}

// Login command for reusable authentication
function login(email: string, password: string): void {
  cy.intercept('POST', 'http://localhost:8787/auth/signin', {
    statusCode: 200,
    body: { message: 'Login successful' }
  }).as('signinRequest');

  cy.intercept('GET', 'http://localhost:8787/profile', {
    statusCode: 200,
    body: { email: email, id: 1 }
  }).as('profileRequest');

  cy.visit('/signin');

  // Wait for the form to be ready
  cy.get('[data-cy="email-input"]').should('be.visible').and('not.be.disabled');
  cy.get('[data-cy="password-input"]').should('be.visible').and('not.be.disabled');

  // Type credentials
  cy.get('[data-cy="email-input"]').clear().type(email);
  cy.get('[data-cy="password-input"]').clear().type(password);

  // Wait for form to be valid and button to be enabled
  cy.get('[data-cy="login-button"]').should('not.be.disabled');
  cy.get('[data-cy="login-button"]').click();

  cy.wait('@signinRequest');
  cy.wait('@profileRequest');

  // Wait for successful redirect
  cy.url().should('not.include', '/signin');
}

// Logout command
function logout(): void {
  cy.intercept('GET', 'http://localhost:8787/auth/signout', {
    statusCode: 200,
    body: { message: 'Logged out successfully' }
  }).as('signoutRequest');

  cy.get('[data-cy="logout-button"]').click();
  cy.wait('@signoutRequest');
}

function waitForFormReady(): void {
  cy.wait(500); // Give Angular time to initialize
  cy.get('[data-cy="email-input"]').should('be.visible').should('not.be.disabled');
  cy.get('[data-cy="password-input"]').should('be.visible').should('not.be.disabled');
  cy.get('[data-cy="login-button"]').should('be.visible');
}

// Register the custom commands
Cypress.Commands.add('login', (email: string, password: string) => {
  // Set up intercepts first
  cy.intercept('POST', 'http://localhost:8787/auth/signin', { fixture: 'login-success.json' }).as('signinRequest');
  cy.intercept('GET', 'http://localhost:8787/profile', { fixture: 'profile-success.json' }).as('profileRequest');

  // Clear any existing state first
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });

  // Visit the signin page
  cy.visit('/signin');

  // Wait for the page to load and form to be ready (similar to working tests)
  cy.get('[data-cy="email-input"]').should('be.visible');
  cy.get('[data-cy="password-input"]').should('be.visible');
  cy.get('[data-cy="login-button"]').should('be.visible');

  // Wait a bit more for Angular to fully initialize the reactive form
  cy.wait(1000);

  // Ensure form fields are not disabled
  cy.get('[data-cy="email-input"]').should('not.be.disabled');
  cy.get('[data-cy="password-input"]').should('not.be.disabled');

  // Interact with form
  cy.get('[data-cy="email-input"]').clear().type(email);
  cy.get('[data-cy="password-input"]').clear().type(password);
  cy.get('[data-cy="login-button"]').click();

  // Wait for requests
  cy.wait('@signinRequest');
  cy.wait('@profileRequest');
});

Cypress.Commands.add('waitForFormReady', () => {
  cy.get('[data-cy="email-input"]').should('be.visible').should('not.be.disabled');
  cy.get('[data-cy="password-input"]').should('be.visible').should('not.be.disabled');
  cy.get('[data-cy="login-button"]').should('be.visible');
});
Cypress.Commands.add('logout', logout);

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
