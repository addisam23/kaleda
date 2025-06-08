const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Simulated database
let users = {
  123456789: {
    id: 123456789,
    balance: 2500,
    referrals: 15,
    pending: 5,
    referralCode: 'USER123'
  }
};

// Middleware to verify Telegram data
const verifyTelegramData = (req, res, next) => {
  const initData = req.headers['telegram-init-data'];
  if (!initData) return res.status(401).send('Unauthorized');
  
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const dataToCheck = [];
  
  params.sort();
  params.forEach((val, key) => {
    if (key !== 'hash') dataToCheck.push(`${key}=${val}`);
  });
  
  const secret = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN);
  const calculatedHash = crypto
    .createHmac('sha256', secret.digest())
    .update(dataToCheck.join('\n'))
    .digest('hex');

  if (calculatedHash === hash) {
    req.telegramUser = JSON.parse(params.get('user'));
    next();
  } else {
    res.status(401).send('Invalid Telegram data');
  }
};

// Middleware to serve HTML
app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Safon - Referral Management</title>
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
          /* All CSS styles from original file */
          /* ... (Paste full CSS content here) ... */
      </style>
  </head>
  <body>
      <!-- HTML content from original file -->
      <!-- ... (Paste full HTML content here) ... -->
      
      <script>
          // Initialize Telegram Web App
          const tg = window.Telegram.WebApp;
          
          // Initialize the app
          tg.expand();
          tg.enableClosingConfirmation();
          tg.MainButton.setText("MY ACCOUNT").show();
          
          // Set up theme based on Telegram
          function setupTheme() {
              if (tg.colorScheme === 'dark') {
                  document.body.classList.add('dark-theme');
              }
          }
          
          // Set user data from Telegram
          function setupUser() {
              const user = tg.initDataUnsafe.user;
              const userAvatar = document.querySelector('.user-avatar');
              
              if (user) {
                  // Set avatar if available
                  if (user.photo_url) {
                      userAvatar.innerHTML = `<img src="${user.photo_url}" alt="User Avatar">`;
                  } else {
                      userAvatar.innerHTML = `<i class="fas fa-user"></i>`;
                  }
              }
          }
          
          // Show notification function
          function showNotification(message, isSuccess = true) {
              const notification = document.getElementById('notification');
              notification.innerHTML = `<i class="fas fa-${isSuccess ? 'check-circle' : 'exclamation-circle'}"></i> <span>${message}</span>`;
              notification.style.background = isSuccess ? 'var(--success)' : '#e74c3c';
              notification.classList.add('show');
              
              setTimeout(() => {
                  notification.classList.remove('show');
              }, 3000);
          }
          
          // API helper function
          async function fetchWithAuth(url, options = {}) {
              options.headers = options.headers || {};
              options.headers['Telegram-Init-Data'] = Telegram.WebApp.initData;
              return fetch(url, options);
          }
          
          // Load user data from backend
          async function loadUserData() {
              try {
                  const response = await fetchWithAuth('/api/user');
                  const userData = await response.json();
                  
                  // Update UI with real data
                  document.getElementById('referralLink').textContent = 
                      `https://safon.example.com/join/${userData.referralCode}`;
                  document.querySelector('.stat-value').textContent = userData.referrals;
                  document.querySelectorAll('.stat-value')[1].textContent = userData.pending;
                  document.querySelector('.balance-amount span:last-child').textContent = 
                      userData.balance.toFixed(2);
                  
              } catch (error) {
                  showNotification('Failed to load data', false);
              }
          }
          
          // Copy referral link functionality
          document.getElementById('copyBtn').addEventListener('click', function() {
              const referralLink = document.getElementById('referralLink').textContent;
              navigator.clipboard.writeText(referralLink);
              
              // Visual feedback
              const originalText = this.innerHTML;
              this.innerHTML = '<i class="fas fa-check"></i> Copied!';
              this.classList.add('copied');
              
              showNotification('Referral link copied to clipboard!');
              
              setTimeout(() => {
                  this.innerHTML = originalText;
                  this.classList.remove('copied');
              }, 2000);
          });
          
          // Withdrawal functionality
          let selectedMethod = null;
          const withdrawBtn = document.getElementById('withdrawBtn');
          const withdrawModal = document.getElementById('withdrawModal');
          const closeModal = document.getElementById('closeModal');
          const confirmWithdraw = document.getElementById('confirmWithdraw');
          const withdrawAmount = document.getElementById('withdrawAmount');
          const accountInfo = document.getElementById('accountInfo');
          
          // Get withdrawal options in modal
          const withdrawOptionsModal = document.querySelectorAll('.withdraw-option-modal');
          
          // Select withdrawal method in modal
          withdrawOptionsModal.forEach(option => {
              option.addEventListener('click', function() {
                  withdrawOptionsModal.forEach(opt => opt.classList.remove('active'));
                  this.classList.add('active');
                  selectedMethod = this.dataset.method;
                  
                  // Update placeholder based on method
                  if (selectedMethod === 'telebirr') {
                      accountInfo.placeholder = "Telebirr phone number";
                  } else if (selectedMethod === 'cbe') {
                      accountInfo.placeholder = "CBE account number";
                  } else if (selectedMethod === 'boa') {
                      accountInfo.placeholder = "BOA account number";
                  } else if (selectedMethod === 'chapa') {
                      accountInfo.placeholder = "Chapa account number";
                  }
              });
          });
          
          // Open withdrawal modal
          withdrawBtn.addEventListener('click', function() {
              // Reset modal state
              withdrawOptionsModal.forEach(opt => opt.classList.remove('active'));
              selectedMethod = null;
              withdrawAmount.value = '';
              accountInfo.value = '';
              accountInfo.placeholder = "Phone number or account ID";
              
              withdrawModal.classList.add('active');
          });
          
          // Close modal
          closeModal.addEventListener('click', function() {
              withdrawModal.classList.remove('active');
          });
          
          // Confirm withdrawal
          confirmWithdraw.addEventListener('click', async function() {
              if (!selectedMethod) {
                  showNotification('Please select a withdrawal method', false);
                  return;
              }
              
              const amount = parseFloat(withdrawAmount.value);
              const account = accountInfo.value.trim();
              
              if (!amount || amount <= 0) {
                  showNotification('Please enter a valid amount', false);
                  return;
              }
              
              // Disable button during processing
              this.disabled = true;
              this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
              
              try {
                  const response = await fetchWithAuth('/api/withdraw', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount, method: selectedMethod, account })
                  });
                  
                  const result = await response.json();
                  
                  if (result.success) {
                      showNotification(result.message);
                      withdrawModal.classList.remove('active');
                      
                      // Update balance display
                      document.querySelector('.balance-amount span:last-child').textContent = 
                          result.newBalance.toFixed(2);
                  } else {
                      showNotification(result.error || 'Withdrawal failed', false);
                  }
              } catch (error) {
                  showNotification('Withdrawal request failed', false);
              } finally {
                  this.disabled = false;
                  this.innerHTML = 'Confirm Withdrawal';
                  
                  // Reset form
                  withdrawAmount.value = '';
                  accountInfo.value = '';
                  withdrawOptionsModal.forEach(opt => opt.classList.remove('active'));
                  selectedMethod = null;
              }
          });
          
          // Initialize theme and user
          setupTheme();
          setupUser();
          loadUserData();
          
          // Theme change handler
          tg.onEvent('themeChanged', setupTheme);
          
          // Show welcome message
          setTimeout(() => {
              showNotification('Welcome to Safon! Start earning with referrals.');
          }, 1000);
      </script>
  </body>
  </html>
  `);
});

// API endpoint to get user data
app.get('/api/user', verifyTelegramData, (req, res) => {
  const userId = req.telegramUser.id;
  const userData = users[userId] || {
    id: userId,
    balance: 2500,
    referrals: 15,
    pending: 5,
    referralCode: `USER${Math.floor(100000 + Math.random() * 900000)}`
  };
  
  users[userId] = userData;
  res.json(userData);
});

// API endpoint to process withdrawals
app.post('/api/withdraw', verifyTelegramData, express.json(), (req, res) => {
  const userId = req.telegramUser.id;
  const { amount, method, account } = req.body;
  
  // Validate input
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  if (!method || !['telebirr', 'cbe', 'boa', 'chapa'].includes(method)) {
    return res.status(400).json({ error: 'Invalid method' });
  }
  
  if (!account || account.length < 5) {
    return res.status(400).json({ error: 'Invalid account information' });
  }
  
  // Get user
  const user = users[userId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check balance
  if (amount > user.balance) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Process withdrawal (simulated)
  user.balance -= amount;
  
  // Return success response
  res.json({
    success: true,
    message: `ETB ${amount} withdrawal to ${method.toUpperCase()} requested!`,
    newBalance: user.balance,
    transactionId: `TX-${Date.now()}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});