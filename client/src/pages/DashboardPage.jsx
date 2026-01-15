import { useEffect, useMemo, useState } from 'react';
import api from '../apiClient.js';
import { useAuth } from '../AuthContext.jsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS = ['#00bcd4', '#ff9800', '#4caf50'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [prices, setPrices] = useState([]);
  const [portfolio, setPortfolio] = useState({ balance: 0, holdings: {}, portfolioHistory: [] });
  const [news, setNews] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [tradeSide, setTradeSide] = useState('buy');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchPrices(), fetchPortfolio(), fetchNews()]);
  };

  const fetchPrices = async () => {
    try {
      const res = await api.get('/market/prices');
      setPrices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await api.get('/portfolio');
      setPortfolio(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNews = async () => {
    try {
      const res = await api.get('/market/news');
      setNews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setLoading(true);
    setError('');
    try {
      const priceObj = prices.find((p) => p.symbol === selectedSymbol);
      const price = priceObj ? priceObj.price : 0;
      const res = await api.post('/trade', {
        symbol: selectedSymbol,
        side: tradeSide,
        amount: Number(amount),
        price,
      });
      setPortfolio(res.data);
      setAmount('');
    } catch (err) {
      setError(err.response?.data?.message || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const portfolioChartData = useMemo(() => {
    return (portfolio.portfolioHistory || []).map((entry) => ({
      time: new Date(entry.timestamp).toLocaleTimeString(),
      total: entry.totalValue,
    }));
  }, [portfolio.portfolioHistory]);

  const pieData = useMemo(() => {
    const holdings = portfolio.holdings || {};
    const total = Object.entries(holdings).reduce(
      (sum, [sym, qty]) => {
        const priceObj = prices.find((p) => p.symbol === sym);
        const v = (priceObj ? priceObj.price : 0) * qty;
        return sum + v;
      },
      0,
    );
    if (total === 0) return [];
    return Object.entries(holdings).map(([sym, qty]) => {
      const priceObj = prices.find((p) => p.symbol === sym);
      const value = (priceObj ? priceObj.price : 0) * qty;
      return {
        name: sym,
        value: Number(value.toFixed(2)),
        percent: total ? Number(((value / total) * 100).toFixed(1)) : 0,
        amount: qty,
      };
    });
  }, [portfolio.holdings, prices]);

  const portfolioBreakdown = useMemo(() => {
    return pieData.map((item) => ({
      symbol: item.name,
      amount: item.amount,
      value: item.value,
      percent: item.percent,
    }));
  }, [pieData]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Hello, {user?.name}</h2>
          <p className="muted">Practice real-time trading with your virtual portfolio.</p>
        </div>
        <div className="balance-card">
          <span className="label">Wallet Balance</span>
          <span className="value">${portfolio.balance?.toFixed(2)}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel panel-market">
          <h3>Market Overview</h3>
          <div className="coins-grid">
            {prices.map((coin) => (
              <div key={coin.id} className="coin-card">
                <div className="coin-header">
                  <span className="coin-name">{coin.name}</span>
                  <span className="coin-symbol">{coin.symbol}</span>
                </div>
                <div className="coin-price">${coin.price.toLocaleString()}</div>
                <div className={`coin-change ${coin.change24h >= 0 ? 'positive' : 'negative'}`}>
                  {coin.change24h?.toFixed(2)}%
                </div>
                <div className="coin-meta">
                  <span>MC: ${(coin.marketCap / 1_000_000_000).toFixed(2)}B</span>
                  <span>Reward: {(Math.max(0, coin.change24h) / 10).toFixed(2)} pts</span>
                </div>
                <div className="sparkline-wrapper">
                  {coin.sparkline && coin.sparkline.length > 0 && (
                    <ResponsiveContainer width="100%" height={40}>
                      <LineChart data={coin.sparkline.map((v, idx) => ({ idx, v }))}>
                        <Line type="monotone" dataKey="v" stroke="#00bcd4" dot={false} strokeWidth={1} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel panel-trade">
          <h3>Simulated Trade</h3>
          <form onSubmit={handleTrade} className="trade-form">
            <div className="form-row">
              <label>
                Coin
                <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="USDT">USDT</option>
                  <option value="BNB">BNB</option>
                  <option value="SOL">SOL</option>
                </select>
              </label>
              <label>
                Side
                <select value={tradeSide} onChange={(e) => setTradeSide(e.target.value)}>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </label>
            </div>
            <div className="form-row">
              <label className="full-width">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Placing trade...' : 'Execute Trade'}
            </button>
          </form>
        </section>

        <section className="panel panel-portfolio-value">
          <h3>Portfolio Overview</h3>
          {portfolioChartData.length === 0 ? (
            <p className="muted">Make a few trades to see your portfolio trend over time.</p>
          ) : (
            <div className="portfolio-overview">
              <div className="portfolio-chart-wrapper">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={portfolioChartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#4caf50" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {portfolioBreakdown.length > 0 && (
                <div className="portfolio-table-wrapper">
                  <table className="portfolio-table">
                    <thead>
                      <tr>
                        <th>Coin</th>
                        <th>Amount</th>
                        <th>Value</th>
                        <th>Portfolio %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioBreakdown.map((row) => (
                        <tr key={row.symbol}>
                          <td>{row.symbol}</td>
                          <td>{row.amount}</td>
                          <td>${row.value.toLocaleString()}</td>
                          <td>{row.percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="panel panel-news news-panel">
          <h3>Live Crypto News</h3>
          {news.length === 0 ? (
            <p className="muted">Fetching latest market headlines...</p>
          ) : (
            <ul className="news-list">
              {news.map((item, idx) => (
                <li key={idx} className="news-item">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <div className="news-meta">
                    <span>{item.source}</span>
                    {item.publishedAt && (
                      <span>{new Date(item.publishedAt).toLocaleString()}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel panel-wallet">
          <h3>Wallet Allocation</h3>
          {pieData.length === 0 ? (
            <p className="muted">Your holdings are empty. Try buying some coins.</p>
          ) : (
            <div className="pie-wrapper">
              <div className="pie-chart-wrapper">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={pieData}
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="legend">
                {pieData.map((item, idx) => (
                  <li key={item.name}>
                    <span
                      className="legend-color"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    {item.name}: ${item.value.toLocaleString()} ({item.percent}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
