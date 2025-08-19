const { PactV3, MatchersV3: M } = require('@pact-foundation/pact');
const path = require('path');
const { getOrder } = require('./client');

const pact = new PactV3({
  consumer: 'MobileApp',
  provider: 'OrdersAPI',
  dir: path.resolve(__dirname, 'pacts') // where the pact file will be written
});

(async () => {
  // Example: Mobile app expects SHIPPED status for order 42
  pact
    .given('order 42 exists with status SHIPPED') // state label, verified on provider side by behavior
    .uponReceiving('a request for order 42')
    .withRequest({
      method: 'GET',
      path: '/orders/42'
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': M.regex(/application\/json.*/, 'application/json; charset=utf-8') },
      body: {
        id: '42',
        status: M.string('SHIPPED'),
        eta: M.regex(/.+/, '2025-08-20T12:00:00Z')
      }
    });

  // Also define a NOT FOUND expectation to pin error shape for unknown IDs
  pact
    .given('no order with id 999 exists')
    .uponReceiving('a request for a missing order')
    .withRequest({ method: 'GET', path: '/orders/999' })
    .willRespondWith({
      status: 404,
      body: {
        error: M.string('ORDER_NOT_FOUND'),
        message: M.includes('not found') // contains matcher
      }
    });

  // executeTest spins a mock server that enforces the contract
  await pact.executeTest(async (mockServer) => {
    // Happy path
    const ok = await getOrder(mockServer.url, '42');
    if (ok.status !== 200) throw new Error('Expected 200 for order 42');
    if (ok.body.status !== 'SHIPPED') throw new Error('Expected status SHIPPED');

    // Missing order
    const miss = await getOrder(mockServer.url, '999');
    if (miss.status !== 404) throw new Error('Expected 404 for missing order');
    if (!miss.body.message.includes('not found')) throw new Error('Expected error message');
  });

  console.log('Consumer pact generated at ./consumer/pacts');
})();