import { authStore } from "../features/auth/storage/authStore.js";
import { friendStore } from "../features/friends/storage/friendStore.js";
import { chatStore } from "../features/chat/storage/chatStore.js";
import { crewStore } from "../features/crews/storage/crewStore.js";
import { presenceStore } from "../features/presence/storage/presenceStore.js";
import { gameStore } from "../features/games/storage/gameStore.js";
import { fileStore } from "../features/drive/storage/fileStore.js";
import { eventStore } from "../features/calendar/storage/eventStore.js";
import { postStore } from "../features/community/storage/postStore.js";
import { notificationStore } from "../features/notifications/storage/notificationStore.js";
import { localStorageAdapter } from "../shared/storage/LocalStorageAdapter.js";
import { indexedDBAdapter } from "../shared/storage/IndexedDBAdapter.js";
import { downloadText, formatBytes, formatDateTime, formatTime, includesText, todayKey } from "../shared/utils/format.js";

const views = {
  login: document.getElementById("view-login"),
  main: document.getElementById("view-main")
};

const pageNames = ["home", "friends", "chat", "crews", "games", "drive", "calendar", "community", "search", "settings"];
const pages = Object.fromEntries(pageNames.map(name => [name, document.getElementById(`page-${name}`)]));

const els = {
  loginName: document.getElementById("login-name"),
  loginColor: document.getElementById("login-color"),
  createAccount: document.getElementById("btn-create-account"),
  login: document.getElementById("btn-login"),
  logout: document.getElementById("btn-logout"),
  avatar: document.getElementById("player-avatar"),
  playerName: document.getElementById("player-name"),
  playerStatus: document.getElementById("player-status"),
  fileInput: document.getElementById("hidden-file-input"),
  importInput: document.getElementById("hidden-import-input")
};

const selected = {
  page: "home",
  chatId: "",
  crewId: "",
  channelId: "",
  folderId: "root",
  board: "전체",
  search: ""
};

const statusLabels = {
  online: "온라인",
  away: "자리비움",
  dnd: "방해금지",
  offline: "오프라인"
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[char]);
}

function currentUser() {
  return authStore.current();
}

function showView(name) {
  Object.values(views).forEach(view => view.classList.remove("active"));
  views[name]?.classList.add("active");
}

function showPage(name) {
  selected.page = name;
  Object.values(pages).forEach(page => page.classList.remove("active"));
  pages[name].classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(button => button.classList.toggle("active", button.dataset.page === name));
  render();
}

function toast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const node = document.createElement("div");
  node.className = `toast ${type}`;
  node.textContent = message;
  container.appendChild(node);
  setTimeout(() => {
    node.classList.add("fade-out");
    setTimeout(() => node.remove(), 250);
  }, 2600);
}

function setUserPanel() {
  const user = currentUser();
  if (!user) return;
  const presence = presenceStore.get(user.id);
  const currentGame = gameStore.list().find(game => game.id === presence.currentGameId);
  els.avatar.style.background = user.avatarColor;
  els.avatar.textContent = user.nickname.slice(0, 2).toUpperCase();
  els.playerName.textContent = user.nickname;
  els.playerStatus.textContent = [statusLabels[presence.status] || presence.status, presence.customMessage, currentGame ? `플레이 중: ${currentGame.name}` : ""].filter(Boolean).join(" · ");
}

function renderEmpty(text) {
  return `<div class="file-list-empty">${escapeHtml(text)}</div>`;
}

function statusPill(status) {
  return `<span class="status-pill ${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</span>`;
}

function ensureStarterData(user) {
  if (!friendStore.list().length) {
    friendStore.add({ nickname: "초대된 친구", avatarColor: "#8fbf8b", status: "online" });
  }
  if (!gameStore.list().length) {
    const game = gameStore.add({ name: "Minecraft", icon: "▶", launchUrl: "https://minecraft.net", steamUrl: "" });
    gameStore.togglePin(game.id);
  }
  if (!crewStore.list().length) {
    crewStore.create({ name: "ZapCrew", ownerId: user.id, ownerName: user.nickname });
  }
  if (!chatStore.list().length) {
    const friend = friendStore.list()[0];
    const conversation = chatStore.create({ type: "dm", name: friend.nickname, participantIds: [friend.id], participantNames: [friend.nickname] });
    chatStore.send(conversation.id, { authorId: friend.id, authorName: friend.nickname, text: "ZapCrew에 온 걸 환영해. 여기서 DM, 크루, 일정, 파일을 전부 로컬로 테스트할 수 있어." });
  }
}

function bootSession() {
  const user = currentUser();
  if (!user) {
    showView("login");
    return;
  }
  ensureStarterData(user);
  showView("main");
  setUserPanel();
  showPage(selected.page);
}

function renderHome() {
  const user = currentUser();
  const chats = chatStore.list();
  const friends = friendStore.list();
  const games = gameStore.list();
  const drive = fileStore.list();
  const events = eventStore.list();
  const posts = postStore.list();
  const presence = presenceStore.get(user.id);
  const today = todayKey();
  const currentGame = games.find(game => game.id === presence.currentGameId);

  pages.home.innerHTML = `
    <div class="play-section">
      <div class="server-title">
        <h2>ZapCrew</h2>
        <p>${escapeHtml(user.nickname)}님의 로컬 커뮤니티 허브</p>
      </div>
      <div class="setup-box">
        <div class="server-card">
          <div class="avatar" style="background:${escapeHtml(user.avatarColor)}">${escapeHtml(user.nickname.slice(0, 2).toUpperCase())}</div>
          <div class="server-main">
            <span class="server-card-name">${escapeHtml(statusLabels[presence.status] || presence.status)} ${currentGame ? `· ${escapeHtml(currentGame.name)} 플레이 중` : ""}</span>
            <span class="server-motd">${escapeHtml(presence.customMessage || "상태 메시지가 없습니다.")}</span>
          </div>
          <span class="server-badge">LOCAL</span>
        </div>
      </div>
      <div class="dashboard-grid">
        ${dashboardBlock("최근 채팅", chats.flatMap(chat => chat.messages.map(message => ({ ...message, chatName: chat.name }))).slice(-5).reverse().map(message => `${message.chatName}: ${message.text}`))}
        ${dashboardBlock("온라인 친구", friends.filter(friend => friend.status === "online").map(friend => `${friend.nickname}${friend.currentGame ? ` · ${friend.currentGame}` : ""}`))}
        ${dashboardBlock("오늘 일정", events.filter(event => event.startsAt.slice(0, 10) === today).map(event => `${formatTime(event.startsAt)} ${event.title}`))}
        ${dashboardBlock("최근 파일", drive.files.slice(-5).reverse().map(file => `${file.name} · ${formatBytes(file.size)}`))}
        ${dashboardBlock("최근 공지", posts.filter(post => post.board === "공지").slice(0, 5).map(post => post.title))}
        ${dashboardBlock("고정 게임", games.filter(game => game.pinned).map(game => `${game.icon} ${game.name}`))}
      </div>
    </div>
  `;
}

function dashboardBlock(title, rows) {
  return `
    <div class="settings-section">
      <div class="settings-section-title">${escapeHtml(title)}</div>
      <div class="file-list">${rows.length ? rows.map(row => `<div class="file-item"><span class="file-item-name">${escapeHtml(row)}</span></div>`).join("") : renderEmpty("표시할 항목이 없습니다.")}</div>
    </div>
  `;
}

function renderFriends() {
  const friends = friendStore.list();
  pages.friends.innerHTML = `
    <div class="page-header">
      <h2>친구</h2>
      <span class="readonly-pill">${friends.length}명</span>
    </div>
    <form class="inline-form" id="friend-form">
      <input class="input" name="nickname" placeholder="닉네임">
      <select class="select" name="status">
        <option value="online">온라인</option>
        <option value="away">자리비움</option>
        <option value="dnd">방해금지</option>
        <option value="offline">오프라인</option>
      </select>
      <input class="input input-color" name="avatarColor" type="color" value="#8fbf8b">
      <button class="btn btn-primary">추가</button>
    </form>
    <input class="input wide" id="friend-query" placeholder="친구 검색" value="">
    <div class="file-section">
      <div class="file-section-label">friends</div>
      <div class="file-list" id="friend-list">
        ${friends.length ? friends.map(friend => `
          <div class="file-item" data-friend-row="${friend.id}">
            <div class="avatar" style="background:${escapeHtml(friend.avatarColor)}">${escapeHtml(friend.nickname.slice(0, 2).toUpperCase())}</div>
            <div class="server-main">
              <span class="server-card-name">${escapeHtml(friend.nickname)}</span>
              <span class="server-motd">${escapeHtml(friend.customMessage || friend.currentGame || "상태 메시지 없음")}</span>
            </div>
            ${statusPill(friend.status)}
            <button class="btn btn-outline" data-friend-dm="${friend.id}">DM</button>
            <button class="btn btn-danger" data-friend-remove="${friend.id}">삭제</button>
          </div>
        `).join("") : renderEmpty("아직 친구가 없습니다.")}
      </div>
    </div>
  `;
}

function renderChat() {
  const user = currentUser();
  const friends = friendStore.list();
  const chats = chatStore.list();
  if (!selected.chatId && chats[0]) selected.chatId = chats[0].id;
  const active = chats.find(chat => chat.id === selected.chatId);
  pages.chat.innerHTML = `
    <div class="page-header">
      <h2>DM</h2>
      <div class="page-header-actions">
        <button class="btn btn-outline" id="btn-new-group">단체 DM</button>
      </div>
    </div>
    <div class="chat-layout">
      <div class="settings-section list-pane">
        <div class="settings-section-title">conversations</div>
        <div class="file-list">
          ${chats.length ? chats.map(chat => `
            <button class="nav-btn ${chat.id === selected.chatId ? "active" : ""}" data-chat-select="${chat.id}">${escapeHtml(chat.name)} <span class="file-item-meta">${chat.messages.length}</span></button>
          `).join("") : renderEmpty("대화가 없습니다.")}
        </div>
      </div>
      <div class="settings-section message-pane">
        <div class="settings-section-title">${escapeHtml(active?.name || "대화 선택")}</div>
        <div class="message-list">
          ${active ? active.messages.map(message => renderMessage(message, active.id)).join("") : renderEmpty("왼쪽에서 대화를 선택하세요.")}
        </div>
        ${active ? `
          <form class="composer" id="chat-form">
            <input class="input wide" name="text" placeholder="메시지">
            <input class="input" name="attachmentName" placeholder="첨부명">
            <button class="btn btn-primary">전송</button>
          </form>
        ` : ""}
      </div>
      <div class="settings-section member-pane">
        <div class="settings-section-title">quick dm</div>
        <div class="file-list">
          ${friends.map(friend => `<button class="btn btn-outline" data-friend-dm="${friend.id}">${escapeHtml(friend.nickname)}</button>`).join("") || renderEmpty("친구 없음")}
        </div>
      </div>
    </div>
    <dialog id="group-dialog" class="panel">
      <form id="group-form">
        <div class="settings-group"><label>방 이름</label><input class="input wide" name="name"></div>
        <div class="settings-group"><label>참여자 이름(쉼표 구분)</label><input class="input wide" name="names"></div>
        <div class="row-actions"><button class="btn btn-primary">만들기</button><button class="btn btn-outline" type="button" id="close-group-dialog">닫기</button></div>
      </form>
    </dialog>
  `;
}

function renderMessage(message, conversationId) {
  const reactions = Object.entries(message.reactions || {}).map(([emoji, count]) => `<button class="reaction" data-chat-react="${conversationId}" data-message-id="${message.id}" data-emoji="${escapeHtml(emoji)}">${escapeHtml(emoji)} ${count}</button>`).join("");
  return `
    <div class="message">
      <div class="message-head"><b>${escapeHtml(message.authorName)}</b><span>${formatDateTime(message.createdAt)}</span></div>
      <div class="message-body">${escapeHtml(message.text)}${message.attachmentName ? `<br><span class="server-badge">첨부 ${escapeHtml(message.attachmentName)}</span>` : ""}</div>
      <div class="message-reactions">
        ${reactions}
        <button class="reaction" data-chat-react="${conversationId}" data-message-id="${message.id}" data-emoji="👍">👍</button>
        <button class="reaction" data-chat-react="${conversationId}" data-message-id="${message.id}" data-emoji="🔥">🔥</button>
        <button class="reaction" data-message-delete="${message.id}" data-conversation-id="${conversationId}">삭제</button>
      </div>
    </div>
  `;
}

function renderCrews() {
  const user = currentUser();
  const crews = crewStore.list();
  if (!selected.crewId && crews[0]) selected.crewId = crews[0].id;
  const crew = crews.find(item => item.id === selected.crewId);
  if (crew && !selected.channelId) selected.channelId = crew.channels[0]?.id || "";
  const channel = crew?.channels.find(item => item.id === selected.channelId) || crew?.channels[0];
  pages.crews.innerHTML = `
    <div class="page-header">
      <h2>크루</h2>
      <form class="inline-form" id="crew-form">
        <input class="input" name="name" placeholder="크루 이름">
        <button class="btn btn-primary">생성</button>
      </form>
    </div>
    <div class="crew-layout">
      <div class="settings-section list-pane">
        <div class="settings-section-title">crews</div>
        <div class="file-list">${crews.map(item => `<button class="nav-btn ${item.id === selected.crewId ? "active" : ""}" data-crew-select="${item.id}">${escapeHtml(item.name)}</button>`).join("") || renderEmpty("크루 없음")}</div>
        <div class="settings-section-title" style="margin-top:14px">channels</div>
        <div class="file-list">${crew ? crew.channels.map(item => `<button class="nav-btn ${item.id === channel?.id ? "active" : ""}" data-channel-select="${item.id}"># ${escapeHtml(item.name)}</button>`).join("") : renderEmpty("채널 없음")}</div>
        ${crew ? `<form class="inline-form" id="channel-form"><input class="input" name="name" placeholder="채널"><select class="select" name="type"><option value="text">텍스트</option><option value="notice">공지</option><option value="party">게임모집</option></select><button class="btn btn-outline">추가</button></form>` : ""}
      </div>
      <div class="settings-section message-pane">
        <div class="settings-section-title">${crew && channel ? `${escapeHtml(crew.name)} / #${escapeHtml(channel.name)}` : "크루 선택"}</div>
        <div class="message-list">${channel ? channel.messages.map(message => renderCrewMessage(message)).join("") || renderEmpty("채널 메시지가 없습니다.") : renderEmpty("채널을 선택하세요.")}</div>
        ${channel ? `<form class="composer" id="crew-message-form"><input class="input wide" name="text" placeholder="채널 메시지"><button class="btn btn-primary">전송</button></form>` : ""}
      </div>
      <div class="settings-section member-pane">
        <div class="settings-section-title">members</div>
        <div class="file-list">${crew ? crew.members.map(member => `<div class="file-item"><span class="file-item-name">${escapeHtml(member.nickname)}</span><span class="server-badge">${escapeHtml(member.role)}</span></div>`).join("") : ""}</div>
        <p class="readonly-note">역할 구조는 Owner/Admin/Member/Guest 기준으로 준비되어 있습니다.</p>
      </div>
    </div>
  `;
}

function renderCrewMessage(message) {
  return `<div class="message"><div class="message-head"><b>${escapeHtml(message.authorName)}</b><span>${formatDateTime(message.createdAt)}</span></div><div class="message-body">${escapeHtml(message.text)}</div></div>`;
}

function renderGames() {
  const user = currentUser();
  const games = gameStore.list();
  const presence = presenceStore.get(user.id);
  pages.games.innerHTML = `
    <div class="page-header"><h2>게임 허브</h2><span class="readonly-pill">URL 실행 준비</span></div>
    <form class="inline-form" id="game-form">
      <input class="input input-small" name="icon" placeholder="아이콘" value="▶">
      <input class="input" name="name" placeholder="게임 이름">
      <input class="input wide" name="launchUrl" placeholder="실행 URL 또는 Steam URL">
      <button class="btn btn-primary">등록</button>
    </form>
    <div class="grid">
      ${games.map(game => `
        <div class="settings-section">
          <div class="settings-section-title">${game.pinned ? "pinned game" : "game"}</div>
          <div class="server-card">
            <div class="avatar">${escapeHtml(game.icon)}</div>
            <div class="server-main">
              <span class="server-card-name">${escapeHtml(game.name)}</span>
              <span class="server-motd">${game.lastLaunchedAt ? `최근 실행 ${formatDateTime(game.lastLaunchedAt)}` : "아직 실행 기록 없음"}</span>
            </div>
            ${presence.currentGameId === game.id ? "<span class=\"server-badge\">PLAYING</span>" : ""}
          </div>
          <div class="row-actions" style="margin-top:10px">
            <button class="btn btn-primary" data-game-launch="${game.id}">열기</button>
            <button class="btn btn-outline" data-game-playing="${game.id}">플레이 중</button>
            <button class="btn btn-outline" data-game-pin="${game.id}">${game.pinned ? "고정해제" : "고정"}</button>
            <button class="btn btn-danger" data-game-remove="${game.id}">삭제</button>
          </div>
        </div>
      `).join("") || renderEmpty("등록된 게임이 없습니다.")}
    </div>
    <p class="readonly-note">웹/PWA에서는 exe 직접 실행과 프로세스 감지가 불가능하므로 URL 열기와 상태 설정까지만 담당합니다.</p>
  `;
}

function renderDrive() {
  const drive = fileStore.list();
  const folder = drive.folders.find(item => item.id === selected.folderId) || drive.folders[0];
  selected.folderId = folder?.id || "root";
  const files = drive.files.filter(file => file.folderId === selected.folderId);
  pages.drive.innerHTML = `
    <div class="page-header">
      <h2>드라이브</h2>
      <div class="page-header-actions">
        <button class="btn btn-outline" id="btn-upload-files">파일 업로드</button>
      </div>
    </div>
    <div class="drive-layout">
      <div class="settings-section">
        <div class="settings-section-title">folders</div>
        <form class="inline-form" id="folder-form"><input class="input" name="name" placeholder="폴더 이름"><button class="btn btn-outline">생성</button></form>
        <div class="file-list">${drive.folders.map(item => `<button class="nav-btn ${item.id === selected.folderId ? "active" : ""}" data-folder-select="${item.id}">${escapeHtml(item.name)}</button>`).join("")}</div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">${escapeHtml(folder?.name || "files")}</div>
        <div class="file-list">
          ${files.map(file => `
            <div class="file-item">
              <span class="file-item-name">${escapeHtml(file.name)}</span>
              <span class="file-item-meta">${escapeHtml(file.type)} · ${formatBytes(file.size)} · ${formatDateTime(file.uploadedAt)}</span>
              <button class="btn btn-outline" data-file-download="${file.id}">다운로드</button>
              <button class="btn btn-danger" data-file-delete="${file.id}">삭제</button>
            </div>
          `).join("") || renderEmpty("파일이 없습니다.")}
        </div>
      </div>
    </div>
  `;
}

function renderCalendar() {
  const events = eventStore.list().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  pages.calendar.innerHTML = `
    <div class="page-header"><h2>일정</h2><span class="readonly-pill">오늘 ${events.filter(event => event.startsAt.slice(0, 10) === todayKey()).length}</span></div>
    <form class="inline-form" id="event-form">
      <input class="input" name="title" placeholder="일정 이름">
      <input class="input" name="startsAt" type="datetime-local">
      <select class="select" name="scope"><option value="personal">개인</option><option value="crew">크루</option></select>
      <input class="input" name="crewName" placeholder="크루명">
      <button class="btn btn-primary">추가</button>
    </form>
    <div class="file-list">
      ${events.map(event => `
        <div class="file-item">
          <div class="server-main">
            <span class="server-card-name">${escapeHtml(event.title)}</span>
            <span class="server-motd">${formatDateTime(event.startsAt)} · ${escapeHtml(event.scope)} ${event.crewName ? `· ${escapeHtml(event.crewName)}` : ""}</span>
          </div>
          <span class="server-badge">${escapeHtml(event.response)}</span>
          <button class="btn btn-outline" data-event-response="${event.id}" data-response="참여">참여</button>
          <button class="btn btn-outline" data-event-response="${event.id}" data-response="불참">불참</button>
          <button class="btn btn-danger" data-event-delete="${event.id}">삭제</button>
        </div>
      `).join("") || renderEmpty("일정이 없습니다.")}
    </div>
  `;
}

function renderCommunity() {
  const posts = postStore.list().filter(post => selected.board === "전체" || post.board === selected.board);
  const boards = ["전체", "자유", "공지", "게임모집", "짤방", "질문"];
  pages.community.innerHTML = `
    <div class="page-header"><h2>커뮤니티</h2><span class="readonly-pill">${selected.board}</span></div>
    <div class="community-layout">
      <div class="settings-section">
        <div class="settings-section-title">boards</div>
        <div class="file-list">${boards.map(board => `<button class="nav-btn ${board === selected.board ? "active" : ""}" data-board-select="${board}">${board}</button>`).join("")}</div>
        <form id="post-form" style="margin-top:14px">
          <div class="settings-group"><label>게시판</label><select class="select wide" name="board">${boards.filter(board => board !== "전체").map(board => `<option>${board}</option>`).join("")}</select></div>
          <div class="settings-group"><label>제목</label><input class="input wide" name="title"></div>
          <div class="settings-group"><label>내용</label><textarea class="textarea" name="body"></textarea></div>
          <div class="settings-group"><label>투표 선택지(쉼표 구분)</label><input class="input wide" name="poll"></div>
          <button class="btn btn-primary">작성</button>
        </form>
      </div>
      <div class="file-list">
        ${posts.map(post => renderPost(post)).join("") || renderEmpty("게시글이 없습니다.")}
      </div>
    </div>
  `;
}

function renderPost(post) {
  return `
    <div class="file-item column">
      <div class="message-head"><span class="server-badge">${escapeHtml(post.board)}</span><span>${formatDateTime(post.createdAt)} · ${escapeHtml(post.authorName)}</span></div>
      <div class="post-title">${escapeHtml(post.title)}</div>
      <div class="message-body">${escapeHtml(post.body)}</div>
      ${post.poll ? `<div>${post.poll.map((option, index) => `<div class="poll-row"><span>${escapeHtml(option.text)} · ${option.votes}</span><button class="btn btn-outline" data-post-vote="${post.id}" data-option-index="${index}">투표</button></div>`).join("")}</div>` : ""}
      <div class="message-reactions">
        <button class="reaction" data-post-like="${post.id}">좋아요 ${post.likes}</button>
        <button class="reaction" data-post-react="${post.id}" data-emoji="👍">👍 ${post.reactions["👍"] || 0}</button>
        <button class="reaction" data-post-react="${post.id}" data-emoji="🔥">🔥 ${post.reactions["🔥"] || 0}</button>
        <button class="reaction" data-post-delete="${post.id}">삭제</button>
      </div>
      <form class="composer" data-comment-form="${post.id}">
        <input class="input wide" name="body" placeholder="댓글">
        <button class="btn btn-outline">댓글</button>
      </form>
      <div class="file-list">${post.comments.map(comment => `<div class="file-item"><span class="file-item-name">${escapeHtml(comment.authorName)}: ${escapeHtml(comment.body)}</span><span class="file-item-meta">${formatTime(comment.createdAt)}</span></div>`).join("")}</div>
    </div>
  `;
}

function renderSearch() {
  const query = selected.search;
  const friends = friendStore.list().filter(item => includesText(item.nickname, query));
  const chats = chatStore.list().filter(chat => includesText(chat.name, query) || chat.messages.some(message => includesText(message.text, query)));
  const files = fileStore.list().files.filter(file => includesText(file.name, query) || includesText(file.type, query));
  const posts = postStore.list().filter(post => includesText(post.title, query) || includesText(post.body, query));
  const games = gameStore.list().filter(game => includesText(game.name, query));
  pages.search.innerHTML = `
    <div class="page-header"><h2>검색 / 빠른 이동</h2><span class="readonly-pill">Ctrl+K</span></div>
    <input class="input wide" id="global-search" placeholder="친구, 채팅, 파일, 게시글, 게임 검색" value="${escapeHtml(query)}" autofocus>
    <div class="grid" style="margin-top:12px">
      ${dashboardBlock("친구", friends.map(item => item.nickname))}
      ${dashboardBlock("채팅", chats.map(item => item.name))}
      ${dashboardBlock("파일", files.map(item => item.name))}
      ${dashboardBlock("게시글", posts.map(item => item.title))}
      ${dashboardBlock("게임", games.map(item => item.name))}
    </div>
  `;
}

function renderSettings() {
  const user = currentUser();
  const presence = presenceStore.get(user.id);
  pages.settings.innerHTML = `
    <div class="page-header"><h2>설정</h2><span class="readonly-pill">local-first</span></div>
    <div class="settings-section">
      <div class="settings-section-title">profile</div>
      <form id="profile-form">
        <div class="settings-group"><label>닉네임</label><input class="input" name="nickname" value="${escapeHtml(user.nickname)}"></div>
        <div class="settings-group"><label>아바타 색상</label><input class="input input-color" name="avatarColor" type="color" value="${escapeHtml(user.avatarColor)}"></div>
        <button class="btn btn-primary">저장</button>
      </form>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">presence</div>
      <form id="presence-form">
        <div class="settings-group"><label>상태</label><select class="select" name="status">${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${presence.status === value ? "selected" : ""}>${label}</option>`).join("")}</select></div>
        <div class="settings-group"><label>커스텀 상태</label><input class="input wide" name="customMessage" value="${escapeHtml(presence.customMessage || "")}"></div>
        <button class="btn btn-primary">저장</button>
      </form>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">data</div>
      <div class="row-actions">
        <button class="btn btn-outline" id="btn-export-data">JSON 내보내기</button>
        <button class="btn btn-outline" id="btn-import-data">JSON 가져오기</button>
        <button class="btn btn-danger" id="btn-reset-data">데이터 초기화</button>
      </div>
      <p class="readonly-note">파일 Blob은 IndexedDB에 저장됩니다. JSON 내보내기는 메타데이터와 앱 상태를 내보냅니다.</p>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">pwa</div>
      <p class="readonly-note">브라우저 메뉴의 앱 설치 또는 홈 화면에 추가를 사용하면 PWA로 실행할 수 있습니다. 오프라인 캐시는 service worker가 담당합니다.</p>
    </div>
  `;
}

function render() {
  setUserPanel();
  const map = {
    home: renderHome,
    friends: renderFriends,
    chat: renderChat,
    crews: renderCrews,
    games: renderGames,
    drive: renderDrive,
    calendar: renderCalendar,
    community: renderCommunity,
    search: renderSearch,
    settings: renderSettings
  };
  map[selected.page]?.();
}

function createOrLogin(createMode) {
  const nickname = els.loginName.value.trim();
  if (!nickname) {
    toast("닉네임을 입력하세요.", "error");
    return;
  }
  let user = null;
  if (createMode) user = authStore.createAccount({ nickname, avatarColor: els.loginColor.value });
  else user = authStore.login(nickname);
  if (!user) {
    toast("해당 닉네임의 로컬 계정이 없습니다.", "error");
    return;
  }
  presenceStore.set(user.id, { status: "online" });
  notificationStore.add(`${nickname} 로그인`);
  bootSession();
}

function createDmWithFriend(friendId) {
  const friend = friendStore.list().find(item => item.id === friendId);
  if (!friend) return;
  const existing = chatStore.list().find(chat => chat.type === "dm" && chat.participantIds.includes(friendId));
  const chat = existing || chatStore.create({ type: "dm", name: friend.nickname, participantIds: [friend.id], participantNames: [friend.nickname] });
  selected.chatId = chat.id;
  showPage("chat");
}

document.getElementById("nav").addEventListener("click", event => {
  const button = event.target.closest("[data-page]");
  if (button) showPage(button.dataset.page);
});

els.createAccount.addEventListener("click", () => createOrLogin(true));
els.login.addEventListener("click", () => createOrLogin(false));
els.loginName.addEventListener("keydown", event => {
  if (event.key === "Enter") createOrLogin(false);
});
els.logout.addEventListener("click", () => {
  authStore.logout();
  showView("login");
});

document.body.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.target;
  const user = currentUser();
  if (!user) return;
  const data = Object.fromEntries(new FormData(form).entries());

  if (form.id === "friend-form") {
    if (!data.nickname.trim()) return toast("친구 닉네임을 입력하세요.", "error");
    friendStore.add(data);
    toast("친구를 추가했습니다.", "success");
  }
  if (form.id === "chat-form") {
    if (!data.text.trim() && !data.attachmentName.trim()) return;
    chatStore.send(selected.chatId, { authorId: user.id, authorName: user.nickname, text: data.text.trim(), attachmentName: data.attachmentName.trim() });
  }
  if (form.id === "group-form") {
    const names = data.names.split(",").map(name => name.trim()).filter(Boolean);
    const chat = chatStore.create({ type: "group", name: data.name || "단체 DM", participantNames: names });
    selected.chatId = chat.id;
    document.getElementById("group-dialog")?.close();
  }
  if (form.id === "crew-form") {
    if (!data.name.trim()) return;
    const crew = crewStore.create({ name: data.name.trim(), ownerId: user.id, ownerName: user.nickname });
    selected.crewId = crew.id;
    selected.channelId = crew.channels[0].id;
  }
  if (form.id === "channel-form") {
    if (!data.name.trim()) return;
    const channel = crewStore.addChannel(selected.crewId, { name: data.name.trim(), type: data.type });
    selected.channelId = channel.id;
  }
  if (form.id === "crew-message-form") {
    if (!data.text.trim()) return;
    crewStore.send(selected.crewId, selected.channelId, { authorId: user.id, authorName: user.nickname, text: data.text.trim() });
  }
  if (form.id === "game-form") {
    if (!data.name.trim()) return;
    gameStore.add({ name: data.name.trim(), icon: data.icon || "▶", launchUrl: data.launchUrl.trim(), steamUrl: data.launchUrl.trim().includes("steampowered") ? data.launchUrl.trim() : "" });
  }
  if (form.id === "folder-form") {
    if (!data.name.trim()) return;
    const folder = fileStore.createFolder(data.name.trim());
    selected.folderId = folder.id;
  }
  if (form.id === "event-form") {
    if (!data.title.trim() || !data.startsAt) return;
    eventStore.add(data);
  }
  if (form.id === "post-form") {
    if (!data.title.trim()) return;
    postStore.add({ board: data.board, title: data.title.trim(), body: data.body.trim(), authorName: user.nickname, pollOptions: data.poll.split(",").map(item => item.trim()) });
  }
  if (form.id === "profile-form") {
    authStore.updateProfile({ nickname: data.nickname.trim() || user.nickname, avatarColor: data.avatarColor });
    toast("프로필을 저장했습니다.", "success");
  }
  if (form.id === "presence-form") {
    presenceStore.set(user.id, { status: data.status, customMessage: data.customMessage.trim() });
    toast("상태를 저장했습니다.", "success");
  }
  if (form.dataset.commentForm) {
    if (data.body.trim()) postStore.comment(form.dataset.commentForm, { authorName: user.nickname, body: data.body.trim() });
  }
  render();
});

document.body.addEventListener("click", async event => {
  const target = event.target.closest("button, [data-page]");
  if (!target) return;
  if (target.tagName === "BUTTON" && target.type === "submit" && target.closest("form")) return;
  const user = currentUser();

  if (target.dataset.friendRemove) friendStore.remove(target.dataset.friendRemove);
  if (target.dataset.friendDm) createDmWithFriend(target.dataset.friendDm);
  if (target.dataset.chatSelect) selected.chatId = target.dataset.chatSelect;
  if (target.dataset.chatReact) chatStore.react(target.dataset.chatReact, target.dataset.messageId, target.dataset.emoji);
  if (target.dataset.messageDelete) chatStore.deleteMessage(target.dataset.conversationId, target.dataset.messageDelete);
  if (target.id === "btn-new-group") {
    document.getElementById("group-dialog")?.showModal();
    return;
  }
  if (target.id === "close-group-dialog") {
    document.getElementById("group-dialog")?.close();
    return;
  }
  if (target.dataset.crewSelect) {
    selected.crewId = target.dataset.crewSelect;
    selected.channelId = "";
  }
  if (target.dataset.channelSelect) selected.channelId = target.dataset.channelSelect;
  if (target.dataset.gamePin) gameStore.togglePin(target.dataset.gamePin);
  if (target.dataset.gameRemove) gameStore.remove(target.dataset.gameRemove);
  if (target.dataset.gamePlaying && user) {
    presenceStore.set(user.id, { status: "online", currentGameId: target.dataset.gamePlaying });
    toast("현재 플레이 중 상태를 변경했습니다.", "success");
  }
  if (target.dataset.gameLaunch) {
    const game = gameStore.list().find(item => item.id === target.dataset.gameLaunch);
    if (game) {
      gameStore.markLaunched(game.id);
      if (user) presenceStore.set(user.id, { status: "online", currentGameId: game.id });
      if (game.launchUrl) window.open(game.launchUrl, "_blank", "noopener,noreferrer");
      else toast("실행 URL이 없습니다.", "error");
    }
  }
  if (target.id === "btn-upload-files") {
    els.fileInput.click();
    return;
  }
  if (target.dataset.folderSelect) selected.folderId = target.dataset.folderSelect;
  if (target.dataset.fileDownload) {
    const meta = fileStore.list().files.find(file => file.id === target.dataset.fileDownload);
    const blob = await fileStore.download(target.dataset.fileDownload);
    if (blob && meta) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = meta.name;
      link.click();
      URL.revokeObjectURL(url);
    }
    return;
  }
  if (target.dataset.fileDelete) await fileStore.remove(target.dataset.fileDelete);
  if (target.dataset.eventResponse) eventStore.respond(target.dataset.eventResponse, target.dataset.response);
  if (target.dataset.eventDelete) eventStore.remove(target.dataset.eventDelete);
  if (target.dataset.boardSelect) selected.board = target.dataset.boardSelect;
  if (target.dataset.postLike) postStore.like(target.dataset.postLike);
  if (target.dataset.postReact) postStore.react(target.dataset.postReact, target.dataset.emoji);
  if (target.dataset.postVote) postStore.vote(target.dataset.postVote, Number(target.dataset.optionIndex));
  if (target.dataset.postDelete) postStore.remove(target.dataset.postDelete);
  if (target.id === "btn-export-data") {
    downloadText(`zapcrew-export-${Date.now()}.json`, JSON.stringify(localStorageAdapter.exportAll(), null, 2));
    return;
  }
  if (target.id === "btn-import-data") {
    els.importInput.click();
    return;
  }
  if (target.id === "btn-reset-data" && confirm("모든 로컬 데이터를 삭제할까요?")) {
    localStorageAdapter.clearAll();
    await indexedDBAdapter.clear();
    location.reload();
    return;
  }
  render();
});

document.body.addEventListener("input", event => {
  if (event.target.id === "friend-query") {
    const query = event.target.value;
    document.querySelectorAll("[data-friend-row]").forEach(row => {
      row.style.display = includesText(row.textContent, query) ? "" : "none";
    });
  }
  if (event.target.id === "global-search") {
    selected.search = event.target.value;
    renderSearch();
    document.getElementById("global-search")?.focus();
  }
});

els.fileInput.addEventListener("change", async () => {
  if (!els.fileInput.files.length) return;
  await fileStore.addFiles([...els.fileInput.files], selected.folderId);
  els.fileInput.value = "";
  toast("파일을 저장했습니다.", "success");
  render();
});

els.importInput.addEventListener("change", async () => {
  const file = els.importInput.files[0];
  if (!file) return;
  try {
    localStorageAdapter.importAll(JSON.parse(await file.text()));
    toast("가져오기를 완료했습니다.", "success");
    bootSession();
  } catch {
    toast("JSON을 읽지 못했습니다.", "error");
  } finally {
    els.importInput.value = "";
  }
});

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    showPage("search");
    setTimeout(() => document.getElementById("global-search")?.focus(), 0);
  }
});

document.getElementById("btn-minimize").addEventListener("click", () => toast("웹에서는 창 최소화를 브라우저가 담당합니다."));
document.getElementById("btn-close").addEventListener("click", () => toast("브라우저 탭은 직접 닫아 주세요."));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

bootSession();
