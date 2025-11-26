## Bug Fix (Participants Format)
- Update `features/welcome.js` to accept both string JIDs and participant objects
- Derive a safe `userId` with:
  - `const userId = typeof userJid === 'string' ? userJid : (userJid?.id || userJid?.jid || '')`
- Use `userId` for `split('@')`, mentions, and `profilePictureUrl`

## Robust Sending Functions
- `sendWelcomeMessage(sock, groupJid, userJid)`:
  - Resolve `userId` as above
  - Fetch group subject via `sock.groupMetadata(groupJid)` for token replacement
  - Load message from DB via `getWelcomeMessage(groupJid)` (or default)
  - Replace tokens:
    - `@user` → `@<number>` with `mentions: [userId]`
    - `{group}` → group subject
  - Send image banner with caption
- `sendGoodbyeMessage(sock, groupJid, userJid)` similarly resolves `userId` and sends text

## Add `.welcome set` Command
- Extend `features/welcome.js`:
  - `setWelcomeMessage(jid, text)` to persist a custom message
  - `getWelcomeMessage(jid)` to read back (default when missing)
- In `index.js` `welcome` command:
  - `.welcome set <message>` stores the message for the current group (owner/admin only)
  - Responds with a confirmation and brief preview

## Default Template
- Use your existing default:
  - “Welcome to the Group, @user 👋 … Powered by Fiazzy-MD”
- Support `{group}` token to inject group name

## Validation
- Reproduce the error path and confirm `userJid` object/string both work
- Test `.welcome set Welcome to {group}, @user 👋` and member addition/removal
- Confirm only enabled groups receive welcome/bye messages