## Goals
- Validate `.welcome set` templates and guide users with a correct format when invalid
- Add `help welcome set` output explaining purpose, placeholders, and examples

## Validation Rules
- Require `@user` placeholder (mandatory for mention)
- Optional `{group}` placeholder (replaced with group subject); if missing, allowed
- Allow text around placeholders (emojis, punctuation)
- Trim leading/trailing whitespace; disallow empty messages

## Feature Changes (features/welcome.js)
- Add `validateWelcomeTemplate(text)` → returns `{ valid: boolean, reason?: string }`
- Update `setWelcomeMessage(jid, text)` to call validation; if invalid, throw with reason
- Keep `getWelcomeMessage(jid)` default as your existing template

## Command Handler (index.js)
- In `welcome` command, for `set`:
  - Parse message text
  - Call `validateWelcomeTemplate`
  - If invalid: reply with reason and show sample:
    - `Correct format: .welcome set Welcome to {group}, @user 👋`
  - If valid: persist and confirm

## Help Command
- Extend `registerCommand('help')` to detect `help welcome set` and provide detailed docs:
  - What it does: sets per‑group welcome text
  - Placeholders:
    - `@user` → mandatory; mentions the joined user
    - `{group}` → optional; replaced with group name
  - Examples:
    - `.welcome set Welcome to {group}, @user 👋`
    - `.welcome set Hello @user — read the rules in the description`

## Messaging Behavior (No Change)
- Auto‑welcome continues to use `getWelcomeMessage(jid)` with token replacement and mentions
- Goodbye message unaffected

## Validation & Testing
- Try `.welcome set` with missing `@user` → bot responds with correction and sample
- Try valid `.welcome set` → saved; next join uses custom template
- Run `help welcome set` → shows detailed guidance and examples