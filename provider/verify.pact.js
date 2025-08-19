const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const http = require('http');
const { app } = require('./server');

const PORT = process.env.PORT || 3001;

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app).listen(PORT, () => resolve(server));
  });
}

(async () => {
  const server = await startServer();

  try {
    const opts = {
      provider: 'OrdersAPI',
      pactUrls: [ path.resolve(__dirname, '../consumer/pacts/MobileApp-OrdersAPI.json') ],
      providerBaseUrl: `http://localhost:${PORT}`,
      publishVerificationResult: false,
      providerVersion: process.env.GIT_SHA || 'local-dev',
      stateHandlers: {
        'order 42 exists with status SHIPPED': async () => {
          // no-op; your server already returns SHIPPED for 42
        },
        'no order with id 999 exists': async () => {
          // no-op; your server already 404s for 999
        },
      },
    };

    const output = await new Verifier(opts).verifyProvider();
    console.log('Pact verification complete');
    console.log(output);
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
})();