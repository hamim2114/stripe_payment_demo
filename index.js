const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');

require('dotenv').config();
const Stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({origin: ['http://localhost:4000','https://stripe-payment-demo-client-xfr9.vercel.app'], credentials: false}));

const port = 5000;

app.listen(port, (error) => {
  if (error) throw error;
  console.log('server on port 5000');
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APP_PASSWORD,
  },
});

app.post('/payment', async (req, res) => {
  let status, error;
  const { token, amount } = req.body;
  try {
    const charge = await Stripe.charges.create({
      source: token.id,
      amount,
      currency: 'usd',
      receipt_email: token.email,
    });

    const mailOptions = {
      from: 'hamim2114@gmail.com',
      to: token.email,
      subject: 'Payment Receipt from stripe',
      html: `
      <p>Thank you for your purchase of $${amount / 100}.</p>
      <p>Please find your receipt <a href="${charge.receipt_url}">here</a>.</p>
    `,
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    status = 'success';
  } catch (err) {
    console.log(err);
    status = 'Failure';
  }
  res.json({ error, status });
});

app.use('/', (req, res) => {
  res.send('Server running on port 5000')
})
