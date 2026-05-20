import { useEffect, useMemo, useState } from "react";import { createRoot } from 'react-dom/client';
import { Trophy, Users, ShieldCheck, Lock, Settings, Medal, CalendarDays, Share2, Database, Smartphone, Globe2 } from 'lucide-react';
import { matches2026 } from './data/matches2026';
import { demoFriends, demoLeague, demoPicks } from './data/demo';
import { hasSupabase, supabase } from "./lib/supabase";
import './style.css';

function result(a, b) {
  if (a === null || b === null || a === undefined || b === undefined || a === '' || b === '') return null;
  if (Number(a) > Number(b)) return 'A';
  if (Number(a) < Number(b)) return 'B';
  return 'D';
}

function calculatePoints(pick, match) {
  if (!pick || match.scoreA === null || match.scoreB === null) return 0;
  const exact = Number(pick.a) === Number(match.scoreA) && Number(pick.b) === Number(match.scoreB);
  if (exact) return 7;
  const pickResult = result(pick.a, pick.b);
  const actualResult = result(match.scoreA, match.scoreB);
  if (pickResult === actualResult) return actualResult === 'D' ? 4 : 3;
  return 0;
}

function App() {
  const [activeUser, setActiveUser] = useState('andres');
  const [tab, setTab] = useState('picks');
  const [matches, setMatches] = useState(matches2026);
  const [picks, setPicks] = useState(demoPicks);
  const [joinCode, setJoinCode] = useState('ANDRES2026');
  const [filter, setFilter] = useState('All');
  const league = demoLeague;
  const visibleMatches = matches.filter(m => filter === 'All' || m.round === filter).slice(0, filter === 'All' ? 24 : 104);
  const rounds = ['All', ...Array.from(new Set(matches.map(m => m.round)))];
const [friends, setFriends] = useState(demoFriends);

useEffect(() => {
  async function loadPlayers() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("players")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setFriends(data);
    }
  }

  loadPlayers();
}, []);
  const leaderboard = useMemo(() => Friends.map(friend => {
    const total = matches.reduce((sum, match) => sum + calculatePoints(picks[friend.id]?.[match.id], match), 0);
    const exacts = matches.filter(m => picks[friend.id]?.[m.id]?.a === m.scoreA && picks[friend.id]?.[m.id]?.b === m.scoreB).length;
    return { ...friend, total, exacts };
  }).sort((a,b) => b.total - a.total || b.exacts - a.exacts), [matches, picks]);

  const pot = Friends.filter(f => f.paid).length * league.entry;

  function updatePick(matchId, field, value) {
    const clean = value === '' ? '' : Math.max(0, Number(value));
    setPicks(prev => ({
      ...prev,
      [activeUser]: { ...prev[activeUser], [matchId]: { ...prev[activeUser]?.[matchId], [field]: clean } }
    }));
  }

  function updateScore(matchId, field, value) {
    const clean = value === '' ? null : Math.max(0, Number(value));
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: clean, status: clean === null ? m.status : 'finished' } : m));
  }

  return <div className="app">
    <header className="hero pro">
      <div>
        <p className="eyebrow">Private League Code: {league.code}</p>
        <h1>Quiniela Mundial 2026</h1>
        <p className="sub">A polished private pool app for friends: invite code, picks, locked deadlines, admin scores, automatic points, leaderboard, Supabase-ready backend, and future iPhone/Android support.</p>
        <div className="ctaRow"><button onClick={() => setTab('picks')}>Make Picks</button><button className="ghost" onClick={() => setTab('setup')}>Launch Checklist</button></div>
      </div>
      <div className="card pot">
<Trophy size={30}/><span>Total Pot</span><strong>${Number.isFinite(pot) ? `$${pot.toLocaleString()}` : "$0"}</strong><small>Prize split: {league.prize || "70% / 20% / 10%"}</small>      </div>
    </header>

    <section className="stats">
      <div><Users/><span>{demoFriends.length} players</span></div>
      <div><CalendarDays/><span>104-match seed file</span></div>
      <div><Database/><span>{hasSupabase ? 'Supabase connected' : 'Demo mode / Supabase ready'}</span></div>
    </section>

    <nav className="tabs">
      {['join','picks','leaderboard','admin','setup'].map(t => <button key={t} className={tab===t?'active':''} onClick={() => setTab(t)}>{t === 'join' ? 'Join' : t[0].toUpperCase()+t.slice(1)}</button>)}
    </nav>

    {tab === 'join' && <main className="grid two">
      <section className="panel"><div className="panelTitle"><Lock/> Friend Login</div><label>Name</label><input value={demoFriends.find(f=>f.id===activeUser)?.name || ''} readOnly/><label>League invite code</label><input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}/><button onClick={()=>setTab('picks')}>Join League</button><p className="hint">Production version uses Supabase email magic links. This demo shows the invite-code flow.</p></section>
      <section className="panel"><div className="panelTitle"><Share2/> Invite Message</div><p className="copyBox">Join my World Cup 2026 Quiniela. Code: <b>{league.code}</b>. Make your picks before kickoff. Entry: ${league.entry}. Prize split: {league.prize}.</p></section>
    </main>}

    {tab === 'picks' && <main className="grid">
      <section className="panel sticky"><div className="panelTitle"><Lock/> My Account</div><select value={activeUser} onChange={e=>setActiveUser(e.target.value)}>{demoFriends.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select><label>Round filter</label><select value={filter} onChange={e=>setFilter(e.target.value)}>{rounds.map(r => <option key={r}>{r}</option>)}</select><p className="hint">Picks should lock automatically at each match kickoff once connected to Supabase.</p></section>
      <section className="matchList">{visibleMatches.map(match => { const pick = picks[activeUser]?.[match.id] || { a:'', b:''}; const pts=calculatePoints(pick, match); return <div className="match card" key={match.id}><div className="matchTop"><span>#{match.no} · {match.round}</span><span>{match.date}</span></div><div className="venue">{match.venue}</div><div className="teams"><strong>{match.teamA}</strong><span>vs</span><strong>{match.teamB}</strong></div><div className="scoreRow"><input type="number" min="0" value={pick.a} onChange={e=>updatePick(match.id,'a',e.target.value)}/><span>Your Pick</span><input type="number" min="0" value={pick.b} onChange={e=>updatePick(match.id,'b',e.target.value)}/></div><div className="actual">Final: {match.scoreA ?? '-'} - {match.scoreB ?? '-'} <b>{pts} pts</b></div></div>})}</section>
    </main>}

    {tab === 'leaderboard' && <main className="panel full"><div className="panelTitle"><Medal/> Leaderboard</div><div className="leaderRows">{leaderboard.map((row,i)=><div className="leader" key={row.id}><span className="rank">#{i+1}</span><span>{row.name}{row.paid ? '' : ' · unpaid'}</span><small>{row.exacts} exact scores</small><strong>{row.total} pts</strong></div>)}</div></main>}

    {tab === 'admin' && <main className="panel full wide"><div className="panelTitle"><Settings/> Admin Score Entry</div><p className="hint">Enter final scores. Points update automatically. In production, only the league owner can access this screen.</p>{matches.slice(0,24).map(match=><div className="adminRow" key={match.id}><span>#{match.no} {match.teamA} vs {match.teamB}</span><input type="number" min="0" value={match.scoreA ?? ''} placeholder="A" onChange={e=>updateScore(match.id,'scoreA',e.target.value)}/><input type="number" min="0" value={match.scoreB ?? ''} placeholder="B" onChange={e=>updateScore(match.id,'scoreB',e.target.value)}/></div>)}</main>}

    {tab === 'setup' && <main className="grid two">
      <section className="panel"><div className="panelTitle"><Globe2/> Publish Online</div><ol><li>Create a Supabase project and run <b>supabase/schema.sql</b>.</li><li>Add env variables from <b>.env.example</b>.</li><li>Push this folder to GitHub.</li><li>Import the GitHub repo into Vercel and deploy.</li></ol></section>
      <section className="panel"><div className="panelTitle"><Smartphone/> Mobile App Later</div><ol><li>Run <b>npm run build</b>.</li><li>Run <b>npm run cap:add:ios</b> or <b>npm run cap:add:android</b>.</li><li>Use Xcode / Android Studio to submit to app stores.</li></ol></section>
    </main>}
    <footer>Private friendly pool app. Keep payment collection outside the app unless reviewed for gambling/payment compliance.</footer>
  </div>;
}export default
App;
