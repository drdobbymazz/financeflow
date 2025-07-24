// Global variables
let transactions = [];
let budgets = [];
let goals = [];
let editingTransaction = null;
let editingBudget = null;
let editingGoal = null;

// Income categories
const incomeCategories = [
    'Part-time Job',
    'Family Support',
    'Student Loan',
    'Freelance',
    'Scholarship',
    'Other Income'
];

// Expense categories
const expenseCategories = [
    'Accommodation',
    'Food & Groceries',
    'Textbooks',
    'Transportation',
    'Entertainment',
    'Utilities',
    'Clothing',
    'Health',
    'Other Expenses'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    updateDashboard();
    showPage('dashboard');
    setDefaultDate();
});

// Load data from localStorage
function loadData() {
    try {
        const storedTransactions = localStorage.getItem('financeflow_transactions');
        if (storedTransactions) {
            transactions = JSON.parse(storedTransactions);
        }

        const storedBudgets = localStorage.getItem('financeflow_budgets');
        if (storedBudgets) {
            budgets = JSON.parse(storedBudgets);
        }

        const storedGoals = localStorage.getItem('financeflow_goals');
        if (storedGoals) {
            goals = JSON.parse(storedGoals);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data', 'error');
    }
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('financeflow_transactions', JSON.stringify(transactions));
        localStorage.setItem('financeflow_budgets', JSON.stringify(budgets));
        localStorage.setItem('financeflow_goals', JSON.stringify(goals));
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Error saving data', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Close sidebar on mobile
            if (window.innerWidth < 1024) {
                toggleSidebar();
            }
        });
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });

    // Set today's date as default
    setDefaultDate();
}

// Show page
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update page content based on page
    switch(pageId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'transactions':
            displayTransactions();
            break;
        case 'budgets':
            displayBudgets();
            break;
        case 'goals':
            displayGoals();
            break;
        case 'analytics':
            updateAnalytics();
            break;
    }
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

// Update dashboard
function updateDashboard() {
    updateStatistics();
    updateRecentTransactions();
    updateBudgetOverview();
}

// Update statistics
function updateStatistics() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Calculate totals
    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const amount = parseFloat(transaction.amount);

        if (transaction.type === 'income') {
            totalBalance += amount;
            if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                monthlyIncome += amount;
            }
        } else {
            totalBalance -= amount;
            if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                monthlyExpenses += amount;
            }
        }
    });

    // Calculate total savings goal progress
    const totalSavingsGoal = goals.reduce((sum, goal) => sum + parseFloat(goal.current || 0), 0);

    // Update DOM
    document.getElementById('currentBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('monthlyIncome').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyExpenses);
    document.getElementById('savingsProgress').textContent = formatCurrency(totalSavingsGoal);
}

// Update recent transactions
function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    if (recentTransactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions yet. Add your first transaction!</p>';
        return;
    }

    container.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-icon ${transaction.type}">
                ${transaction.type === 'income' ? '💰' : '💸'}
            </div>
            <div class="transaction-details">
                <h4>${transaction.description}</h4>
                <p>${transaction.category} • ${formatDate(transaction.date)}</p>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
        </div>
    `).join('');
}

// Update budget overview
function updateBudgetOverview() {
    const container = document.getElementById('budgetOverview');
    
    if (budgets.length === 0) {
        container.innerHTML = '<p class="empty-state">No budgets set. Create your first budget!</p>';
        return;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const budgetData = budgets.map(budget => {
        const spent = transactions
            .filter(t => 
                t.type === 'expense' && 
                t.category === budget.category &&
                new Date(t.date).getMonth() === currentMonth &&
                new Date(t.date).getFullYear() === currentYear
            )
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const percentage = (spent / parseFloat(budget.amount)) * 100;
        return { ...budget, spent, percentage };
    });

    container.innerHTML = budgetData.map(budget => `
        <div class="budget-item">
            <div class="budget-header">
                <h4>${budget.category}</h4>
                <span class="budget-amount">${formatCurrency(budget.spent)} / ${formatCurrency(budget.amount)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${budget.percentage > 100 ? 'over-budget' : ''}" 
                     style="width: ${Math.min(budget.percentage, 100)}%"></div>
            </div>
            <div class="progress-text">
                <span>${budget.percentage.toFixed(1)}% used</span>
                <span>${formatCurrency(Math.max(0, parseFloat(budget.amount) - budget.spent))} remaining</span>
            </div>
        </div>
    `).slice(0, 3).join('');
}

// Display transactions
function displayTransactions() {
    const container = document.getElementById('transactionsList');
    let filteredTransactions = [...transactions];

    // Apply filters
    const searchTerm = document.getElementById('searchTransactions')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('filterCategory')?.value || '';
    const typeFilter = document.getElementById('filterType')?.value || '';

    if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(t => 
            t.description.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    if (categoryFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }

    if (typeFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredTransactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions found.</p>';
        return;
    }

    container.innerHTML = filteredTransactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-icon ${transaction.type}">
                ${transaction.type === 'income' ? '💰' : '💸'}
            </div>
            <div class="transaction-details">
                <h4>${transaction.description}</h4>
                <p>${transaction.category} • ${formatDate(transaction.date)}</p>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                <button class="btn btn-secondary btn-small" onclick="editTransaction('${transaction.id}')">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteTransaction('${transaction.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Display budgets
function displayBudgets() {
    const container = document.getElementById('budgetsList');
    
    if (budgets.length === 0) {
        container.innerHTML = '<p class="empty-state">No budgets created yet. Set up your first budget to track spending!</p>';
        return;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const budgetData = budgets.map(budget => {
        const spent = transactions
            .filter(t => 
                t.type === 'expense' && 
                t.category === budget.category &&
                new Date(t.date).getMonth() === currentMonth &&
                new Date(t.date).getFullYear() === currentYear
            )
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const percentage = (spent / parseFloat(budget.amount)) * 100;
        return { ...budget, spent, percentage };
    });

    container.innerHTML = budgetData.map(budget => `
        <div class="budget-item">
            <div class="budget-header">
                <h4>${budget.category}</h4>
                <div class="budget-actions">
                    <button class="btn btn-secondary btn-small" onclick="editBudget('${budget.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteBudget('${budget.id}')">Delete</button>
                </div>
            </div>
            <div class="budget-amount">${formatCurrency(budget.spent)} / ${formatCurrency(budget.amount)}</div>
            <div class="progress-bar">
                <div class="progress-fill ${budget.percentage > 100 ? 'over-budget' : ''}" 
                     style="width: ${Math.min(budget.percentage, 100)}%"></div>
            </div>
            <div class="progress-text">
                <span>${budget.percentage.toFixed(1)}% used</span>
                <span>${formatCurrency(Math.max(0, parseFloat(budget.amount) - budget.spent))} remaining</span>
            </div>
        </div>
    `).join('');
}

// Display goals
function displayGoals() {
    const container = document.getElementById('goalsList');
    
    if (goals.length === 0) {
        container.innerHTML = '<p class="empty-state">No savings goals set. Create your first goal to start saving!</p>';
        return;
    }

    container.innerHTML = goals.map(goal => {
        const percentage = (parseFloat(goal.current || 0) / parseFloat(goal.target)) * 100;
        const isCompleted = percentage >= 100;
        
        return `
            <div class="goal-item">
                <div class="goal-header">
                    <h4>${goal.name}</h4>
                    <div class="goal-deadline">
                        ${goal.deadline ? `Target: ${formatDate(goal.deadline)}` : 'No deadline'}
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="goal-amounts">
                        <span class="goal-current">${formatCurrency(goal.current || 0)}</span>
                        <span class="goal-target">of ${formatCurrency(goal.target)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${isCompleted ? 'completed' : ''}" 
                             style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${percentage.toFixed(1)}% complete</span>
                        <span>${formatCurrency(Math.max(0, parseFloat(goal.target) - parseFloat(goal.current || 0)))} remaining</span>
                    </div>
                </div>
                <div class="goal-actions">
                    <button class="btn btn-success btn-small" onclick="updateGoalProgress('${goal.id}')">Update Progress</button>
                    <button class="btn btn-secondary btn-small" onclick="editGoal('${goal.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteGoal('${goal.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Update analytics
function updateAnalytics() {
    updateCategoryChart();
    updateMonthlyChart();
}

// Update category chart
function updateCategoryChart() {
    const container = document.getElementById('categoryChart');
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="empty-state">Add some transactions to see spending analytics!</p>';
        return;
    }

    // Calculate spending by category
    const categorySpending = {};
    transactions.filter(t => t.type === 'expense').forEach(transaction => {
        const category = transaction.category;
        categorySpending[category] = (categorySpending[category] || 0) + parseFloat(transaction.amount);
    });

    // Sort categories by spending
    const sortedCategories = Object.entries(categorySpending)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8); // Top 8 categories

    if (sortedCategories.length === 0) {
        container.innerHTML = '<p class="empty-state">No expense transactions found.</p>';
        return;
    }

    const maxAmount = Math.max(...sortedCategories.map(([,amount]) => amount));

    container.innerHTML = sortedCategories.map(([category, amount]) => {
        const percentage = (amount / maxAmount) * 100;
        return `
            <div class="chart-bar">
                <div class="chart-label">${category}</div>
                <div class="chart-bar-fill">
                    <div class="chart-bar-progress" style="width: ${percentage}%"></div>
                </div>
                <div class="chart-value">${formatCurrency(amount)}</div>
            </div>
        `;
    }).join('');
}

// Update monthly chart
function updateMonthlyChart() {
    const container = document.getElementById('monthlyChart');
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="empty-state">Add transactions over multiple months to see trends!</p>';
        return;
    }

    // Calculate monthly totals
    const monthlyData = {};
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
            monthlyData[monthKey].income += parseFloat(transaction.amount);
        } else {
            monthlyData[monthKey].expenses += parseFloat(transaction.amount);
        }
    });

    // Sort by month and take last 6 months
    const sortedMonths = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6);

    if (sortedMonths.length === 0) {
        container.innerHTML = '<p class="empty-state">No monthly data available.</p>';
        return;
    }

    const maxAmount = Math.max(...sortedMonths.map(([,data]) => Math.max(data.income, data.expenses)));

    container.innerHTML = sortedMonths.map(([month, data]) => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        const incomePercentage = (data.income / maxAmount) * 100;
        const expensePercentage = (data.expenses / maxAmount) * 100;
        
        return `
            <div class="chart-bar">
                <div class="chart-label">${monthName}</div>
                <div class="chart-bar-fill">
                    <div class="chart-bar-progress" style="width: ${incomePercentage}%; background: var(--success-color);" title="Income: ${formatCurrency(data.income)}"></div>
                </div>
                <div class="chart-value">${formatCurrency(data.income - data.expenses)}</div>
            </div>
            <div class="chart-bar">
                <div class="chart-label"></div>
                <div class="chart-bar-fill">
                    <div class="chart-bar-progress" style="width: ${expensePercentage}%; background: var(--danger-color);" title="Expenses: ${formatCurrency(data.expenses)}"></div>
                </div>
                <div class="chart-value">${formatCurrency(data.expenses)}</div>
            </div>
        `;
    }).join('');
}

// Filter transactions
function filterTransactions() {
    displayTransactions();
}

// Show transaction modal
function showTransactionModal(transactionId = null) {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    const title = document.getElementById('transactionModalTitle');
    
    if (transactionId) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
            editingTransaction = transactionId;
            title.textContent = 'Edit Transaction';
            
            document.getElementById('transactionAmount').value = transaction.amount;
            document.getElementById('transactionDescription').value = transaction.description;
            document.getElementById('transactionCategory').value = transaction.category;
            document.getElementById('transactionType').value = transaction.type;
            document.getElementById('transactionDate').value = transaction.date;
            
            updateCategoryOptions();
        }
    } else {
        editingTransaction = null;
        title.textContent = 'Add Transaction';
        form.reset();
        setDefaultDate();
    }
    
    modal.classList.add('show');
}

// Show budget modal
function showBudgetModal(budgetId = null) {
    const modal = document.getElementById('budgetModal');
    const form = document.getElementById('budgetForm');
    const title = document.getElementById('budgetModalTitle');
    
    if (budgetId) {
        const budget = budgets.find(b => b.id === budgetId);
        if (budget) {
            editingBudget = budgetId;
            title.textContent = 'Edit Budget';
            
            document.getElementById('budgetCategory').value = budget.category;
            document.getElementById('budgetAmount').value = budget.amount;
        }
    } else {
        editingBudget = null;
        title.textContent = 'Create Budget';
        form.reset();
    }
    
    modal.classList.add('show');
}

// Show goal modal
function showGoalModal(goalId = null) {
    const modal = document.getElementById('goalModal');
    const form = document.getElementById('goalForm');
    const title = document.getElementById('goalModalTitle');
    
    if (goalId) {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            editingGoal = goalId;
            title.textContent = 'Edit Goal';
            
            document.getElementById('goalName').value = goal.name;
            document.getElementById('goalTarget').value = goal.target;
            document.getElementById('goalCurrent').value = goal.current || 0;
            document.getElementById('goalDeadline').value = goal.deadline || '';
        }
    } else {
        editingGoal = null;
        title.textContent = 'Add Savings Goal';
        form.reset();
        document.getElementById('goalCurrent').value = 0;
    }
    
    modal.classList.add('show');
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    
    // Reset editing states
    editingTransaction = null;
    editingBudget = null;
    editingGoal = null;
}

// Save transaction
function saveTransaction(event) {
    event.preventDefault();
    
    const amount = document.getElementById('transactionAmount').value;
    const description = document.getElementById('transactionDescription').value;
    const category = document.getElementById('transactionCategory').value;
    const type = document.getElementById('transactionType').value;
    const date = document.getElementById('transactionDate').value;
    
    if (!amount || !description || !category || !type || !date) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const transaction = {
        id: editingTransaction || generateId(),
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        type,
        date,
        timestamp: new Date().toISOString()
    };
    
    if (editingTransaction) {
        const index = transactions.findIndex(t => t.id === editingTransaction);
        if (index !== -1) {
            transactions[index] = transaction;
            showNotification('Transaction updated successfully', 'success');
        }
    } else {
        transactions.push(transaction);
        showNotification('Transaction added successfully', 'success');
    }
    
    saveData();
    updateDashboard();
    displayTransactions();
    closeModal('transactionModal');
}

// Save budget
function saveBudget(event) {
    event.preventDefault();
    
    const category = document.getElementById('budgetCategory').value;
    const amount = document.getElementById('budgetAmount').value;
    
    if (!category || !amount) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Check if budget for this category already exists (and not editing)
    if (!editingBudget && budgets.find(b => b.category === category)) {
        showNotification('Budget for this category already exists', 'error');
        return;
    }
    
    const budget = {
        id: editingBudget || generateId(),
        category,
        amount: parseFloat(amount)
    };
    
    if (editingBudget) {
        const index = budgets.findIndex(b => b.id === editingBudget);
        if (index !== -1) {
            budgets[index] = budget;
            showNotification('Budget updated successfully', 'success');
        }
    } else {
        budgets.push(budget);
        showNotification('Budget created successfully', 'success');
    }
    
    saveData();
    updateDashboard();
    displayBudgets();
    closeModal('budgetModal');
}

// Save goal
function saveGoal(event) {
    event.preventDefault();
    
    const name = document.getElementById('goalName').value;
    const target = document.getElementById('goalTarget').value;
    const current = document.getElementById('goalCurrent').value;
    const deadline = document.getElementById('goalDeadline').value;
    
    if (!name || !target) {
        showNotification('Please fill in goal name and target amount', 'error');
        return;
    }
    
    const goal = {
        id: editingGoal || generateId(),
        name: name.trim(),
        target: parseFloat(target),
        current: parseFloat(current) || 0,
        deadline: deadline || null
    };
    
    if (editingGoal) {
        const index = goals.findIndex(g => g.id === editingGoal);
        if (index !== -1) {
            goals[index] = goal;
            showNotification('Goal updated successfully', 'success');
        }
    } else {
        goals.push(goal);
        showNotification('Goal created successfully', 'success');
    }
    
    saveData();
    updateDashboard();
    displayGoals();
    closeModal('goalModal');
}

// Edit transaction
function editTransaction(transactionId) {
    showTransactionModal(transactionId);
}

// Edit budget
function editBudget(budgetId) {
    showBudgetModal(budgetId);
}

// Edit goal
function editGoal(goalId) {
    showGoalModal(goalId);
}

// Delete transaction
function deleteTransaction(transactionId) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== transactionId);
        saveData();
        updateDashboard();
        displayTransactions();
        showNotification('Transaction deleted successfully', 'success');
    }
}

// Delete budget
function deleteBudget(budgetId) {
    if (confirm('Are you sure you want to delete this budget?')) {
        budgets = budgets.filter(b => b.id !== budgetId);
        saveData();
        updateDashboard();
        displayBudgets();
        showNotification('Budget deleted successfully', 'success');
    }
}

// Delete goal
function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        goals = goals.filter(g => g.id !== goalId);
        saveData();
        updateDashboard();
        displayGoals();
        showNotification('Goal deleted successfully', 'success');
    }
}

// Update goal progress
function updateGoalProgress(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const newAmount = prompt(`Update progress for "${goal.name}":\nCurrent: ${formatCurrency(goal.current || 0)}\nTarget: ${formatCurrency(goal.target)}\n\nEnter new current amount:`, goal.current || 0);
    
    if (newAmount !== null && !isNaN(newAmount) && newAmount >= 0) {
        goal.current = parseFloat(newAmount);
        saveData();
        updateDashboard();
        displayGoals();
        showNotification('Goal progress updated successfully', 'success');
    }
}

// Update category options based on transaction type
function updateCategoryOptions() {
    const typeSelect = document.getElementById('transactionType');
    const categorySelect = document.getElementById('transactionCategory');
    const selectedType = typeSelect.value;
    
    // Clear current options
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    if (selectedType === 'income') {
        incomeCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    } else if (selectedType === 'expense') {
        expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

// Export data
function exportData() {
    const data = {
        transactions,
        budgets,
        goals,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully', 'success');
}

// Import data
function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.transactions || !data.budgets || !data.goals) {
                throw new Error('Invalid file format');
            }
            
            // Confirm import
            if (confirm('This will replace all your current data. Are you sure you want to continue?')) {
                transactions = data.transactions || [];
                budgets = data.budgets || [];
                goals = data.goals || [];
                
                saveData();
                updateDashboard();
                displayTransactions();
                displayBudgets();
                displayGoals();
                
                showNotification('Data imported successfully', 'success');
            }
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Error importing data. Please check the file format.', 'error');
        }
    };
    
    reader.readAsText(file);
    input.value = ''; // Reset input
}

// Utility functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function setDefaultDate() {
    const dateInput = document.getElementById('transactionDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    if (window.innerWidth < 1024 && 
        sidebar.classList.contains('open') && 
        !sidebar.contains(e.target) && 
        !mobileMenuBtn.contains(e.target)) {
        toggleSidebar();
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth >= 1024) {
        sidebar.classList.remove('open');
    }
});