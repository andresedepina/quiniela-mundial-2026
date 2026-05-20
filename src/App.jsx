import { useEffect, useMemo, useState } from "react";
import { Trophy, Users, ShieldCheck, Lock, Settings, Medal, CalendarDays, Share2, Database } from "lucide-react";
import { matches2026 } from "./data/matches2026";
import { demoLeague, demoPicks } from "./data/demo";
import { hasSupabase, supabase } from "./lib/supabase";
import "./style.css";

function result(a, b) {
  if (a == null || b == null || a === "" || b === "") return null;
  if (Number(a) > Number(b)) return "A";
  if (Number(a) < Number(b)) return "B";
  return "D";
}

function calculatePoints(pick, match) {
  if (!pick || match.scoreA == null || match.scoreB == null) return 0;

  const exact =
    Number(pick.a) === Number(match.scoreA) &&
    Number(pick.b) === Number(match.scoreB);

  if (exact) return 7;

  const pickResult = result(pick.a, pick.b);
  const actualResult = result(match.scoreA, match.scoreB);

  if (pickResult === actualResult) {
    return actualResult === "D" ? 4 : 3;
  }

  return 0;
}

function App() {
  const [activeUser, setActiveUser] = useState("andres");
  const [tab, setTab] = useState("join");
  const [matches, setMatches] = useState(matches2026);
  const [picks, setPicks] = useState(demoPicks);
  const [joinCode] = useState("ANDRES2026");
  const [filter, setFilter] = useState("ALL");
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    async function loadPlayers() {
      if (!hasSupabase) return;

      const { data, error } = await supabase
        .from("players")
        .select("*");

      if (!error && data) {
        setFriends(data);
      } else {
        console.error(error);
      }
    }

    loadPlayers();
  }, []);

  const league = demoLeague;

  const visibleMatches = matches.filter((m) =>
    filter === "ALL" ? true : m.round === filter
  );

  const rounds = ["ALL", ...new Set(matches.map((m) => m.round))];

  const leaderboard = useMemo(() => {
    return friends.map((friend) => {
      const total = matches.reduce((sum, match) => {
        return (
          sum +
          calculatePoints(
            picks[friend.id]?.[match.id],
            match
          )
        );
      }, 0);

      return {
        ...friend,
        total,
      };
    });
  }, [friends, matches, picks]);

  const pot = friends.filter((f) => f.paid).length * league.entry;

  function updatePick(matchId, field, value) {
    const clean =
      value === "" ? "" : Math.max(0, Number(value));

    setPicks((prev) => ({
      ...prev,
      [activeUser]: {
        ...prev[activeUser],
        [matchId]: {
          ...prev[activeUser]?.[matchId],
          [field]: clean,
        },
      },
    }));
  }

  function updateScore(matchId, field, value) {
    const clean =
      value === "" ? null : Math.max(0, Number(value));

    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              [field]: clean,
            }
          : m
      )
    );
  }

  return (
    <div className="app">
      <header className="hero pro">
        <div>
          <p className="eyebrow">
            Private League Code: {league.code}
          </p>

          <h1>Quiniela Mundial 2026</h1>

          <p className="sub">
            A polished private pool app for friends:
            invite code, picks, locked deadlines,
            admin scores, automatic points,
            leaderboard, Supabase-ready backend,
            and future iPhone/Android support.
          </p>

          <div className="ctaRow">
            <button onClick={() => setTab("picks")}>
              Make Picks
            </button>

            <button
              className="ghost"
              onClick={() => setTab("setup")}
            >
              Launch Checklist
            </button>
          </div>
        </div>

        <div className="card pot">
          <Trophy size={30} />

          <span>Total Pot</span>

          <strong>
            {Number.isFinite(pot)
              ? `$${pot.toLocaleString()}`
              : "$0"}
          </strong>

          <small>
            Prize split:{" "}
            {league.prize || "70% / 20% / 10%"}
          </small>
        </div>
      </header>

      <section className="stats">
        <div>
          <Users />
          <span>{friends.length} players</span>
        </div>

        <div>
          <CalendarDays />
          <span>104-match seed file</span>
        </div>

        <div>
          <Database />
          <span>
            {hasSupabase
              ? "Supabase connected"
              : "Demo mode / Supabase ready"}
          </span>
        </div>
      </section>

      <nav className="tabs">
        {["join", "picks", "leaderboard", "admin", "setup"].map(
          (t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          )
        )}
      </nav>

      {tab === "join" && (
        <main className="grid two">
          <section className="panel">
            <div className="panelTitle">
              <Lock /> Friend Login
            </div>

            <label>Name</label>
            <input />

            <label>League invite code</label>
            <input value={joinCode} readOnly />

            <button>Join League</button>
          </section>

          <section className="panel">
            <div className="panelTitle">
              <Share2 /> Invite Message
            </div>

            <p className="copyBox">
              Join my World Cup 2026 Quiniela.
              {"\n"}
              Code: {joinCode}
              {"\n"}
              Make your picks before kickoff.
              {"\n"}
              Entry: ${league.entry}
              {"\n"}
              Prize split:{" "}
              {league.prize || "70% / 20% / 10%"}
            </p>
          </section>
        </main>
      )}

      {tab === "picks" && (
        <main className="grid">
          <section className="panel sticky">
            <div className="panelTitle">
              <Lock /> My Account
            </div>

            <select
              value={activeUser}
              onChange={(e) =>
                setActiveUser(e.target.value)
              }
            >
              {friends.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <label>Round filter</label>

            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
            >
              {rounds.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </section>

          <section className="matchList">
            {visibleMatches.map((match) => {
              const pick =
                picks[activeUser]?.[match.id] || {
                  a: "",
                  b: "",
                };

              return (
                <article
                  className="matchCard"
                  key={match.id}
                >
                  <div className="meta">
                    <span>{match.round}</span>
                    <span>{match.kickoff}</span>
                  </div>

                  <div className="teams">
                    <strong>{match.teamA}</strong>

                    <div className="pickInputs">
                      <input
                        type="number"
                        value={pick.a}
                        onChange={(e) =>
                          updatePick(
                            match.id,
                            "a",
                            e.target.value
                          )
                        }
                      />

                      <span>-</span>

                      <input
                        type="number"
                        value={pick.b}
                        onChange={(e) =>
                          updatePick(
                            match.id,
                            "b",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <strong>{match.teamB}</strong>
                  </div>
                </article>
              );
            })}
          </section>
        </main>
      )}

      {tab === "leaderboard" && (
        <main className="panel full">
          <div className="panelTitle">
            <Medal /> Leaderboard
          </div>

          {leaderboard.map((player, index) => (
            <div className="leaderRow" key={player.id}>
              <span>
                #{index + 1} {player.name}
              </span>

              <strong>{player.total} pts</strong>
            </div>
          ))}
        </main>
      )}

      {tab === "admin" && (
        <main className="panel full wide">
          <div className="panelTitle">
            <Settings /> Admin Score Entry
          </div>

          {matches.map((match) => (
            <div className="adminRow" key={match.id}>
              <span>
                {match.teamA} vs {match.teamB}
              </span>

              <input
                type="number"
                value={match.scoreA ?? ""}
                onChange={(e) =>
                  updateScore(
                    match.id,
                    "scoreA",
                    e.target.value
                  )
                }
              />

              <input
                type="number"
                value={match.scoreB ?? ""}
                onChange={(e) =>
                  updateScore(
                    match.id,
                    "scoreB",
                    e.target.value
                  )
                }
              />
            </div>
          ))}
        </main>
      )}

      {tab === "setup" && (
        <main className="grid two">
          <section className="panel">
            <div className="panelTitle">
              Setup
            </div>

            <ol>
              <li>Create Supabase tables</li>
              <li>Connect Vercel environment vars</li>
              <li>Invite friends with code</li>
            </ol>
          </section>

          <section className="panel">
            <div className="panelTitle">
              Mobile App Later
            </div>

            <p>
              Ready for Capacitor + iPhone/Android
              deployment later.
            </p>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
