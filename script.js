// Initialize Telegram Web App
const tg = window.Telegram.WebApp;

// Initialize the app
tg.expand();
tg.enableClosingConfirmation();
tg.MainButton.setText("MY ACCOUNT").show();

// User data storage
let userData = {
    id: null,
    balance: 2500.00,
    successfulReferrals: 15,
    pendingReferrals: 5,
    referralLink: "https://safon.example.com/join/USER123",
    transactions: [
        { id: 1, method: "telebirr", amount: 500, status: "completed", date: "2025-05-15", account: "0912345678" },
        { id: 2, method: "cbe", amount: 1000, status: "pending", date: "2025-05-20", account: "100012345678" }
    ]
};

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
        // Set user ID
        userData.id = user.id;
        
        // Set username
        const username = user.username ? `@${user.username}` : `${user.first_name || ''} ${user.last_name || ''}`.trim();
        
        // Set avatar if available
        if (user.photo_url) {
            userAvatar.innerHTML = `<img src="${user.photo_url}" alt="User Avatar">`;
        } else {
            userAvatar.innerHTML = `<i class="fas fa-user"></i>`;
        }
    }
}

// Update UI with user data
function updateUI() {
    document.getElementById("balanceAmount").textContent = 
        userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    document.getElementById("successfulReferrals").textContent = userData.successfulReferrals;
    document.getElementById("pendingReferrals").textContent = userData.pendingReferrals;
    document.getElementById("referralLink").textContent = userData.referralLink;
    document.getElementById("availableBalance").textContent = 
        `ETB ${userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // Update transaction history
    updateTransactionHistory();
}

// Update transaction history UI
function updateTransactionHistory() {
    const container = document.getElementById("transactionsContainer");
    container.innerHTML = "";
    
    userData.transactions.forEach(transaction => {
        const transactionItem = document.createElement("div");
        transactionItem.className = "transaction-item";
        
        transactionItem.innerHTML = `
            <div class="transaction-method">${transaction.method.toUpperCase()}</div>
            <div class="transaction-amount">ETB ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div class="transaction-status ${transaction.status}">${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</div>
            <div class="transaction-date">${transaction.date}</div>
        `;
        
        container.appendChild(transactionItem);
    });
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

// Copy referral link functionality
const copyBtn = document.getElementById('copyBtn');
const referralLink = document.getElementById('referralLink');

copyBtn.addEventListener('click', function() {
    const textArea = document.createElement('textarea');
    textArea.value = referralLink.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    // Visual feedback
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    copyBtn.classList.add('copied');
    
    // Show notification
    showNotification('Referral link copied to clipboard!');
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.classList.remove('copied');
    }, 2000);
});

// Share buttons functionality
document.getElementById('shareTelegram').addEventListener('click', function() {
    const message = `Join Safon using my referral link: ${userData.referralLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(userData.referralLink)}&text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
    showNotification('Opening Telegram to share your link...');
});

document.getElementById('shareWhatsapp').addEventListener('click', function() {
    const message = `Join Safon using my referral link: ${userData.referralLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
    showNotification('Opening WhatsApp to share your link...');
});

document.getElementById('shareOthers').addEventListener('click', function() {
    if (navigator.share) {
        navigator.share({
            title: 'Safon Referral',
            text: 'Join Safon using my referral link',
            url: userData.referralLink
        })
        .then(() => showNotification('Link shared successfully'))
        .catch(error => showNotification('Error sharing link', false));
    } else {
        showNotification('Opening share options...');
    }
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
    
    if (amount > userData.balance) {
        showNotification('Amount exceeds your balance', false);
        return;
    }
    
    if (!account) {
        showNotification('Please enter your account information', false);
        return;
    }
    
    // Validate account based on method
    if (selectedMethod === 'telebirr' && !/^09[0-9]{8}$/.test(account)) {
        showNotification('Please enter a valid Telebirr phone number', false);
        return;
    }
    
    if ((selectedMethod === 'cbe' || selectedMethod === 'boa') && !/^\d{10,16}$/.test(account)) {
        showNotification('Please enter a valid account number', false);
        return;
    }
    
    if (selectedMethod === 'chapa' && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(account)) {
        showNotification('Please enter a valid email for Chapa', false);
        return;
    }
    
    // Calculate fee
    const feePercentage = getFeePercentage(selectedMethod);
    const fee = amount * feePercentage;
    const netAmount = amount - fee;
    
    // Simulate processing
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Send withdrawal request to backend
        const response = await fetch('/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.id}`
            },
            body: JSON.stringify({
                userId: userData.id,
                method: selectedMethod,
                amount: amount,
                account: account,
                fee: fee,
                netAmount: netAmount
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Update user data
            userData.balance -= amount;
            userData.transactions.push({
                id: Date.now(),
                method: selectedMethod,
                amount: amount,
                status: 'pending',
                date: new Date().toISOString().split('T')[0],
                account: account
            });
            
            // Update UI
            updateUI();
            
            // Show success message
            showNotification(`ETB ${amount.toFixed(2)} withdrawal to ${selectedMethod.toUpperCase()} requested! Net amount: ETB ${netAmount.toFixed(2)}`);
        } else {
            showNotification(`Error: ${result.message}`, false);
        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        showNotification('Error processing withdrawal. Please try again.', false);
    } finally {
        // Close modal and reset
        withdrawModal.classList.remove('active');
        this.disabled = false;
        this.innerHTML = 'Confirm Withdrawal';
        withdrawAmount.value = '';
        accountInfo.value = '';
        withdrawOptionsModal.forEach(opt => opt.classList.remove('active'));
        selectedMethod = null;
    }
});

// Get fee percentage based on method
function getFeePercentage(method) {
    const fees = {
        'telebirr': 0.01,
        'cbe': 0.015,
        'boa': 0.015,
        'chapa': 0.012
    };
    
    return fees[method] || 0;
}

// Join channel button
document.getElementById('joinBtn').addEventListener('click', function() {
    tg.showPopup({
        title: 'Join Safon Channel',
        message: 'You will be redirected to the official Safon Telegram channel',
        buttons: [
            { type: 'cancel' },
            { type: 'default', text: 'Join Channel' }
        ]
    }, function(buttonId) {
        if (buttonId !== 'cancel') {
            showNotification('Redirecting to Telegram channel...');
            setTimeout(() => {
                tg.openLink('https://t.me/safon_channel');
            }, 1500);
        }
    });
});

// Admin functionality
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const closeAdminModal = document.getElementById('closeAdminModal');
const adminLoginBtn = document.getElementById('adminLogin');

adminBtn.addEventListener('click', function() {
    adminModal.classList.add('active');
});

closeAdminModal.addEventListener('click', function() {
    adminModal.classList.remove('active');
});

adminLoginBtn.addEventListener('click', async function() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (!username || !password) {
        showNotification('Please enter both username and password', false);
        return;
    }
    
    try {
        // Send admin login request to backend
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Admin login successful!');
            // In a real app, redirect to admin dashboard
            setTimeout(() => {
                adminModal.classList.remove('active');
                // Redirect to admin dashboard
                // window.location.href = '/admin/dashboard';
            }, 1500);
        } else {
            showNotification(`Admin login failed: ${result.message}`, false);
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showNotification('Error during admin login. Please try again.', false);
    }
});

// Main button handler
tg.MainButton.onClick(function() {
    showNotification('Opening your account dashboard...');
    // In a real app, this would navigate to account page
});

// Initialize theme and user
setupTheme();
setupUser();
updateUI();

// Theme change handler
tg.onEvent('themeChanged', setupTheme);

// Simulate loading
setTimeout(() => {
    showNotification('Welcome to Safon! Start earning with referrals.');
}, 1000);