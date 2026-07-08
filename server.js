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

// Headers for all Paystack requests
const headers = {
  Authorization: `Bearer ${PAYSTACK_SECRET}`,
  'Content-Type': 'application/json'
};

app.get('/', (req, res) => {
  res.json({ message: 'My Game Backend is Live!' });
});

// STEP 1: Create Transfer Recipient
// Send: { name, account_number, bank_code }
app.post('/create-recipient', async (req, res) => {
  const { name, account_number, bank_code } = req.body;
  try {
    const response = await axios.post('https://api.paystack.co/transferrecipient', {
      type: "nuban",
      name: name,
      account_number: account_number,
      bank_code: bank_code,
      currency: "NGN"
    }, { headers });
    res.json(response.data);
  } catch (error) {
    res.status(500).json(error.response.data);
  }
});

// STEP 2: Withdraw / Send Money
// Send: { recipient_code, amount }  amount is in kobo. 5000 Naira = 500000
app.post('/withdraw', async (req, res) => {
  const { recipient_code, amount } = req.body;
  try {
    const response = await axios.post('https://api.paystack.co/transfer', {
      source: "balance",
      amount: amount, // must be in kobo
      recipient: recipient_code,
      reason: "Game Withdrawal"
    }, { headers });
    res.json(response.data);
  } catch (error) {
    res.status(500).json(error.response.data);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
