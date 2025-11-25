## Problem Summary
- Pairing code fails after entering on phone. Current code calls `requestPairingCode` immediately after socket creation, not during the connection handshake, and may use stale auth state. This often results in “Connection Closed/428 Precondition Required” and failed linking.

## References
- Baileys official guide: pairing code must be requested in `connection.update` during the connecting/QR phase (https://baileys.wiki/docs/socket/connecting/).
- NPM snippet shows gating by `authState.creds.registered` and using `requestPairingCode(number)` (https://www.npmjs.com/package/@whiskeysockets/baileys).
- Common failure symptom “Connection Closed” reported when requesting code outside correct state (examples in issues #369, #812).

## Fix Plan
### 1) Initialize Socket Safely
- Use multi-file auth state: `const { state, saveCreds } = await useMultiFileAuthState(sessionPath)`.
- Create socket with:
  - `printQRInTerminal: false` (pairing-code mode).
  - `version: await fetchLatestBaileysVersion()` to avoid protocol mismatch & Bad MAC.
  - `browser: Browsers.appropriate('Chrome')`.
- Keep existing `getMessage`, timeouts, and logger.

### 2) Request Code During Handshake
- Move code request into `sock.ev.on('connection.update', async (update) => { ... })` and gate:
  - If `connection === 'connecting' || !!update.qr`, and `!sock.authState.creds.registered`, then:
    - Prompt for phone number (E.164, no `+`, no spaces; e.g., `2349012345678`).
    - `const code = await sock.requestPairingCode(cleanNumber)`.
    - Display code and instructions to enter on the phone: Settings → Linked Devices → Link with phone number.
- Ensure you call `requestPairingCode` only once per startup.

### 3) Persist Credentials
- Listen `sock.ev.on('creds.update', saveCreds)` so the session persists after WhatsApp forces a disconnect and reconnects post-link.

### 4) Start With a Clean Auth Folder (When Needed)
- If pairing fails or mismatched number/session:
  - Delete the selected session folder under `sessions/<name>` and retry.
  - Only one active session folder during initial pairing.

### 5) Handle Disconnects & Retries
- In `connection.update`:
  - On `lastDisconnect?.error?.output?.statusCode === DisconnectReason.connectionClosed`, allow reconnect logic (limited attempts).
  - Avoid re-requesting pairing code after connection closes; restart process cleanly instead.

### 6) Phone Number Input & Timing
- Validate number strictly: digits only, includes country code, length >= 10.
- Pairing codes expire quickly (~1 minute). Enter promptly on phone.
- Ensure the phone shows “Link with phone number instead”; update WhatsApp if missing.

### 7) Test Steps
- Run bot; when prompted, enter full E.164 number.
- Receive pairing code in console.
- On phone: Linked Devices → Link with phone number → enter code.
- Observe forced disconnect, then auto reconnect; console prints “Connected Successfully”.

### 8) Changes Scope
- Only adjust pairing code flow and connection handling in `index.js`.
- No feature changes; ignore previous commands. Maintain existing command registry unchanged.

### 9) Acceptance Criteria
- Pairing code consistently links device when entered on phone.
- Credentials persist and reconnect succeeds without errors.
- No “Connection Closed/428” when requesting code in correct state.
- No “Bad MAC” due to version mismatch.

Confirm to proceed and I will implement the edits in `index.js`, wire `fetchLatestBaileysVersion`, place the request inside `connection.update`, add `printQRInTerminal: false`, ensure `creds.update` persistence, and verify end-to-end with logs.