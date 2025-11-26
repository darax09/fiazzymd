## Overview
- Add full welcome/bye message sending logic and use Baileys `group-participants.update` correctly
- Keep per‑group toggle persisted in `database/welcome.json`
- Restrict `.welcome on/off` to bot owner and group admins only

## Current Gaps
- Event listener exists but is inline and not modular
- No dedicated functions for composing/sending welcome/bye messages
- No explicit admin/owner checks at command layer in the sending functions

## Implementation Plan
### 1) Feature Module Enhancements
- Extend `features/welcome.js` with:
  - `sendWelcomeMessage(sock, groupJid, userJid)`
  - `sendGoodbyeMessage(sock, groupJid, userJid)`
- Logic:
  - Fetch profile photo via `sock.profilePictureUrl(userJid, 'image')` with safe fallback URL
  - Build captions using your provided template (mentions include the user)
  - Send `image` message with caption for welcome; send `text` for goodbye

### 2) Wire Up in Main Bot
- Import new functions in `index.js`:
  - `const { enableWelcome, disableWelcome, isWelcomeEnabled, sendWelcomeMessage, sendGoodbyeMessage } = require('./features/welcome')`
- Replace current inline welcome handler with:
  - `sock.ev.on('group-participants.update', async ({ id, participants, action }) => { if (!isWelcomeEnabled(id)) return; if (action === 'add') { for (const u of participants) await sendWelcomeMessage(sock, id, u); } else if (action === 'remove' || action === 'leave') { for (const u of participants) await sendGoodbyeMessage(sock, id, u); } })`

### 3) Permissions & Scope
- Ensure `.welcome` is in group‑admin commands and group‑only commands
- Command enforcement continues via `Permissions.canRunCommand` (owner bypass; admins in group)
- The auto‑welcome runs only where `isWelcomeEnabled(groupJid)` returns true (activated group)

### 4) Message Content (Per Your Spec)
- Welcome caption:
  - "Welcome to the Group, @user 👋\n\nThank you for joining us. To get started:\n\nRead the community guidelines 📜\n\nIntroduce yourself briefly 🗣️\n\nWe hope you find value here.\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬ Powered by Fiazzy-MD"
- Goodbye text:
  - "👋 See ya, bye @user"
- Mentions always include `userJid` and `@user` formatting uses `userJid.split('@')[0]`

### 5) Robustness & Edge Cases
- Handle missing profile pictures with fallback
- Ignore non‑`add`/`remove` actions (e.g., promote/demote)
- Guard against empty `participants` arrays

### 6) Validation Steps
- Manual test sequence:
  - In a test group, run `.welcome on` (as owner/admin)
  - Add a test number → expect welcome with image and mention
  - Remove the number → expect goodbye text
- Confirm no messages are sent in groups where `.welcome off` (or never enabled)

### 7) Non‑Breaking Changes
- Keep existing `.welcome on/off` commands and persistence in `database/welcome.json`
- Menu label stays “(owner/admin only)”

## Result
- Welcome system becomes modular, reliable, and easy to maintain
- Owner/admin control enforced; runs only in activated groups
- Message content exactly matches your specification