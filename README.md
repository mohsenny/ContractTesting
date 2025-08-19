# Contract Testing Demo (Pact + Node.js)

<img width="1536" height="1024" alt="Image" src="https://github.com/user-attachments/assets/4d874b9b-e1f2-4236-96e2-22e85ba4e508" />

Tiny, real-world example of **consumer-driven contract testing** with [Pact].  
Two folders:

```
contract-demo/
├─ consumer/   # writes the contract (pact) via mock server tests
└─ provider/   # verifies the contract against the real API
```

## What’s inside

### `consumer/`
- **`order-status.pact.test.js`** – defines the consumer’s expectations (interactions) and, on pass, **generates** `pacts/MobileApp-OrdersAPI.json`.
- **`client.js`** – tiny HTTP wrapper the test uses (simulates your app calling the API).
- **`package.json`** – `npm test` runs the pact test and writes the pact file to `consumer/pacts/`.

### `provider/`
- **`server.js`** – an Express API with simple `if/else` logic for `/orders/:id`.
- **`verify.pact.js`** – boots the API and **verifies** it against the pact file.
- **`package.json`** – scripts for running the server and verification.

---

## Prereqs

- Node 18+ (works on newer too)
- npm

---

## Quick start

### 1) Install deps

```bash
cd consumer && npm i
cd ../provider && npm i
```

### 2) Generate the pact (consumer side)

```bash
cd consumer
npm test
# -> writes ./consumer/pacts/MobileApp-OrdersAPI.json
```

You’ll see logs from Pact’s **mock server** and a final line like “Consumer pact generated…”.

### 3) Verify the provider against the pact

```bash
cd ../provider
npm run verify:pact
```

This boots the real Express API and replays the pact interactions.  
If everything matches, you’ll see “Verification successful”.

(Optional) Run the API manually:

```bash
npm start
# GET http://localhost:3001/orders/40 -> 200 SHIPPED
# GET http://localhost:3001/orders/7  -> 200 CREATED
# GET http://localhost:3001/orders/999 -> 404 ORDER_NOT_FOUND
```

---

## Project structure

```
consumer/
  client.js
  order-status.pact.test.js
  package.json
  pacts/                # generated contract goes here (do not hand-edit)
provider/
  server.js
  verify.pact.js
  package.json
```

---

## Typical workflow

1. **Consumer** writes/updates expectations in `order-status.pact.test.js`.  
2. `npm test` (consumer) → pact JSON is generated if tests pass.  
3. **Provider** runs `npm run verify:pact` → Pact hits the **real API** and checks it against the pact.  
4. If verification fails, the provider made a breaking change; coordinate or update expectations, then repeat.

---

## Break it on purpose (to see it work)

### Scenario: consumer expectation changes

1) In `consumer/order-status.pact.test.js`, switch the “happy” interaction to `GET /orders/42` and update the client call to `'42'`.

2) Re-generate the pact:

```bash
cd consumer
npm test
```

3) Verify on the provider:

```bash
cd ../provider
npm run verify:pact
```

**Expected:** FAIL (server still ships `40`, not `42`).  
**Fix:** change `provider/server.js` to ship `42` (or support both), then re-verify → PASS.

> Tip: If you ever see old + new interactions mixed in your pact, it means your consumer test run registered both. Ensure there’s **one Pact instance**, **one `executeTest` call**, and **no stray old interactions**; then re-run. Deleting `consumer/pacts/*.json` can help while debugging, but isn’t required in normal flow.

---

## Troubleshooting

- **Verifier demands `providerVersion`**  
  Add this to `opts` in `verify.pact.js`:
  ```js
  providerVersion: process.env.GIT_SHA || 'local-dev'
  ```
  And keep `publishVerificationResult: false` locally.

- **Missing state handler warnings**  
  Safe to ignore in this toy setup. You can add no-op handlers in `verify.pact.js`:
  ```js
  stateHandlers: {
    'order 40 exists with status SHIPPED': async () => {},
    'no order with id 999 exists': async () => {},
  }
  ```

- **Header mismatch (`application/json; charset=utf-8`)**  
  Use a regex matcher in the consumer test:
  ```js
  headers: { 'Content-Type': M.regex(/application\/json.*/, 'application/json; charset=utf-8') }
  ```

---

## CI notes (optional but recommended)

- **Consumer CI**: run tests and publish `pacts/*.json` to a **Pact Broker** (or artifact store/S3).  
- **Provider CI**: fetch pact(s) and run `node verify.pact.js`.  
- With a Broker, add `can-i-deploy` to gate releases based on compatibility matrices.

---

## Why contract testing here?

- **Consumer-owned expectations**: the contract reflects what real consumers rely on.  
- **Fast feedback**: milliseconds locally, no flaky shared environments.  
- **Scales across teams**: providers prove compatibility against *all* consumers’ pacts before shipping.

---

Happy testing. Stop breaking each other’s apps.
