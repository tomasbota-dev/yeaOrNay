const app = document.querySelector('#app');
const toastEl = document.querySelector('#toast');
const state = { user: null, room: null, rooms: [], authMode: 'login', commentOpen: new Set(), commentDrafts: {}, ideaDraft: { title: '', details: '' }, busy: false, poll: null, toastTimer: null };
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const initial = (name = '?') => Array.from(name.trim())[0]?.toUpperCase() || '?';
const dateLabel = value => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.error || 'Something went wrong. Try again.'); error.status = response.status; throw error; }
  return data;
};
function toast(message, error = false) { toastEl.textContent = message; toastEl.className = `toast show${error ? ' error' : ''}`; clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => toastEl.className = 'toast', 2600); }
function navigate(path) { history.pushState({}, '', path); state.room = null; state.ideaDraft = { title: '', details: '' }; renderRoute(); }
function getRoute() { const match = location.pathname.match(/^\/room\/([A-Z0-9]+)\/?$/i); return match ? { page: 'room', code: match[1].toUpperCase() } : { page: 'home' }; }
function topbar() { return `<header class="topbar"><a href="/" class="brand" data-action="home"><span class="brand-icon">✦</span> yea or nay</a><div class="top-actions">${state.user ? `<div class="user-chip"><span class="avatar">${esc(initial(state.user.name))}</span><span>${esc(state.user.name)}</span></div><button class="btn btn-ghost btn-small" data-action="logout">Log out</button>` : ''}</div></header>`; }
function footer() { return `<footer class="footer"><span>Made for making plans ✦</span><span>Small decisions, big memories.</span></footer>`; }
function authView() {
  const signUp = state.authMode === 'signup';
  return `<main class="auth-wrap"><section class="auth-art"><div><a class="brand" href="/"><span class="brand-icon">✦</span> yea or nay</a></div><div><h1>Better plans start with a little yes.</h1><p>Bring everyone into the decision. Then get to the fun part.</p></div><div class="orbit"></div><div class="auth-sticker">✷</div></section><section class="auth-box"><p class="eyebrow">${signUp ? 'Your next good plan starts here' : 'Welcome back'}</p><h2>${signUp ? 'Make an account' : 'Good to see you'}</h2><p>${signUp ? 'Get your people together and pick something fun.' : 'Your people and plans are waiting.'}</p><div class="auth-toggle"><button class="${!signUp ? 'active' : ''}" data-action="auth-mode" data-mode="login">Log in</button><button class="${signUp ? 'active' : ''}" data-action="auth-mode" data-mode="signup">Sign up</button></div><form id="auth-form"><div class="form-error" id="form-error"></div>${signUp ? `<div class="field"><label for="name">What should we call you?</label><input id="name" name="name" autocomplete="name" maxlength="40" placeholder="Your name" required /></div>` : ''}<div class="field"><label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required /></div><div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="${signUp ? 'new-password' : 'current-password'}" minlength="10" maxlength="128" placeholder="At least 10 characters" required /></div><button class="btn btn-primary btn-block" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? '<span class="spinner"></span>' : signUp ? 'Create my account <span>→</span>' : 'Log in <span>→</span>'}</button></form><div class="auth-foot">Your email is only used to sign in. This first version doesn’t send email or offer password reset.</div></section></main>`;
}
function roomCard(room, index) {
  const emojis = ['🎲', '🍜', '🌿', '🎬'];
  return `<article class="room-card" tabindex="0" role="link" data-action="open-room" data-code="${esc(room.code)}"><div class="room-card-top"><div class="room-emoji ${['', 'mint', 'sun', 'coral'][index % 4]}">${emojis[index % 4]}</div><span class="badge ${room.status === 'open' ? 'badge-open' : 'badge-closed'}">${room.status === 'open' ? '● DECIDING' : '✦ DECIDED'}</span></div><h2>${esc(room.name)}</h2><div class="room-meta"><span>👥 ${room.member_count} ${room.member_count === 1 ? 'person' : 'people'}</span><span>💡 ${room.idea_count} ${room.idea_count === 1 ? 'idea' : 'ideas'}</span></div><div class="room-card-foot"><span class="room-code">${esc(room.code)}</span><span class="room-go">${room.status === 'open' ? 'Jump in ↗' : 'See the result ↗'}</span></div></article>`;
}
function homeView() {
  return `${topbar()}<main class="page"><section class="welcome"><div><p class="eyebrow">Good plans, made together</p><h1>What are we doing?</h1><p>Get everyone’s ideas on the table. Let the group decide.</p></div><div class="actions"><button class="btn btn-light" data-action="join-modal">↗ Join a room</button><button class="btn btn-primary" data-action="create-modal">＋ Start a room</button></div></section><section class="rooms-grid">${state.rooms.length ? state.rooms.map(roomCard).join('') : `<div class="empty"><div class="empty-art">✷</div><h2>Your next good plan starts here.</h2><p>Start a room for your group or join with a code from a friend.</p><div class="actions" style="justify-content:center"><button class="btn btn-primary" data-action="create-modal">＋ Start a room</button><button class="btn btn-light" data-action="join-modal">Join with a code</button></div></div>`}</section></main>${footer()}`;
}
function roomView() {
  const room = state.room;
  if (!room) return `${topbar()}<main class="page"><div class="skeleton"></div></main>`;
  if (room.notMember) return `${topbar()}<main class="page"><button class="btn btn-ghost" data-action="home">← Your rooms</button><div class="empty" style="margin-top:22px"><div class="empty-art">👋</div><h2>You’ve got an invite!</h2><p>${esc(room.name)} is ready for you. Join the room to add ideas and cast your vote.</p><button class="btn btn-primary" data-action="join-room" data-code="${esc(room.code)}">Join this room →</button></div></main>${footer()}`;
  const canVote = room.status === 'open';
  const timeLeft = Math.max(0, Math.ceil((room.ends_at - Date.now()) / 1000));
  const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;
  const winner = room.winner_ids?.length ? room.ideas.filter(i => room.winner_ids.includes(i.id)) : [];
  const ideas = room.ideas.length ? room.ideas.map(idea => {
    const own = idea.author_id === state.user.id;
    const commentsOpen = state.commentOpen.has(idea.id);
    const comments = room.comments.filter(c => c.idea_id === idea.id);
    return `<article class="idea-card ${idea.winner ? 'winner' : ''}"><div class="vote-box"><button aria-label="Upvote ${esc(idea.title)}" class="${idea.my_vote === 1 ? 'selected' : ''}" data-action="vote" data-id="${esc(idea.id)}" data-value="1" ${!canVote || own ? 'disabled title="You can’t vote for your own idea"' : ''}>▲</button><span class="vote-count">${idea.score > 0 ? '+' : ''}${idea.score}</span><button aria-label="Downvote ${esc(idea.title)}" class="${idea.my_vote === -1 ? 'selected' : ''}" data-action="vote" data-id="${esc(idea.id)}" data-value="-1" ${!canVote || own ? 'disabled title="You can’t vote for your own idea"' : ''}>▼</button></div><div class="idea-card-body"><div class="idea-title">${esc(idea.title)}</div><div class="idea-by">by ${own ? 'you' : esc(idea.author_name)}</div>${idea.details ? `<div class="idea-details">${esc(idea.details)}</div>` : ''}${commentsOpen ? `<div class="comments">${comments.map(c => `<div class="comment-row"><b>${esc(c.author_name)}</b>${esc(c.body)}</div>`).join('') || '<div class="comment-row" style="color:#aaa">No comments yet. Say the first thing ✦</div>'}<form class="comment-form" data-comment-form="${esc(idea.id)}"><input name="body" maxlength="280" value="${esc(state.commentDrafts[idea.id] || '')}" placeholder="Add a comment…" required /><button>Send</button></form></div>` : ''}</div><div class="idea-actions">${idea.winner ? '<span class="winner-tag">✦ Winner</span>' : ''}<button class="comment-toggle" data-action="toggle-comments" data-id="${esc(idea.id)}">${commentsOpen ? 'Hide' : `💬 ${comments.length || ''}`}${comments.length === 0 && !commentsOpen ? ' Comment' : ''}</button></div></article>`;
  }).join('') : '<div class="empty" style="padding:35px 15px;background:transparent;border:0"><div class="empty-art">💭</div><h2>Start the idea pile!</h2><p>What sounds fun? Add the first suggestion below.</p></div>';
  return `${topbar()}<main class="page"><button class="btn btn-ghost" data-action="home">← Your rooms</button><section class="room-head"><div><p class="eyebrow">Room ${esc(room.code)}</p><h1>${esc(room.name)}</h1><p>Made by ${esc(room.host_name)} · Created ${dateLabel(room.created_at)}</p></div><div class="room-head-actions"><div class="room-code-pill">${esc(room.code)} <button class="btn btn-ghost btn-small" data-action="copy-code" data-code="${esc(room.code)}" aria-label="Copy room code">▣</button></div>${room.is_host && canVote ? '<button class="btn btn-light btn-small" data-action="end-room">End voting</button>' : ''}</div></section>${winner.length ? `<section class="winner-banner"><span class="trophy">🏆</span><div><b>${winner.length > 1 ? 'It’s a tie!' : 'The group has decided!'}</b><span>${winner.map(i => esc(i.title)).join(' · ')} ${winner.length > 1 ? 'share the win' : 'won the vote'}</span></div></section>` : ''}<section class="timer-bar ${canVote ? '' : 'timer-closed'}"><div class="timer-main"><div class="timer-icon">${canVote ? '⏱' : '✦'}</div><div><div class="timer-label">${canVote ? 'Time to decide' : 'Voting is closed'}</div><div class="timer-value" data-timer>${canVote ? `${mins}m ${String(secs).padStart(2, '0')}s` : winner.length ? 'The plan is picked!' : 'Room closed'}</div></div></div><div class="timer-helper">${canVote ? 'Cast your votes before time runs out' : winner.length ? 'Go make it happen!' : 'Thanks for deciding together'}</div></section><div class="room-layout"><section class="ideas-panel"><header class="panel-header"><span class="panel-title">The idea pile ✨</span><span class="count">${room.ideas.length} ${room.ideas.length === 1 ? 'idea' : 'ideas'}</span></header><div class="idea-list">${ideas}</div>${canVote ? `<form class="add-idea" id="idea-form"><div class="field"><input name="title" maxlength="100" value="${esc(state.ideaDraft.title)}" placeholder="Your idea in a few words…" aria-label="Your idea" required /></div><div class="add-idea-row"><div class="field" style="flex:1"><input name="details" maxlength="500" value="${esc(state.ideaDraft.details)}" placeholder="Add a little detail (optional)" aria-label="Idea details" /></div><button class="btn btn-primary btn-small" type="submit">＋ Add idea</button></div></form>` : ''}</section><aside class="side-column"><section class="side-panel"><header class="panel-header"><span class="panel-title">The group</span><span class="count">${room.members.length} here</span></header><div class="side-content">${room.members.map(m => `<div class="member-row"><span class="avatar">${esc(initial(m.name))}</span><span>${esc(m.name)}${m.id === state.user.id ? ' <small>(you)</small>' : ''}</span>${m.id === room.host_id ? '<small>host</small>' : ''}</div>`).join('')}</div></section><section class="side-panel"><div class="side-content"><p class="side-label">Bring your people in</p><div class="share-box"><p>Send this code to your group so they can join the decision.</p><div class="join-input"><input readonly value="${esc(room.code)}" aria-label="Room code" /><button class="btn btn-primary btn-small" data-action="copy-code" data-code="${esc(room.code)}">Copy</button></div></div></div></section></aside></div></main>${footer()}`;
}
function modal(content) { document.querySelector('.modal-backdrop')?.remove(); document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true">${content}</section></div>`); document.querySelector('.modal input')?.focus(); }
function closeModal() { document.querySelector('.modal-backdrop')?.remove(); }
function createModal() { modal(`<header class="modal-head"><h2>Start a room ✨</h2><button class="close-modal" data-action="close-modal" aria-label="Close">×</button></header><p style="font-size:13px;color:#85818f;margin:-7px 0 19px">Give your group a question to decide. You can add ideas once it’s open.</p><form id="create-form"><div class="field"><label for="room-name">What are we deciding?</label><input id="room-name" name="name" maxlength="70" placeholder="Friday night plans, anyone?" required /></div><div class="field"><label for="duration">How long should voting last?</label><select id="duration" name="duration"><option value="15">15 minutes · quick pick</option><option value="30" selected>30 minutes · just right</option><option value="60">1 hour · take your time</option><option value="180">3 hours</option><option value="1440">24 hours · decide tomorrow</option></select></div><div class="modal-actions"><button type="button" class="btn btn-light" data-action="close-modal">Maybe later</button><button class="btn btn-primary" type="submit">Open the room →</button></div></form>`); }
function joinModal() { modal(`<header class="modal-head"><h2>Join your people 👋</h2><button class="close-modal" data-action="close-modal" aria-label="Close">×</button></header><p style="font-size:13px;color:#85818f;margin:-7px 0 19px">Enter the room code your friend shared with you.</p><form id="join-form"><div class="field"><label for="join-code">Room code</label><input id="join-code" name="code" maxlength="8" placeholder="E.G. SUNNY7" autocomplete="off" style="text-transform:uppercase;letter-spacing:2px;font-weight:800" required /></div><div class="modal-actions"><button type="button" class="btn btn-light" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Join room →</button></div></form>`); }
function renderRoute() {
  clearInterval(state.poll);
  if (!state.user) { app.innerHTML = authView(); return; }
  const route = getRoute();
  if (route.page === 'room') {
    app.innerHTML = roomView();
    if (state.room && !state.room.notMember && state.room.status === 'open') state.poll = setInterval(refreshRoom, 5000);
  } else app.innerHTML = homeView();
}
async function loadHome() { try { state.rooms = (await api('/rooms')).rooms; renderRoute(); } catch (e) { toast(e.message, true); } }
async function refreshRoom(forceRender = false) {
  const route = getRoute();
  if (route.page !== 'room') return;
  try {
    state.room = await api(`/rooms/${encodeURIComponent(route.code)}`);
    const focus = document.activeElement;
    const typing = focus && (focus.matches('input,textarea') || focus.isContentEditable);
    if (forceRender || !typing) renderRoute();
  } catch (e) {
    if (e.status === 403) { state.room = { code: route.code, name: 'A group room', notMember: true }; renderRoute(); }
    else if (e.status === 404) { navigate('/'); toast('That room code has expired or doesn’t exist.', true); }
    else if (forceRender) toast(e.message, true);
  }
}
async function boot() {
  try { const result = await api('/me'); state.user = result.user; }
  catch { state.user = null; }
  if (state.user) { if (getRoute().page === 'room') await refreshRoom(true); else await loadHome(); }
  else renderRoute();
}
function showFormError(message) { const el = document.querySelector('#form-error'); if (el) { el.textContent = message; el.style.display = 'block'; } else toast(message, true); }
app.addEventListener('input', event => {
  const form = event.target.closest('#idea-form');
  if (form) state.ideaDraft[event.target.name] = event.target.value;
  const comments = event.target.closest('[data-comment-form]');
  if (comments) state.commentDrafts[comments.dataset.commentForm] = event.target.value;
});
app.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  if (form.id === 'auth-form') {
    const data = Object.fromEntries(new FormData(form)); state.busy = true; renderRoute();
    try { const result = await api(state.authMode === 'signup' ? '/auth/signup' : '/auth/login', { method: 'POST', body: JSON.stringify(data) }); state.user = result.user; if (getRoute().page === 'room') await refreshRoom(true); else await loadHome(); }
    catch (e) { state.busy = false; renderRoute(); showFormError(e.message); }
    return;
  }
  try {
    if (form.id === 'create-form') { const data = Object.fromEntries(new FormData(form)); const result = await api('/rooms', { method: 'POST', body: JSON.stringify(data) }); closeModal(); navigate(`/room/${result.room.code}`); await refreshRoom(true); }
    else if (form.id === 'join-form') { const data = Object.fromEntries(new FormData(form)); const result = await api('/rooms/join', { method: 'POST', body: JSON.stringify(data) }); closeModal(); navigate(`/room/${result.room.code}`); await refreshRoom(true); }
    else if (form.id === 'idea-form') { const data = Object.fromEntries(new FormData(form)); await api(`/rooms/${getRoute().code}/ideas`, { method: 'POST', body: JSON.stringify(data) }); state.ideaDraft = { title: '', details: '' }; await refreshRoom(true); }
    else if (form.matches('[data-comment-form]')) { const ideaId = form.dataset.commentForm; const data = Object.fromEntries(new FormData(form)); await api(`/ideas/${ideaId}/comments`, { method: 'POST', body: JSON.stringify(data) }); state.commentDrafts[ideaId] = ''; state.commentOpen.add(ideaId); await refreshRoom(true); }
  } catch (e) { toast(e.message, true); }
});
app.addEventListener('click', async event => {
  const trigger = event.target.closest('[data-action]'); if (!trigger) return;
  const action = trigger.dataset.action;
  if (action === 'backdrop' && event.target === trigger) { closeModal(); return; }
  if (action === 'close-modal') { closeModal(); return; }
  if (action === 'auth-mode') { state.authMode = trigger.dataset.mode; renderRoute(); return; }
  if (action === 'home') { event.preventDefault(); navigate('/'); await loadHome(); return; }
  if (action === 'create-modal') { createModal(); return; }
  if (action === 'join-modal') { joinModal(); return; }
  if (action === 'open-room') { navigate(`/room/${trigger.dataset.code}`); await refreshRoom(true); return; }
  if (action === 'join-room') { try { await api('/rooms/join', { method: 'POST', body: JSON.stringify({ code: trigger.dataset.code }) }); await refreshRoom(true); } catch (e) { toast(e.message, true); } return; }
  if (action === 'logout') { await api('/auth/logout', { method: 'POST' }).catch(() => {}); state.user = null; navigate('/'); renderRoute(); return; }
  if (action === 'copy-code') { try { await navigator.clipboard.writeText(trigger.dataset.code); toast('Room code copied. Invite your people!'); } catch { toast(`Room code: ${trigger.dataset.code}`); } return; }
  if (action === 'toggle-comments') { const id = trigger.dataset.id; state.commentOpen.has(id) ? state.commentOpen.delete(id) : state.commentOpen.add(id); renderRoute(); return; }
  if (action === 'vote') { try { await api(`/ideas/${trigger.dataset.id}/vote`, { method: 'PUT', body: JSON.stringify({ value: Number(trigger.dataset.value) }) }); await refreshRoom(true); } catch (e) { toast(e.message, true); } return; }
  if (action === 'end-room') { if (confirm('End voting now and reveal the winning idea?')) { try { await api(`/rooms/${getRoute().code}/close`, { method: 'POST' }); await refreshRoom(true); } catch (e) { toast(e.message, true); } } return; }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-action="open-room"]')) { event.preventDefault(); navigate(`/room/${event.target.dataset.code}`); refreshRoom(true); } });
window.addEventListener('popstate', async () => { if (getRoute().page === 'room') await refreshRoom(true); else await loadHome(); });
boot();
