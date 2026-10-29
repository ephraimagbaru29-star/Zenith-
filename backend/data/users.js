const bcrypt = require('bcryptjs');

// In-memory user store (replace with a real DB in production)
// Passwords are pre-hashed: "password123" for both users
const users = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@zenith.com',
    // bcrypt hash of "password123"
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    accountNumber: 'ZNT-0042-8871',
    balance: 24530.75,
    currency: 'USD',
    accountType: 'Checking',
    transactions: [
      { id: 't1', type: 'credit', description: 'Salary Deposit', amount: 5000.00, date: '2026-09-20', balance: 24530.75 },
      { id: 't2', type: 'debit',  description: 'Rent Payment',   amount: 1500.00, date: '2026-09-18', balance: 19530.75 },
      { id: 't3', type: 'debit',  description: 'Grocery Store',  amount: 120.50,  date: '2026-09-15', balance: 21030.75 },
      { id: 't4', type: 'credit', description: 'Freelance Work', amount: 800.00,  date: '2026-09-10', balance: 21151.25 },
      { id: 't5', type: 'debit',  description: 'Utility Bill',   amount: 200.00,  date: '2026-09-05', balance: 20351.25 },
    ],
  },
  {
    id: '2',
    name: 'Maria Garcia',
    email: 'maria@zenith.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    accountNumber: 'ZNT-0091-3345',
    balance: 8210.00,
    currency: 'USD',
    accountType: 'Savings',
    transactions: [
      { id: 't1', type: 'credit', description: 'Transfer In',    amount: 2000.00, date: '2026-09-22', balance: 8210.00 },
      { id: 't2', type: 'debit',  description: 'Online Purchase', amount: 89.99,  date: '2026-09-19', balance: 6210.00 },
    ],
  },
];

module.exports = users;
