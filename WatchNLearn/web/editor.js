let player;
let currentNoteId = null;
let typingTimer;
let charCount = 0;
const API = "http://127.0.0.1:8000";

window.onYouTubeIframeAPIReady = () => {};

function loadVideo(videoUrl) {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) return;
    document.getElementById('video-placeholder').style.display = 'none';
    if (player) {
        player.loadVideoById(videoId);
    } else {
        player = new YT.Player('yt-player', {
            videoId: videoId,
            playerVars: { autoplay: 0, modestbranding: 1 }
        });
    }
}

function extractVideoId(url) {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return match ? match[1] : null;
}

function seekWhenReady(seconds) {
    if (!seconds || seconds <= 0) return;
    const interval = setInterval(() => {
        if (player && player.getPlayerState && player.getPlayerState() !== -1) {
            player.seekTo(seconds, true);
            clearInterval(interval);
        }
    }, 300);
}

function getSelectedNode() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node = sel.anchorNode;
    if (node.nodeType === 3) node = node.parentElement;
    return node;
}

function getBlockTag() {
    const node = getSelectedNode();
    if (!node) return '';
    const block = node.closest('h1, h2, h3, p, div, li');
    return block ? block.tagName.toLowerCase() : '';
}

function updateToolbarState() {
    setTimeout(() => {
        const boldBtn = document.getElementById('bold-btn');
        const italicBtn = document.getElementById('italic-btn');
        const listBtn = document.getElementById('list-btn');
        const h1Btn = document.getElementById('h1-btn');
        const h2Btn = document.getElementById('h2-btn');
        const tsBtn = document.getElementById('timestamp-btn');

        if (boldBtn) boldBtn.classList.toggle('active', document.queryCommandState('bold'));
        if (italicBtn) italicBtn.classList.toggle('active', document.queryCommandState('italic'));
        if (listBtn) listBtn.classList.toggle('active', document.queryCommandState('insertUnorderedList'));

        const tag = getBlockTag();
        if (h1Btn) h1Btn.classList.toggle('active', tag === 'h1');
        if (h2Btn) h2Btn.classList.toggle('active', tag === 'h2');

        const node = getSelectedNode();
        if (tsBtn && node) {
            tsBtn.classList.toggle('active', node.classList && node.classList.contains('timestamp'));
        }
    }, 10);
}

document.addEventListener('selectionchange', () => {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.classList.contains('section-editor')) {
        updateToolbarState();
    }
});

const editor = document.getElementById('editor');

editor.addEventListener('keydown', (e) => {
    const ignoredKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
    if (ignoredKeys.includes(e.key)) return;
    charCount++;
    if (charCount >= 6 && player && player.getPlayerState) {
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        }
    }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        charCount = 0;
        if (player && player.playVideo) {
            player.playVideo();
        }
    }, 1200);
});

document.addEventListener('keydown', (e) => {
    if (!player || !player.getCurrentTime) return;
    if (!e.ctrlKey || !e.shiftKey) return;
    if (e.key === '>') {
        e.preventDefault();
        player.seekTo(player.getCurrentTime() + 5, true);
    } else if (e.key === '<') {
        e.preventDefault();
        player.seekTo(player.getCurrentTime() - 5, true);
    }
});

document.querySelectorAll('[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
        editor.focus();
        document.execCommand(btn.dataset.cmd, false, null);
        setTimeout(updateToolbarState, 10);
    });
});

document.getElementById('h1-btn').addEventListener('click', () => {
    editor.focus();
    const tag = getBlockTag();
    document.execCommand('formatBlock', false, tag === 'h1' ? 'p' : 'h1');
    setTimeout(updateToolbarState, 10);
});

document.getElementById('h2-btn').addEventListener('click', () => {
    editor.focus();
    const tag = getBlockTag();
    document.execCommand('formatBlock', false, tag === 'h2' ? 'p' : 'h2');
    setTimeout(updateToolbarState, 10);
});

document.getElementById('timestamp-btn').addEventListener('click', () => {
    if (!player || !player.getCurrentTime) return;
    const time = Math.floor(player.getCurrentTime());
    const mins = String(Math.floor(time / 60)).padStart(2, '0');
    const secs = String(time % 60).padStart(2, '0');
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const isBold = document.queryCommandState('bold');
    const isItalic = document.queryCommandState('italic');
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'timestamp';
    span.dataset.t = time;
    span.textContent = `[${mins}:${secs}]`;
    span.contentEditable = 'false';
    const space = document.createTextNode('\u00A0');
    range.collapse(false);
    range.insertNode(space);
    range.insertNode(span);
    const newRange = document.createRange();
    newRange.setStartAfter(space);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    if (isBold !== document.queryCommandState('bold')) document.execCommand('bold', false, null);
    if (isItalic !== document.queryCommandState('italic')) document.execCommand('italic', false, null);
    setTimeout(updateToolbarState, 10);
});

editor.addEventListener('click', (e) => {
    const ts = e.target.closest('.timestamp');
    if (ts && player && player.seekTo) {
        player.seekTo(parseInt(ts.dataset.t), true);
    }
});

async function loadNotesList() {
    const res = await fetch(`${API}/notes`);
    const notes = await res.json();
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    notes.forEach(n => {
        const div = document.createElement('div');
        div.className = 'note-item';
        div.textContent = n.title || 'Untitled';
        div.dataset.id = n.id;
        div.dataset.videoUrl = n.video_url;
        div.addEventListener('click', () => openNote(n.id));
        list.appendChild(div);
    });
}

async function openNote(id) {
    if (currentNoteId) {
        const timestamp = player && player.getCurrentTime ? player.getCurrentTime() : 0;
        await saveCurrentNote(timestamp);
    }
    const res = await fetch(`${API}/notes/${id}`);
    const note = await res.json();
    currentNoteId = note.id;
    editor.innerHTML = note.content || '<p>Start taking notes...</p>';
    loadVideo(note.video_url);
    const seekTo = Math.max(0, (note.last_timestamp || 0) - 15);
    seekWhenReady(seekTo);
    document.querySelectorAll('.note-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === id);
    });
}

async function saveCurrentNote(timestamp = null) {
    if (!currentNoteId) return;
    const activeNote = document.querySelector('.note-item.active');
    const videoUrl = activeNote ? activeNote.dataset.videoUrl : '';
    const body = {
        title: activeNote ? activeNote.textContent : 'Untitled',
        video_url: videoUrl,
        content: editor.innerHTML,
    };
    if (timestamp !== null) {
        body.last_timestamp = timestamp;
    }
    await fetch(`${API}/notes/${currentNoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const status = document.getElementById('save-status');
    status.textContent = 'Saved';
    setTimeout(() => status.textContent = '', 2000);
}

async function saveAndClose() {
    if (!currentNoteId) return;
    const timestamp = player && player.getCurrentTime ? player.getCurrentTime() : 0;
    await saveCurrentNote(timestamp);
}

document.getElementById('new-note-btn').addEventListener('click', async () => {
    const title = prompt('Note title:');
    if (!title) return;
    const videoUrl = prompt('YouTube URL:');
    if (!videoUrl) return;
    const res = await fetch(`${API}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, video_url: videoUrl, content: '' })
    });
    const data = await res.json();
    await loadNotesList();
    await openNote(data.id);
});

setInterval(saveCurrentNote, 30000);

loadNotesList();
