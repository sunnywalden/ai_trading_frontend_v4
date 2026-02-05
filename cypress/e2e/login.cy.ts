describe('Auth flow', () => {
  it('allows login and shows username in sidebar', () => {
    cy.visit('/login');
    cy.get('input[placeholder="管理员用户名"]').clear().type('admin');
    cy.get('input[placeholder="管理员密码"]').clear().type('admin');
    cy.get('button').contains('登录').click();

    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // sidebar should show username
    cy.get('.user-name').should('contain', 'admin');
  });

  it('shows expiry banner when token near expiry', () => {
    // create a token with short expiry (< 3 minutes)
    const exp = Math.floor((Date.now() + 2 * 60 * 1000) / 1000);
    const payload = { sub: 'admin', exp };
    const base64 = (s) => btoa(unescape(encodeURIComponent(JSON.stringify(s))));
    const fakeToken = `header.${base64(payload)}.signature`;

    // set token in localStorage
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', fakeToken);
    });
    cy.reload();

    // banner should appear
    cy.get('.expiry-banner').should('exist').and('contain', 'Token 将在');
  });
});