import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const COINS = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana'];

router.get('/prices', async (req, res) => {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS.join(',')}&sparkline=true`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko error: ${response.status}`);
    }

    const data = await response.json();

    const mapped = data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      marketCap: coin.market_cap,
      sparkline: coin.sparkline_in_7d?.price || []
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Failed to fetch market data from CoinGecko, using fallback.', err.message || err);

    const fallback = [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 67000,
        change24h: 2.35,
        marketCap: 1_300_000_000_000,
        sparkline: [],
      },
      {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3200,
        change24h: -1.1,
        marketCap: 380_000_000_000,
        sparkline: [],
      },
      {
        id: 'tether',
        symbol: 'USDT',
        name: 'Tether',
        price: 1,
        change24h: 0,
        marketCap: 110_000_000_000,
        sparkline: [],
      },
    ];

    res.json(fallback);
  }
});

router.get('/news', async (req, res) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      throw new Error('NEWS_API_KEY not configured in environment');
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const url =
      `https://newsapi.org/v2/everything?` +
      `q=crypto%20OR%20bitcoin%20OR%20ethereum&` +
      `from=${today}&language=en&sortBy=publishedAt&pageSize=8&apiKey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    const items = (data.articles || []).map((a) => ({
      title: a.title,
      description: a.description || a.content || '',
      source: a.source?.name || 'NewsAPI',
      url: a.url,
      publishedAt: a.publishedAt,
    }));

    if (!items.length) {
      const now = new Date().toISOString();
      const fallbackNews = [
        {
          title: 'CryptoSim virtual market update',
          description:
            'Practice trading with simulated BTC, ETH, USDT, BNB and SOL while tracking your portfolio in real time.',
          source: 'CryptoSim News Bot',
          publishedAt: now,
        },
        {
          title: 'Market education tip',
          description:
            'Watch how your simulated portfolio value responds to price swings without risking real capital.',
          source: 'CryptoSim Academy',
          publishedAt: now,
        },
      ];

      return res.json(fallbackNews);
    }

    res.json(items);
  } catch (err) {
    console.error('Failed to fetch news from NewsAPI, using fallback.', err.message || err);

    const now = new Date().toISOString();
    const fallbackNews = [
      {
        title: 'CryptoSim virtual market update',
        description:
          'Practice trading with simulated BTC, ETH, USDT, BNB and SOL while tracking your portfolio in real time.',
        source: 'CryptoSim News Bot',
        publishedAt: now,
      },
      {
        title: 'Market education tip',
        description:
          'Watch how your simulated portfolio value responds to price swings without risking real capital.',
        source: 'CryptoSim Academy',
        publishedAt: now,
      },
    ];

    res.json(fallbackNews);
  }
});

export default router;
