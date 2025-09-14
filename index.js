const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.QIKINK_SECRET;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

let tokenCache = { token: null, expiry: 0 };

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiry) {
    return tokenCache.token;
  }

  try {
    const response = await axios.post('https://api.qikink.com/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials'
    });

    tokenCache.token = response.data.access_token;
    tokenCache.expiry = Date.now() + (response.data.expires_in - 60) * 1000;
    return tokenCache.token;
  } catch (error) {
    console.error('Error fetching access token:', error.response?.data || error.message);
    throw new Error('Unable to fetch token');
  }
}

app.get('/track/:orderId', async (req, res) => {
  try {
    const token = await getAccessToken();
    const orderId = req.params.orderId;

    const response = await axios.get(`https://api.qikink.com/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching order:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
