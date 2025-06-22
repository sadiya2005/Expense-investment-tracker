document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const totalAmount = document.getElementById("total-amount");
  const filterCategory = document.getElementById("filter-category");
  const token = localStorage.getItem("token");

  let expenses = [];

  // Fetch expenses from backend
  fetch("http://localhost:5000/api/expenses", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      expenses = data;
      displayExpenses(expenses);
      updateTotalAmount();
      renderExpenseChart(expenses);
    })
    .catch(err => {
      console.error("Error fetching expenses:", err);
    });

  // Add expense
  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("expense-name").value;
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const category = document.getElementById("expense-category").value;
    const date = document.getElementById("expense-date").value;

    const res = await fetch("http://localhost:5000/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, amount, category, date }),
    });

    const newExpense = await res.json();
    expenses.push(newExpense);
    displayExpenses(expenses);
    updateTotalAmount();
    renderExpenseChart(expenses);
    expenseForm.reset();
  });

  // Delete or Edit
  expenseList.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains("delete-btn")) {
      await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      expenses = expenses.filter(exp => exp._id !== id);
      displayExpenses(expenses);
      updateTotalAmount();
      renderExpenseChart(expenses);
    }

    if (e.target.classList.contains("edit-btn")) {
      const exp = expenses.find(exp => exp._id === id);
      document.getElementById("expense-name").value = exp.name;
      document.getElementById("expense-amount").value = exp.amount;
      document.getElementById("expense-category").value = exp.category;
      document.getElementById("expense-date").value = exp.date;
      expenses = expenses.filter(exp => exp._id !== id);
      displayExpenses(expenses);
      updateTotalAmount();
      renderExpenseChart(expenses);
    }
  });

  // Filter by category
  filterCategory.addEventListener("change", () => {
    const cat = filterCategory.value;
    const filtered = cat === "All" ? expenses : expenses.filter(exp => exp.category === cat);
    displayExpenses(filtered);
    renderExpenseChart(filtered);
  });

  // Display table
  function displayExpenses(data) {
    expenseList.innerHTML = "";
    data.forEach(exp => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${exp.name}</td>
        <td>$${exp.amount.toFixed(2)}</td>
        <td>${exp.category}</td>
        <td>${exp.date}</td>
        <td>
          <button class="edit-btn" data-id="${exp._id}">Edit</button>
          <button class="delete-btn" data-id="${exp._id}">Delete</button>
        </td>
      `;
      expenseList.appendChild(row);
    });
  }

  // Total calculation
  function updateTotalAmount() {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    totalAmount.textContent = total.toFixed(2);
    showInvestmentSuggestions(total);
  }

  // Chart function
  function renderExpenseChart(data) {
    const categoryTotals = {};
    data.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    const ctx = document.getElementById("expenseChart").getContext("2d");

    if (window.expenseChartInstance) {
      window.expenseChartInstance.destroy();
    }

    window.expenseChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: 'Expenses by Category',
          data: values,
          backgroundColor: ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99', '#c2c2f0'],
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
  }

  document.getElementById("export-pdf").addEventListener("click", () => {
    html2canvas(document.getElementById("expense-list")).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new window.jspdf.jsPDF();
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
      pdf.save("expenses.pdf");
    });
  });

  document.getElementById("export-csv").addEventListener("click", () => {
    let csv = "Name,Amount,Category,Date\n";
    expenses.forEach(exp => {
      csv += `${exp.name},${exp.amount},${exp.category},${exp.date}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
  });

  document.getElementById("filter-date").addEventListener("click", () => {
    const from = new Date(document.getElementById("from-date").value);
    const to = new Date(document.getElementById("to-date").value);

    const filtered = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return (!isNaN(from) ? expDate >= from : true) && (!isNaN(to) ? expDate <= to : true);
    });

    displayExpenses(filtered);
    renderExpenseChart(filtered);
  });

  function showInvestmentSuggestions(total) {
    const suggestionEl = document.getElementById("suggestion");

    if (total < 1000) {
      suggestionEl.textContent = "Try to save more. Avoid unnecessary expenses.";
    } else if (total >= 1000 && total < 5000) {
      suggestionEl.textContent = "Consider investing ₹500 in mutual funds.";
    } else {
      suggestionEl.textContent = "Great! You could invest ₹1000+ this month!";
    }
  }
});
