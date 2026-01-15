import { useEffect, useState } from 'react';
import api from '../apiClient.js';
import { useAuth } from '../AuthContext.jsx';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchTrades = async () => {
      try {
        const res = await api.get('/trades');
        setTrades(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
    fetchTrades();
  }, []);

  if (!profile) {
    return <p className="muted">Loading profile...</p>;
  }

  const totalTrades = profile.tradeStats?.tradeCount ?? (profile.portfolioHistory || []).length;

  return (
    <div className="profile">
      <section className="panel">
        <h2>Profile</h2>
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Balance:</strong> ${profile.balance.toFixed(2)}</p>
      </section>

      <section className="panel">
        <h3>Holdings</h3>
        {Object.keys(profile.holdings || {}).length === 0 ? (
          <p className="muted">No holdings yet.</p>
        ) : (
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(profile.holdings).map(([sym, qty]) => (
                <tr key={sym}>
                  <td>{sym}</td>
                  <td>{qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h3>Achievements</h3>
        {(!profile.achievements || profile.achievements.length === 0) && totalTrades === 0 ? (
          <p className="muted">Place your first trade to start unlocking achievements.</p>
        ) : (
          <>
            <ul className="achievements-list">
              {profile.achievements?.map((ach) => (
                <li key={ach.key} className={ach.unlocked ? 'achievement unlocked' : 'achievement'}>
                  <div className="achievement-header">
                    <span className="achievement-title">{ach.title}</span>
                    <span className="achievement-status">
                      {ach.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <p className="achievement-desc">{ach.description}</p>
                </li>
              ))}
            </ul>
            {profile.tradeStats && (
              <div className="trade-stats">
                <p><strong>Total Trades:</strong> {profile.tradeStats.tradeCount}</p>
                <p><strong>Total Volume:</strong> ${profile.tradeStats.totalVolume.toFixed(2)}</p>
                <p><strong>Coins Traded:</strong> {profile.tradeStats.uniqueSymbols}</p>
              </div>
            )}
          </>
        )}
      </section>

      <section className="panel">
        <h3>Recent Trades</h3>
        {trades.length === 0 ? (
          <p className="muted">No trades yet. Use the dashboard to place your first simulated trade.</p>
        ) : (
          <table className="trades-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Side</th>
                <th>Symbol</th>
                <th>Amount</th>
                <th>Price</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                  <td className={t.side === 'buy' ? 'buy' : 'sell'}>{t.side.toUpperCase()}</td>
                  <td>{t.symbol}</td>
                  <td>{t.amount}</td>
                  <td>${t.price.toFixed(2)}</td>
                  <td>${t.value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
