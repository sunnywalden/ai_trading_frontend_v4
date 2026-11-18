function envValue(name: string): string {
  const value = Cypress.env(name);
  return typeof value === 'string' ? value.trim() : '';
}

describe('Auth flow', () => {
  it('allows login and shows username in sidebar', function () {
    const username = envValue('ADMIN_USERNAME');
    const password = envValue('ADMIN_PASSWORD');
    if (!username || !password) {
      cy.log('Skipping login: set CYPRESS_ADMIN_USERNAME and CYPRESS_ADMIN_PASSWORD');
      this.skip();
    }

    cy.visit('/login');
    cy.get('input[placeholder="管理员用户名"]').clear().type(username);
    cy.get('input[placeholder="管理员密码"]').clear().type(password, { log: false });
    cy.get('button').contains('登录').click();

    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // sidebar should show username
    cy.get('.user-name').should('contain', username);
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
