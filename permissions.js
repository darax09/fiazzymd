module.exports = (config) => {
  const groupAdminCommands = new Set(['add', 'kick', 'promote', 'demote', 'mute', 'unmute', 'tag']);
  const groupOnlyCommands = new Set(['add', 'kick', 'promote', 'demote', 'mute', 'unmute', 'tag', 'tagall']);
  const generalCommands = new Set(['menu', 'ping', 'help', 'session', 'tagall', 'vv']);
  const varCommands = new Set(['autoviewonce']);

  const isGroup = (jid) => jid.endsWith('@g.us');

  const getSenderNumber = (msg) => {
    const part = msg.key.participant ? msg.key.participant.split('@')[0] : msg.key.remoteJid.split('@')[0];
    return part;
  };

  const isUserAdmin = async (sock, groupJid, userJid) => {
    try {
      const meta = await sock.groupMetadata(groupJid);
      const p = meta.participants.find((x) => x.id === userJid);
      return p?.admin === 'admin' || p?.admin === 'superadmin';
    } catch {
      return false;
    }
  };

  const canRunCommand = async (sock, msg, cmdName) => {
    const senderNumber = getSenderNumber(msg);
    const isOwner = senderNumber === config.ownerNumber;
    if (isOwner) return { allowed: true };

    if (varCommands.has(cmdName)) {
      return { allowed: false, reason: '❌ Only the bot owner can use this command!' };
    }

    if (config.botMode === 'private') {
      return { allowed: false, reason: '❌ This command is restricted to bot owner in private mode!' };
    }

    const inGroup = isGroup(msg.key.remoteJid);
    if (groupOnlyCommands.has(cmdName) && !inGroup) {
      return { allowed: false, reason: '❌ This command is only for groups!' };
    }

    if (groupAdminCommands.has(cmdName)) {
      const userJid = msg.key.participant;
      const isAdmin = await isUserAdmin(sock, msg.key.remoteJid, userJid);
      if (!isAdmin) return { allowed: false, reason: '❌ Only admins can use this command!' };
    }

    return { allowed: true };
  };

  return {
    groupAdminCommands,
    groupOnlyCommands,
    generalCommands,
    varCommands,
    isGroup,
    getSenderNumber,
    isUserAdmin,
    canRunCommand,
  };
};