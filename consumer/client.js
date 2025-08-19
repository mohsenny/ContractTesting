const fetch = require('node-fetch');

async function getOrder(baseUrl, id) {
  const res = await fetch(`${baseUrl}/orders/${id}`, { method: 'GET' });
  const json = await res.json();
  return { status: res.status, body: json };
}

module.exports = { getOrder };