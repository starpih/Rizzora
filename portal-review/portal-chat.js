(() => {
  // Deliberately memory-only: no message storage, network requests or trial charges.
  const voiceSampleIds = new Set(['chris', 'emilio', 'enzo', 'hayes', 'jack', 'keisuke', 'kim', 'nabil', 'rossi']);
  const threads = new Map();
  let host;
  let activeId;
  let lastOpened;
  let historySearch = '';
  const clock = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' });
  const compactChat = matchMedia('(max-width: 760px)');
  let voice = null;
  let disposeProfile = () => {};
  let voiceRevision = 0;
  const byId = id => characters.find(c => c.id === id);
  const escape = value => { const node = document.createElement('span'); node.textContent = value; return node.innerHTML; };
  const prompts = ['I could use a quiet moment.', 'Something good happened today.', 'Tell me about your world.'];
  const replies = {
    chris: ['We can take it slowly. Would you like to talk about your day, or find a lighter place to start?', 'Then we should make a little room for that. What was the best part?', 'The song is still playing, and there is a spot on the sofa. What would you put on next?'],
    kim: ['Let’s leave the rush outside for a moment. Would a favorite song help, or would you rather talk?', 'I want to hear this one. What made you smile?', 'Rehearsal is over, but the encore is still in my head. What song has been following you around?'],
    julian: ['There is no need to fit the whole day into a sentence. Where would you like to begin?', 'A good moment deserves its own story. Tell me how it happened.', 'A few notes on the piano, a book left open. Would you choose a story or a song tonight?'],
    enzo: ['We can let the evening slow down. Would you like to tell me what has been on your mind?', 'That sounds like a moment to keep. What made it special for you?', 'There are lights all along the coast tonight. Would you rather take a walk or stay and watch them?'],
    hayes: ['We can stay here while the rain passes. Would you like quiet company, or a little conversation?', 'Let’s save that moment like a bookmark. What happened?', 'The last chapter can wait. Is there a story you wish you could read for the first time again?'],
  };
  function thread(id) {
    if (!threads.has(id)) threads.set(id, { messages: [{ role: 'assistant', text: byId(id).greeting, time: Date.now() }], stamina: 100, unread: 0, draft: '', pending: false, timer: null });
    return threads.get(id);
  }
  function replyFor(id, text, count) {
    const theme = /tired|quiet|sad|stress|hard|lonely|累/i.test(text) ? 0 : /good|happy|smile|great|开心/i.test(text) ? 1 : /world|music|song|book|tell me|兴趣/i.test(text) ? 2 : count % 3;
    return replies[id][theme];
  }
  function stopVoice() {
    voiceRevision++;
    if (voice) { voice.pause(); voice = null; }
    const button = host?.querySelector('[data-chat-voice]');
    if (button) { button.textContent = 'Play voice sample'; button.setAttribute('aria-pressed', 'false'); }
  }
  function visible(id) {
    return activeId === id && host && !host.hidden && (location.hash === `#chat/${id}` || location.hash === '#chat');
  }
  function nearLatest() {
    const log = host?.querySelector('#chat-log');
    return !log || log.scrollHeight - log.scrollTop - log.clientHeight < 48;
  }
  function roomIsRead(id) {
    return nearLatest() && visible(id) && !document.hidden && !(location.hash === '#chat' && compactChat.matches);
  }
  function recentThreads() {
    return [...threads.entries()].sort((a, b) => b[1].messages.at(-1).time - a[1].messages.at(-1).time);
  }
  function historyPane() {
    return `<aside class="chat-history" aria-label="Conversation history">
      <header><h2>Messages</h2><a class="history-new" href="#discover" aria-label="Find a companion" title="Find a companion">+</a></header>
      <label class="history-search"><img src="assets/search.svg" alt=""><input type="search" aria-label="Search conversations" placeholder="Search companions…"></label>
      <nav class="history-threads" aria-label="Chat history"></nav>
      <a class="history-vip" href="#membership"><span aria-hidden="true">♕</span><span><strong>Rizzora VIP</strong><small>${window.RizzoraIP.isVIP() ? 'View membership' : 'Explore member benefits'}</small></span></a>
    </aside>`;
  }
  function refreshHistory() {
    updateUnreadCount([...threads.values()].reduce((total, t) => total + t.unread, 0));
    const list = host?.querySelector('.history-threads');
    if (!list || host.hidden) return;
    const query = historySearch.trim().toLowerCase();
    const rows = recentThreads().filter(([id]) => byId(id).name.toLowerCase().includes(query));
    const focusHref = list.contains(document.activeElement) && document.activeElement.getAttribute('href');
    list.innerHTML = rows.map(([id, t]) => {
      const c = byId(id), message = t.messages.at(-1);
      return `<a class="history-row" href="#chat/${id}" ${id === activeId ? 'aria-current="page"' : ''}>
        <img src="${c.image}" alt=""><span class="history-copy"><strong>${c.shortName}</strong><small>${message.role === 'user' ? 'You: ' : ''}${escape(message.text)}</small></span>
        <span class="history-meta"><time>${clock.format(message.time)}</time>${t.unread ? `<b aria-label="${t.unread} unread messages">${t.unread}</b>` : ''}</span></a>`;
    }).join('') || `<p class="history-empty">${query ? 'No matching conversations.' : 'Your conversations will appear here.'}</p>`;
    if (focusHref) list.querySelector(`[href="${focusHref}"]`)?.focus({ preventScroll: true });
  }
  function bindHistory() {
    const input = host.querySelector('.history-search input');
    input.value = historySearch;
    input.addEventListener('input', () => { historySearch = input.value; refreshHistory(); });
    refreshHistory();
  }
  function clearUnread() {
    if (signedIn && activeId && roomIsRead(activeId) && thread(activeId).unread) {
      thread(activeId).unread = 0;
      refreshHistory();
    }
  }
  function updatePresence() {
    const status = host?.querySelector('.chat-presence');
    if (status) {
      status.textContent = navigator.onLine ? 'Online' : 'Offline';
      status.classList.toggle('is-offline', !navigator.onLine);
    }
  }
  function renderMessages(id) {
    if (!visible(id)) return;
    const state = thread(id);
    const log = host.querySelector('#chat-log');
    const followLatest = nearLatest();
    // Append only new messages so assistive technology does not re-announce history.
    state.messages.slice(log.children.length).forEach(message => {
      const item = document.createElement('div');
      item.className = `chat-bubble chat-${message.role}`;
      item.dataset.role = message.role;
      const label = document.createElement('span');
      label.className = 'chat-speaker';
      label.textContent = message.role === 'user' ? 'You' : byId(id).shortName;
      const text = document.createElement('p');
      text.textContent = message.text;
      const time = document.createElement('time');
      time.textContent = clock.format(message.time);
      time.dateTime = new Date(message.time).toISOString();
      if (message.newArrival) { time.className = 'chat-new-arrival'; time.setAttribute('aria-label', 'New message, ' + time.textContent); }
      item.append(label, text, time); log.append(item);
    });
    host.querySelector('#chat-status').textContent = state.pending ? `${byId(id).shortName} is replying in this demo…` : '';
    host.querySelector('.chat-starters').hidden = state.messages.length > 1;
    updateComposer(id);
    if (followLatest || state.pending) log.scrollTop = log.scrollHeight;
  }
  function updateComposer(id) {
    if (!visible(id)) return;
    const state = thread(id);
    host.querySelector('#chat-send').disabled = state.pending || !state.draft.trim();
    host.querySelector('#chat-send').textContent = state.pending ? 'Replying…' : 'Send';
  }
  function send(id) {
    const state = thread(id);
    const text = state.draft.trim().slice(0, 1000);
    if (!text || state.pending || !signedIn) return;
    state.stamina = Math.max(0, state.stamina - 5);
    const ring = host.querySelector('.stamina-ring');
    ring.style.setProperty('--remaining', state.stamina + '%');
    ring.setAttribute('aria-valuenow', state.stamina);
    ring.title = `Demo stamina: ${state.stamina}%`;
    state.messages.push({ role: 'user', text, time: Date.now() });
    refreshHistory();
    state.draft = ''; state.pending = true;
    host.querySelector('#chat-message').value = '';
    host.querySelectorAll('.chat-new-arrival').forEach(time => time.classList.remove('chat-new-arrival'));
    renderMessages(id);
    host.querySelector('#chat-message').focus({ preventScroll: true });
    state.timer = setTimeout(() => {
      const unread = !roomIsRead(id);
      if (unread) state.unread++;
      state.messages.push({ role: 'assistant', time: Date.now(), newArrival: unread, text: replyFor(id, text, state.messages.filter(m => m.role === 'user').length - 1) });
      state.pending = false; state.timer = null;
      renderMessages(id);
      refreshHistory();
    }, 550);
  }
  function mountProfile(c) {
    const compact = matchMedia('(max-width: 1000px)');
    const slot = host.querySelector('.chat-profile-slot');
    const drawer = host.querySelector('.chat-profile-dialog');
    const trigger = host.querySelector('[data-show-chat-profile]');
    const scene = document.querySelector(`[data-hero-character="${c.id}"]`);
    const pictures = [{ src: c.image, label: 'Portrait' }];
    if (scene && scene.getAttribute('src') !== c.image) pictures.push({ src: scene.getAttribute('src'), label: 'His world' });
    pictures.push({ src: c.id === 'hayes' ? 'assets/hero-companions/hayes.jpg' : `assets/chat-gallery/${c.id}.webp`, label: 'VIP portrait', vip: true });
    const locked = picture => picture.vip && !window.RizzoraIP.isVIP();
    const story = scene?.dataset.story || (c.id === 'chris' ? 'The song you sent is still playing when you arrive. Chris moves his sweater off the sofa. “I saved you the good spot.”' : c.summary);
    const panel = document.createElement('aside');
    panel.id = 'chat-profile-panel';
    panel.className = 'chat-profile-panel';
    panel.setAttribute('aria-labelledby', 'chat-profile-title');
    panel.tabIndex = -1;
    const paths = {
      Birthday: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16"/>',
      Height: '<path d="m5 19 14-14M6 14l4 4m0-8 4 4m0-8 4 4"/>',
      'Zodiac Signs': '<path d="m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1Z"/>',
      MBTI: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
      Nationality: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
      Occupation: '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V3h8v4M3 12h18"/>',
      Hobbies: '<path d="M12 21 4 13C-2 5 7 0 12 7c5-7 14-2 8 6Z"/>',
      Personality: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    };
    const glyph = label => `<span class="chat-fact-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[label] || paths.MBTI}</svg></span>`;
    const facts = [['Birthday',c.profile?.birthday?.replaceAll('/','-')], ['Height',c.profile?.height], ['Zodiac Signs',c.profile?.zodiac], ['MBTI',c.profile?.mbti], ['Nationality',c.nationality], ['Occupation',c.profession]];
    const clip = featuredVideos[c.id];
    panel.innerHTML = `<div class="chat-profile-top"><button type="button" class="chat-profile-close" aria-label="Close profile">×</button></div>
      <div class="chat-profile-media"><img class="chat-profile-portrait" src="${c.image}" alt="${c.name}, a fictional AI companion">
      ${clip ? `<video class="chat-profile-video" src="${clip}" poster="${c.image}" controls playsinline preload="none" aria-label="${c.shortName} character clip" hidden></video>` : ''}
      <div class="gallery-lock" hidden><span class="lock-icon" aria-hidden="true"></span><strong>VIP portrait</strong><a href="#membership">Unlock with VIP</a></div>
      <div class="chat-profile-media-actions">${clip ? '<button type="button" data-profile-play>▷ <span>Play</span></button>' : ''}<button type="button" data-profile-zoom aria-label="View full portrait">+</button></div></div>
      ${pictures.length > 1 ? `<div class="chat-profile-gallery" role="group" aria-label="Profile images"><button type="button" data-profile-step="-1" aria-label="Previous profile photo">‹</button>${pictures.map((picture, index) => `<button type="button" data-profile-image="${index}" aria-label="${picture.label}" aria-pressed="${index === 0}">${locked(picture) ? '<span class="lock-icon" aria-hidden="true"></span>' : `<img src="${picture.src}" alt="">`}</button>`).join('')}<button type="button" data-profile-step="1" aria-label="Next profile photo">›</button></div>` : ''}
      <div class="chat-profile-copy"><div class="chat-profile-identity"><h2 id="chat-profile-title">${c.name}</h2><button type="button" data-profile-details aria-controls="chat-profile-details" aria-expanded="true" aria-label="Collapse profile details"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M5 17c0-5 8-5 8 0m2-9h4m-4 4h4m-4 4h4"/></svg></button></div>
      <p class="chat-profile-session">Fictional AI companion · demo</p>
      <div id="chat-profile-details"><p class="chat-profile-summary">${c.summary}</p>
      <dl class="chat-profile-facts">${facts.filter(([,value])=>value).map(([label,value])=>`<div>${glyph(label)}<dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
      <section class="chat-profile-attribute">${glyph('Hobbies')}<div><h3>Hobbies</h3><p>${c.profile?.hobbies || c.interests.join(' · ')}</p></div></section>
      <section class="chat-profile-attribute">${glyph('Personality')}<div><h3>Personality</h3><div class="chat-profile-tags">${(c.profile?.traits || c.traits).map(trait=>`<span>${trait}</span>`).join('')}</div></div></section>
      <section><h3>A moment with ${c.shortName}</h3><p>${story}</p></section></div>
      <a class="chat-full-profile" href="#character/${c.id}">Full profile <span aria-hidden="true">→</span></a>
      <p class="chat-profile-note">A fictional AI character. Profile copy is a creative preview.</p></div>`;
    slot.append(panel);
    const sync = () => {
      if (compact.matches) {
        drawer.append(panel);
        trigger.setAttribute('aria-controls', 'chat-profile-drawer');
        trigger.setAttribute('aria-haspopup', 'dialog');
      } else {
        if (drawer.open) drawer.close();
        slot.append(panel);
        trigger.setAttribute('aria-controls', panel.id);
        trigger.removeAttribute('aria-haspopup');
      }
    };
    drawer.id = 'chat-profile-drawer';
    trigger.addEventListener('click', () => {
      if (compact.matches) { drawer.showModal(); panel.querySelector('.chat-profile-close').focus(); }
      else { panel.focus({ preventScroll: true }); panel.scrollTop = 0; }
    });
    panel.querySelector('.chat-profile-close').addEventListener('click', () => drawer.close());
    drawer.addEventListener('close', () => { if (trigger.isConnected && location.hash === `#chat/${c.id}`) trigger.focus({ preventScroll: true }); });
    drawer.addEventListener('click', event => {
      if (event.target !== drawer) return;
      const bounds = drawer.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) drawer.close();
    });
    let pictureIndex = 0;
    const portrait = panel.querySelector('.chat-profile-portrait');
    const video = panel.querySelector('video');
    const play = panel.querySelector('[data-profile-play]');
    const stopClip = () => {
      if (video) { video.pause(); video.hidden = true; }
      portrait.hidden = false;
      if (play) { play.querySelector('span').textContent = 'Play'; play.setAttribute('aria-pressed', 'false'); }
    };
    const pickPicture = index => {
      pictureIndex = (index + pictures.length) % pictures.length;
      stopClip();
      const isLocked = locked(pictures[pictureIndex]);
      panel.querySelector('.gallery-lock').hidden = !isLocked;
      panel.querySelector('.chat-profile-media-actions').hidden = isLocked;
      portrait.src = isLocked ? c.image : pictures[pictureIndex].src;
      portrait.classList.toggle('locked-preview', isLocked);
      portrait.alt = `${c.shortName} · ${pictures[pictureIndex].label}`;
      panel.querySelectorAll('[data-profile-image]').forEach(item => item.setAttribute('aria-pressed', String(Number(item.dataset.profileImage) === pictureIndex)));
    };
    panel.querySelectorAll('[data-profile-image]').forEach(button => button.addEventListener('click', () => pickPicture(Number(button.dataset.profileImage))));
    panel.querySelectorAll('[data-profile-step]').forEach(button => button.addEventListener('click', () => pickPicture(pictureIndex + Number(button.dataset.profileStep))));
    panel.querySelector('[data-profile-details]').addEventListener('click', event => {
      const button = event.currentTarget;
      const details = panel.querySelector('#chat-profile-details');
      details.hidden = !details.hidden;
      button.setAttribute('aria-expanded', String(!details.hidden));
      button.setAttribute('aria-label', `${details.hidden ? 'Expand' : 'Collapse'} profile details`);
    });
    play?.setAttribute('aria-pressed', 'false');
    play?.addEventListener('click', async () => {
      if (!video.hidden) { stopClip(); return; }
      stopVoice();
      portrait.hidden = true; video.hidden = false;
      play.querySelector('span').textContent = 'Stop'; play.setAttribute('aria-pressed', 'true');
      try { await video.play(); }
      catch { stopClip(); play.querySelector('span').textContent = 'Retry'; }
    });
    video?.addEventListener('ended', stopClip);
    drawer.addEventListener('close', stopClip);
    const zoom = document.createElement('dialog');
    zoom.className = 'chat-portrait-zoom';
    zoom.setAttribute('aria-label', `${c.shortName} full portrait`);
    zoom.innerHTML = '<button type="button" aria-label="Close full portrait">×</button><img alt="">';
    host.append(zoom);
    panel.querySelector('[data-profile-zoom]').addEventListener('click', () => {
      stopClip();
      zoom.querySelector('img').src = portrait.src;
      zoom.querySelector('img').alt = portrait.alt;
      zoom.showModal();
    });
    zoom.querySelector('button').addEventListener('click', () => zoom.close());
    compact.addEventListener('change', sync);
    sync();
    disposeProfile = () => { stopClip(); if (zoom.open) zoom.close(); compact.removeEventListener('change', sync); if (drawer.open) drawer.close(); disposeProfile = () => {}; };
  }
  function render(container, id) {
    disposeProfile(); stopVoice(); host = container; activeId = null;
    document.title = 'Messages | Rizzora';
    if (id && !byId(id)) {
      host.innerHTML = '<header class="ip-page-heading"><h1>Character not found.</h1></header><a class="text-link" href="#discover">Explore the characters</a>';
      return;
    }
    if (!signedIn) {
      const c = byId(id) || characters[0];
      host.innerHTML = `<div class="chat-layout guest-chat">${historyPane()}
        <section class="guest-room"><header><img src="${c.image}" alt=""><strong>${c.name}</strong></header>
        <div><h1>Your conversations</h1><p>Sign in to start a chat.</p><button type="button" data-open="login" class="button button-primary">Log in</button></div></section>
        <aside class="guest-profile"><img src="${c.image}" alt=""><h2>${c.name}</h2></aside></div>`;
      bindHistory();
      portalAuth.open({ character: id ? c.shortName : '' });
      return;
    }
    const inbox = !id;
    if (!id) id = lastOpened || recentThreads()[0]?.[0];
    if (!id) {
      host.innerHTML = `<div class="chat-layout empty-chat">${historyPane()}<section class="empty-room"><div>
        <h1>No conversations yet</h1><p>Choose a companion and say hello.</p><a class="button button-primary" href="#discover">Explore the characters</a>
        </div></section></div>`;
      bindHistory(); return;
    }
    activeId = lastOpened = id;
    const c = byId(id);
    selectedCharacter = c;
    document.title = `Chat with ${c.shortName} | Rizzora`;
    const state = thread(id);
    if (!state.unread) state.messages.forEach(message => { message.newArrival = false; });
    window.RizzoraIP?.rememberChat(id);
    const hasVoice = voiceSampleIds.has(id);
    host.innerHTML = `<div class="chat-layout ${inbox ? 'show-inbox' : ''}">${historyPane()}<section class="chat-room" aria-label="Conversation with ${c.shortName}"><header class="chat-heading"><a class="chat-back" href="#chat" aria-label="Back to conversations">←</a><span class="stamina-ring" role="meter" aria-label="${c.shortName} demo stamina" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${state.stamina}" title="Demo stamina: ${state.stamina}%" style="--remaining:${state.stamina}%"><img src="${c.image}" alt=""></span><div><h1 tabindex="-1">${c.shortName}</h1><p class="chat-presence"></p></div><button class="chat-profile" type="button" data-show-chat-profile aria-controls="chat-profile-panel">View profile</button></header><p class="chat-notice" id="chat-notice">Demo chat · Messages stay in this tab. Stamina and status are simulated.</p><div class="chat-log" id="chat-log" role="log" aria-label="Messages with ${c.shortName}" aria-live="polite" aria-relevant="additions" tabindex="0"></div><div class="chat-starters" aria-label="Conversation starters">${prompts.map((prompt,index) => `<button type="button" data-chat-prompt="${index}">${prompt}</button>`).join('')}</div><p class="chat-status" id="chat-status" role="status"></p><form id="chat-form" class="chat-composer"><label for="chat-message">Message ${c.shortName}</label><div class="chat-input-row"><textarea id="chat-message" rows="2" maxlength="1000" placeholder="Say something…" aria-describedby="chat-keyboard chat-notice"></textarea><button class="button button-primary" id="chat-send" type="submit">Send</button></div><div class="chat-tools"><small id="chat-keyboard">Enter to send · Shift + Enter for a new line</small>${hasVoice ? '<button type="button" data-chat-voice aria-pressed="false">Play voice sample</button>' : '<small>Voice sample coming soon</small>'}</div><p class="chat-audio-status" role="status"></p></form></section><div class="chat-profile-slot"></div><dialog class="chat-profile-dialog" aria-labelledby="chat-profile-title"></dialog></div>`;
    bindHistory();
    clearUnread();
    updatePresence();
    mountProfile(c);
    host.querySelector('#chat-log').addEventListener('scroll', clearUnread);
    const input = host.querySelector('#chat-message');
    input.value = state.draft;
    input.addEventListener('input', () => { state.draft = input.value; updateComposer(id); });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) { event.preventDefault(); send(id); }
    });
    host.querySelector('#chat-form').addEventListener('submit', event => { event.preventDefault(); send(id); });
    host.querySelectorAll('[data-chat-prompt]').forEach(button => button.addEventListener('click', () => { input.value = prompts[Number(button.dataset.chatPrompt)]; state.draft = input.value; updateComposer(id); input.focus(); }));
    host.querySelector('[data-chat-voice]')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      const status = host.querySelector('.chat-audio-status');
      if (voice) { stopVoice(); status.textContent = ''; return; }
      host.querySelectorAll('video').forEach(video => video.pause());
      const request = ++voiceRevision;
      voice = new Audio(`assets/hero-companions/${id}.mp3`);
      voice.addEventListener('ended', () => { if (request === voiceRevision) { stopVoice(); status.textContent = ''; } });
      status.textContent = 'Loading a prerecorded voice sample…';
      try { await voice.play(); if (request !== voiceRevision) return; button.textContent = 'Stop voice sample'; button.setAttribute('aria-pressed', 'true'); status.textContent = 'Prerecorded sample · not a live voice reply'; }
      catch { if (request !== voiceRevision) return; stopVoice(); status.textContent = 'Could not play the sample. Try again.'; }
    });
    renderMessages(id);
  }
  window.addEventListener('online', updatePresence);
  window.addEventListener('offline', updatePresence);
  compactChat.addEventListener('change', clearUnread);
  document.addEventListener('visibilitychange', clearUnread);
  window.addEventListener('pagehide', stopVoice);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopVoice(); });
  window.RizzoraChat = { render, stopVoice, leave() { activeId = null; host = null; disposeProfile(); stopVoice(); }, clear() { stopVoice(); threads.forEach(state => clearTimeout(state.timer)); threads.clear(); activeId = lastOpened = null; historySearch = ''; } };
})();
