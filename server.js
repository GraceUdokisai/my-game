import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

app.get('/', (req, res) => {
  res.json({ message: 'My Game Backend is Live!' });
});

app.post('/withdraw', async (req, res) => {
  const { email, amount } = req.body;
  try {
    const response = await axios.post('https://api.paystack.co/transfer', {
      source: "balance",
      amount: amount,
      recipient: email
    }, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json(error.response.data);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
