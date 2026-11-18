// xedge.js — read your X (Twitter) graph and rebalance it, from inside your own logged-in tab.
// Part of the "adjacent-possible" skill: https://github.com/raullenchai/skills
//
// Everything runs in YOUR browser tab. No credentials leave the page; nothing is sent anywhere.
// Long jobs run in the background and keep their state on `window.__xedge`, so a caller with a
// short evaluation timeout (an agent, or you in the DevTools console) can start a job and poll it.
//
//   xEdge.start('following')                         scan the account list on /<you>/following
//   xEdge.start('posts', { max: 100 })               scan posts on the current profile page
//   xEdge.start('verify', { handles: ['a','b'] })    open each profile, report exists/active/followers
//   xEdge.start('apply', { follow, unfollow, keep, dryRun: true, maxActions: 20 })
//   xEdge.status()                                   { job, state, done, total, note }
//   xEdge.result(offset, limit)                      compact text lines of the last job's rows
//   xEdge.rows()                                     the raw row objects (for console use)
//   xEdge.stop()                                     ask the running job to stop after the current step
//
// Safety defaults for 'apply': dryRun true, max 20 actions per run, random 15–35 s between actions,
// a keep-list that is never unfollowed, and only the profile's own header button is ever clicked.

(() => {
  if (window.xEdge && window.xEdge.version) return;
  const S = (window.__xedge = { job: null, state: 'idle', done: 0, total: 0, note: '', rows: [], stop: false });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = h => String(h || '').replace(/^@/, '').trim().toLowerCase();
  // Strip URLs and query-ish characters so results can be passed through tools that block them.
  const clean = s => String(s || '').replace(/https?:\S+/g, '').replace(/[=&?%#\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

  const waitFor = async (fn, ms = 15000) => {
    for (let t = 0; t < ms; t += 500) { try { const v = fn(); if (v) return v; } catch {} await sleep(500); }
    return null;
  };
  // In-app navigation keeps this script alive (X blocks popups/iframes; full reloads kill the job).
  const go = path => { history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };
  const col = () => document.querySelector('[data-testid="primaryColumn"]');
  // The profile's own Follow/Following button. aria-label ends with "@handle"; suggestion cells are excluded.
  const btn = (h, kind) => [...document.querySelectorAll(`[data-testid$="-${kind}"]`)].find(b =>
    !b.closest('[data-testid="UserCell"]') && (b.getAttribute('aria-label') || '').toLowerCase().endsWith('@' + norm(h)));
  const missing = () => /doesn.t exist|account is suspended|These posts are protected/i.test(col()?.innerText || '');

  async function scrollCollect(collect, { idleRounds = 4, step = 1800, pause = 1400, max = Infinity } = {}) {
    let still = 0, last = -1;
    while (still < idleRounds && !S.stop && S.rows.length < max) {
      collect();
      S.done = S.rows.length;
      window.scrollBy(0, step);
      await sleep(pause);
      still = S.rows.length === last ? still + 1 : 0;
      last = S.rows.length;
    }
    collect();
    if (S.rows.length > max) S.rows.length = max;
  }

  const jobs = {
    async following() {
      if (!/\/following\/?$/.test(location.pathname)) throw new Error('open https://x.com/<you>/following first');
      const seen = new Set();
      await scrollCollect(() => document.querySelectorAll('[data-testid="UserCell"]').forEach(c => {
        const lines = c.innerText.split('\n').map(s => s.trim()).filter(Boolean);
        const at = lines.find(s => s.startsWith('@'));
        const h = at ? at.slice(1) : '';
        if (!h || seen.has(norm(h))) return;
        seen.add(norm(h));
        const bio = lines.slice(lines.indexOf(at) + 1)
          .filter(s => !/^(Follow|Following|Follows you|Click to Unfollow|Unfollow)$/.test(s)).join(' ');
        S.rows.push({ handle: h, name: clean(lines[0]), followsYou: lines.includes('Follows you'), bio: clean(bio).slice(0, 160) });
      }));
    },

    async posts({ max = 100 } = {}) {
      const seen = new Set();
      await scrollCollect(() => document.querySelectorAll('article[data-testid="tweet"]').forEach(a => {
        const who = (a.querySelector('[data-testid="User-Name"]')?.innerText || '').split('@')[1]?.split('\n')[0] || '';
        const date = a.querySelector('time')?.getAttribute('datetime')?.slice(0, 10) || '';
        const text = clean(a.querySelector('[data-testid="tweetText"]')?.innerText || '');
        const key = who + date + text.slice(0, 50);
        if (seen.has(key)) return;
        seen.add(key);
        const social = clean(a.querySelector('[data-testid="socialContext"]')?.innerText || '');
        S.rows.push({ date, author: who, repost: /reposted/i.test(social), text: text.slice(0, 280) });
      }), { max, pause: 1300, step: 1400 });
    },

    async verify({ handles = [] } = {}) {
      const home = location.pathname;
      S.total = handles.length;
      for (const h of handles) {
        if (S.stop) break;
        go('/' + norm(h));
        await sleep(2000);
        const state = await waitFor(() => {
          if (missing()) return 'missing';
          const head = document.querySelector('[data-testid="UserName"]')?.innerText || '';
          return head.toLowerCase().includes('@' + norm(h)) ? 'ok' : null;
        });
        const row = { handle: h, exists: state === 'ok' };
        if (state === 'ok') {
          await sleep(1500);
          const head = document.querySelector('[data-testid="UserName"]')?.innerText || '';
          row.name = clean(head.split('\n')[0]);
          row.bio = clean(document.querySelector('[data-testid="UserDescription"]')?.innerText || '').slice(0, 160);
          const fl = [...document.querySelectorAll('a[href$="/verified_followers"], a[href$="/followers"]')].map(a => a.innerText).join(' ');
          row.followers = clean(fl).replace(/ Followers.*/i, '');
          const times = [...document.querySelectorAll('article time')].slice(0, 4).map(t => t.getAttribute('datetime')).filter(Boolean).sort();
          row.lastPost = times.length ? times[times.length - 1].slice(0, 10) : '';
          row.youFollow = !!btn(h, 'unfollow');
        } else row.note = state || 'page did not load';
        S.rows.push(row);
        S.done++;
        await sleep(1200 + Math.random() * 1500);
      }
      go(home);
    },

    async apply({ follow = [], unfollow = [], keep = [], dryRun = true, maxActions = 20, gap = [15000, 35000] } = {}) {
      const keepSet = new Set(keep.map(norm));
      const list = [...follow.map(h => ({ h, act: 'follow' })),
        ...unfollow.filter(h => !keepSet.has(norm(h))).map(h => ({ h, act: 'unfollow' }))];
      const kept = unfollow.filter(h => keepSet.has(norm(h)));
      kept.forEach(h => S.rows.push({ handle: h, act: 'unfollow', result: 'kept (on keep list)' }));
      S.total = list.length;
      const home = location.pathname;
      let actions = 0;
      for (const { h, act } of list) {
        if (S.stop) { S.rows.push({ handle: h, act, result: 'stopped' }); continue; }
        if (actions >= maxActions) { S.rows.push({ handle: h, act, result: 'skipped (maxActions) — run again later' }); continue; }
        go('/' + norm(h));
        await sleep(2000);
        const state = await waitFor(() => missing() ? 'missing' : btn(h, 'unfollow') ? 'following' : btn(h, 'follow') ? 'not-following' : null);
        let result;
        if (!state) result = 'page did not load';
        else if (state === 'missing') result = 'account not found';
        else if (act === 'follow' && state === 'following') result = 'already following';
        else if (act === 'unfollow' && state === 'not-following') result = 'already not following';
        else if (dryRun) result = `would ${act}`;
        else {
          btn(h, act).click();
          if (act === 'unfollow') (await waitFor(() => document.querySelector('[data-testid="confirmationSheetConfirm"]'), 5000))?.click();
          const flipped = await waitFor(() => btn(h, act === 'follow' ? 'unfollow' : 'follow'), 8000);
          result = flipped ? `${act}ed` : `${act} clicked, not confirmed`;
          actions++;
          if (/rate limit|try again later/i.test(document.body.innerText)) { result += ' — X shows a limit warning, stopping'; S.stop = true; }
          await sleep(gap[0] + Math.random() * (gap[1] - gap[0]));
        }
        S.rows.push({ handle: h, act, result });
        S.done++;
      }
      go(home);
    },
  };

  const line = r => Object.values(r).map(v => typeof v === 'boolean' ? (v ? 'yes' : 'no') : v).join(' | ');

  window.xEdge = {
    version: '0.1.0',
    start(job, opts = {}) {
      if (S.state === 'running') return `busy: ${S.job} (${S.done}/${S.total || '?'})`;
      if (!jobs[job]) return `unknown job "${job}" — use following | posts | verify | apply`;
      Object.assign(S, { job, state: 'running', done: 0, total: 0, note: '', rows: [], stop: false });
      jobs[job](opts).then(() => { S.state = 'done'; }).catch(e => { S.state = 'error'; S.note = String(e.message || e); });
      return `started ${job}`;
    },
    status: () => ({ job: S.job, state: S.state, done: S.done, total: S.total, rows: S.rows.length, note: S.note }),
    result: (offset = 0, limit = 15) => S.rows.slice(offset, offset + limit).map((r, i) => `${offset + i}. ${line(r)}`).join('\n'),
    rows: () => S.rows,
    stop: () => { S.stop = true; return 'stopping after current step'; },
  };
  console.log('xEdge ready — xEdge.start("following") on /<you>/following to begin.');
})();
