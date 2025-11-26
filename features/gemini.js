const fs = require('fs')
const path = require('path')
const { GoogleGenAI } = require('@google/genai')

const dbDir = path.join(__dirname, '..', 'database')
const file = path.join(dbDir, 'gemini.json')

try { if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true }) } catch {}
try { if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({}), 'utf8') } catch {}

function loadDB() {
  try { return JSON.parse(fs.readFileSync(file, 'utf8') || '{}') } catch { return {} }
}

function saveDB(db) { try { fs.writeFileSync(file, JSON.stringify(db, null, 2), 'utf8') } catch {} }

function enableChat(jid) { const db = loadDB(); db[jid] = { enabled: true }; saveDB(db) }
function disableChat(jid) { const db = loadDB(); if (db[jid]) delete db[jid]; saveDB(db) }
function isChatEnabled(jid) { return process.env.GEMINI_ENABLED === 'true' }

const chatSessions = new Map()
let ai = null

function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return false
  ai = new GoogleGenAI({ apiKey })
  return true
}

async function sendMessage(jid, prompt) {
  if (!ai) { if (!initializeGemini()) return '❌ Gemini API Key not set. Use `.setvar gemini YOUR_API_KEY` to set it.' }
  let chat = chatSessions.get(jid)
  if (!chat) {
    chat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: 'You are a helpful WhatsApp chatbot. Keep responses concise and relevant.' } })
    chatSessions.set(jid, chat)
  }
  try {
    const response = await chat.sendMessage({ message: prompt })
    return response.text
  } catch (e) {
    chatSessions.delete(jid)
    return '⚠️ Error communicating with Gemini. Chat session cleared. Try again.'
  }
}

function clearChatHistory(jid) { return chatSessions.delete(jid) }

module.exports = { initializeGemini, enableChat, disableChat, isChatEnabled, sendMessage, clearChatHistory }