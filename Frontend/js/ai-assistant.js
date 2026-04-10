// AI Assistant Functionality Script
// Fix and enhance clickables and chat history

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// DOM Elements
const sidebar = $("#sidebar");
const sidebarMobile = $("#sidebarMobile");
const mobileOverlay = $("#mobileOverlay");
const btnOpenSidebarMobile = $("#btnOpenSidebarMobile");
const btnCloseSidebarMobile = $("#btnCloseSidebarMobile");
const btnNewChat = $("#btnNewChat");
const btnNewChatMobile = $("#btnNewChatMobile");
const btnTempChat = $("#btnTempChat");
const btnTempChatMobile = $("#btnTempChatMobile");
const tempChatInlineToggle = $("#tempChatInlineToggle");
const tempHeaderPill = $("#tempHeaderPill");
const tempLabelBadge = $("#tempLabelBadge");
const btnClearContext = $("#btnClearContext");
const personaSelect = $("#personaSelect");
const emptyState = $("#emptyState");
const messagesEl = $("#messages");
const chatFeed = $("#chatFeed");
const textarea = $("#chatInput");
const btnSend = $("#btnSend");
const contextBadge = $("#contextBadge");
const badgeText = $("#badgeText");

const THEME_KEY = "acadly-ai-theme";
const CHAT_HISTORY_KEY = "acadly-chat-history";

// State Management
const state = {
  temporaryChat: false,
  persona: "socratic",
  messages: [],
  currentChatId: null,
  chatHistory: []
};

// Initialize
function init() {
  loadChatHistory();
  setupEventListeners();
  syncThemeToggleUI();
  loadLastChat();
}

// ==================== THEME TOGGLE ====================
function syncThemeToggleUI() {
  const isDark = document.documentElement.classList.contains("dark");
  const groups = [
    { sun: "themeIconSun", moon: "themeIconMoon", label: "themeLabel" },
    { sun: "themeIconSunSidebar", moon: "themeIconMoonSidebar", label: "themeLabelSidebar" },
    { sun: "themeIconSunSidebarMobile", moon: "themeIconMoonSidebarMobile", label: null },
  ];
  for (const g of groups) {
    const sun = document.getElementById(g.sun);
    const moon = document.getElementById(g.moon);
    const label = g.label ? document.getElementById(g.label) : null;
    if (sun) sun.classList.toggle("hidden", isDark);
    if (moon) moon.classList.toggle("hidden", !isDark);
    if (label) label.textContent = isDark ? "Dark" : "Light";
  }
}

function toggleColorTheme() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  try {
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  } catch {}
  syncThemeToggleUI();
}

// ==================== CHAT HISTORY ====================
function genId() {
  return "chat_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function loadChatHistory() {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    state.chatHistory = stored ? JSON.parse(stored) : [];
  } catch {
    state.chatHistory = [];
  }
}

function saveChatHistory() {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(state.chatHistory));
  } catch {}
}

function addChatToHistory(title, messages) {
  const chat = {
    id: genId(),
    title: title || "New Chat",
    messages: messages,
    timestamp: Date.now(),
    temporary: state.temporaryChat
  };
  
  if (!state.temporaryChat) {
    state.chatHistory.unshift(chat);
    saveChatHistory();
    renderChatHistory();
  }
  
  return chat.id;
}

function renderChatHistory() {
  const chats = state.chatHistory.slice(0, 10); // Show last 10 chats
  const chatItemsContainer = $$(".chat-item");
  
  chatItemsContainer.forEach(item => {
    item.style.display = "none";
  });

  chats.forEach(chat => {
    const btn = document.createElement("button");
    btn.className = "chat-item w-full truncate rounded-xl border border-transparent bg-transparent px-3 py-2 text-left text-sm text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/5 dark:hover:text-white";
    btn.textContent = chat.title;
    btn.title = chat.title;
    btn.addEventListener("click", () => loadChat(chat.id));
    
    if ($$(".chat-item").length > 0) {
      $$(".chat-item")[0].parentNode.appendChild(btn);
    }
  });
}

function loadChat(chatId) {
  const chat = state.chatHistory.find(c => c.id === chatId);
  if (chat) {
    state.currentChatId = chatId;
    state.messages = chat.messages;
    renderMessages();
    scrollToBottom();
  }
}

function loadLastChat() {
  if (state.chatHistory.length > 0) {
    loadChat(state.chatHistory[0].id);
  }
}

// ==================== MESSAGE RENDERING ====================
function scrollToBottom() {
  setTimeout(() => {
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }, 100);
}

function autoResizeTextarea() {
  textarea.style.height = "auto";
  const maxPx = 240;
  const next = Math.min(textarea.scrollHeight, maxPx);
  textarea.style.height = next + "px";
  textarea.style.overflowY = textarea.scrollHeight > maxPx ? "auto" : "hidden";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addUserMessage(text) {
  const msg = {
    id: genId(),
    role: "user",
    text: text,
    timestamp: Date.now()
  };
  state.messages.push(msg);
  renderMessages();
  scrollToBottom();
  return msg.id;
}

function addAiMessage(text) {
  const msg = {
    id: genId(),
    role: "assistant",
    text: text,
    timestamp: Date.now()
  };
  state.messages.push(msg);
  renderMessages();
  scrollToBottom();
  return msg.id;
}

function renderMessages() {
  messagesEl.innerHTML = state.messages.map(msg => {
    const isUser = msg.role === "user";
    return `
      <div class="flex ${isUser ? "justify-end" : "justify-start"}">
        <div class="max-w-xl rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-cyan-600/80 text-white"
            : "bg-slate-700/50 text-slate-100"
        }">
          <p class="text-sm leading-relaxed">${escapeHtml(msg.text)}</p>
          <p class="mt-1 text-xs opacity-70">${new Date(msg.timestamp).toLocaleTimeString()}</p>
        </div>
      </div>
    `;
  }).join("");
  
  if (state.messages.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }
}

// ==================== CHAT ACTIONS ====================
function setThemeTemporary(next) {
  state.temporaryChat = next;
  document.documentElement.dataset.accentTheme = next ? "amber" : "purple";

  if (tempHeaderPill) tempHeaderPill.classList.toggle("hidden", !next);
  if (tempLabelBadge) tempLabelBadge.classList.toggle("hidden", !next);

  if (next) {
    badgeText.textContent = "Temporary Chat - History Paused";
    textarea.placeholder = "Temporary Chat - History Paused";
  } else {
    badgeText.textContent = "Current Context: Advanced JavaScript (Module 3)";
    textarea.placeholder = "Ask AcadLy anything...";
  }
}

function newChat() {
  state.messages = [];
  state.currentChatId = null;
  state.temporaryChat = false;
  renderMessages();
  textarea.value = "";
  textarea.style.height = "auto";
  closeMobileSidebar();
}

function clearContext() {
  if (confirm("Clear all messages? This cannot be undone.")) {
    state.messages = [];
    state.currentChatId = null;
    renderMessages();
    scrollToBottom();
  }
}

function openMobileSidebar() {
  sidebarMobile.style.transform = "translateX(0)";
  mobileOverlay.classList.remove("hidden");
  mobileOverlay.classList.add("block");
}

function closeMobileSidebar() {
  sidebarMobile.style.transform = "translateX(-110%)";
  mobileOverlay.classList.add("hidden");
  mobileOverlay.classList.remove("block");
}

// ==================== INPUT & SEND ====================
function sendMessage() {
  const text = textarea.value.trim();
  if (!text) return;

  addUserMessage(text);
  textarea.value = "";
  textarea.style.height = "auto";

  // Simulate AI response
  setTimeout(() => {
    const responses = [
      "That's a great question! Let me break it down for you...",
      "Interesting point. Here's what I think about this...",
      "I can help you with that. Let me provide some insights...",
      "Good observation! Here's my perspective...",
      "That's exactly what we should focus on. Let me elaborate..."
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    addAiMessage(response);
    
    // Save to chat history if not temporary
    if (state.messages.length === 2 && !state.temporaryChat && !state.currentChatId) {
      const title = text.substring(0, 50) + (text.length > 50 ? "..." : "");
      state.currentChatId = addChatToHistory(title, state.messages);
    }
  }, 800);
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Theme toggle
  document.getElementById("themeToggle")?.addEventListener("click", toggleColorTheme);
  document.getElementById("themeToggleSidebar")?.addEventListener("click", toggleColorTheme);
  document.getElementById("themeToggleSidebarMobile")?.addEventListener("click", toggleColorTheme);

  // Mobile sidebar
  btnOpenSidebarMobile?.addEventListener("click", openMobileSidebar);
  btnCloseSidebarMobile?.addEventListener("click", closeMobileSidebar);
  mobileOverlay?.addEventListener("click", closeMobileSidebar);

  // New chat
  btnNewChat?.addEventListener("click", newChat);
  btnNewChatMobile?.addEventListener("click", () => {
    newChat();
    closeMobileSidebar();
  });

  // Temporary chat
  btnTempChat?.addEventListener("click", () => setThemeTemporary(!state.temporaryChat));
  btnTempChatMobile?.addEventListener("click", () => setThemeTemporary(!state.temporaryChat));
  tempChatInlineToggle?.addEventListener("click", () => setThemeTemporary(!state.temporaryChat));

  // Clear context
  btnClearContext?.addEventListener("click", clearContext);

  // Chat input
  textarea?.addEventListener("input", autoResizeTextarea);
  textarea?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Send button
  btnSend?.addEventListener("click", sendMessage);

  // Wait for chat items to load, then make them clickable
  setTimeout(() => {
    $$(".chat-item").forEach(item => {
      item.addEventListener("click", () => {
        const title = item.textContent;
        const chat = state.chatHistory.find(c => c.title === title);
        if (chat) {
          loadChat(chat.id);
        }
      });
    });
  }, 500);

  // Suggestion cards
  $$(".suggest-card").forEach(card => {
    card.addEventListener("click", () => {
      const text = card.dataset.suggest;
      if (text) {
        textarea.value = text;
        autoResizeTextarea();
        sendMessage();
      }
    });
  });

  // Persona select
  personaSelect?.addEventListener("change", (e) => {
    state.persona = e.target.value;
  });

  // Action buttons (placeholder functionality)
  document.getElementById("btnAttach")?.addEventListener("click", () => {
    alert("File attachment coming soon!");
  });

  document.getElementById("btnImage")?.addEventListener("click", () => {
    alert("Image upload coming soon!");
  });

  document.getElementById("btnMic")?.addEventListener("click", () => {
    alert("Voice input coming soon!");
  });
}

// Start the app
init();

// Export for use
window.AcadlyAI = { state, newChat, sendMessage, clearContext, loadChat };
