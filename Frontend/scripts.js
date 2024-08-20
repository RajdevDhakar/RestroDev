// Function to handle login form submission
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('http://127.0.0.1:8000/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'username': username,
            'password': password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            sessionStorage.setItem('token', data.access_token);
            window.location.href = 'customer.html';
        } else {
            alert('Login failed');
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to handle customer form submission
function handleCustomerForm(event) {
    event.preventDefault();
    const name = document.getElementById('customerName').value;
    const email = document.getElementById('customerEmail').value;
    const phone = document.getElementById('customerPhone').value;

    fetch('http://127.0.0.1:8000/customers/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify({ name, email, phone })
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            alert(`Customer created successfully! Customer ID: ${data.id}`);
        } else {
            console.error('Customer ID not found in response:', data);
            alert('Customer created, but could not retrieve Customer ID.');
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to handle order form submission
function handleOrderForm(event) {
    event.preventDefault();
    const customer_id = document.getElementById('orderCustomerId').value;
    const cuisine_id = document.getElementById('orderCuisineId').value;
    const order_date = document.getElementById('orderDate').value;

    fetch('http://127.0.0.1:8000/orders/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify({ customer_id, cuisine_id, order_date })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => console.error('Error:', error));
}

// Function to handle cuisine form submission
function handleCuisineForm(event) {
    event.preventDefault();
    const name = document.getElementById('cuisineName').value;
    const price = document.getElementById('cuisinePrice').value;

    fetch('http://127.0.0.1:8000/cuisines/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify({ name, price })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => console.error('Error:', error));
}

// Function to handle employee form submission
function handleEmployeeForm(event) {
    event.preventDefault();
    const name = document.getElementById('employeeName').value;
    const role = document.getElementById('employeeRole').value;
    const salary = document.getElementById('employeeSalary').value;

    fetch('http://127.0.0.1:8000/employees/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify({ name, role, salary })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => console.error('Error:', error));
}

// Function to fetch and display kitchen orders
function fetchKitchenOrders() {
    fetch('http://127.0.0.1:8000/kitchen/', {
        headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('kitchenOrders').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = ''; // Clear existing rows
        data.forEach(order => {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = order.id;
            row.insertCell(1).textContent = order.customer_name;
            row.insertCell(2).textContent = order.cuisine_name;
            row.insertCell(3).textContent = order.order_date;
            row.insertCell(4).textContent = order.status;
            const actionCell = row.insertCell(5);
            const updateButton = document.createElement('button');
            updateButton.textContent = 'Complete Order';
            updateButton.addEventListener('click', () => {
                completeOrder(order.id);
            });
            actionCell.appendChild(updateButton);
        });
    })
    .catch(error => console.error('Error fetching orders:', error));
}

// Function to update order status
function completeOrder(orderId) {
    fetch(`http://127.0.0.1:8000/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchKitchenOrders(); // Refresh orders after update
    })
    .catch(error => console.error('Error completing order:', error));
}

// Attach event listeners based on the current page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('kitchenOrders')) {
        fetchKitchenOrders();
    }
});

// Function to fetch and display completed orders for billing
function fetchCompletedOrders() {
    fetch('http://127.0.0.1:8000/completed-orders/', {
        headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('billingOrders').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = ''; // Clear existing rows
        data.forEach(order => {
            const row = tableBody.insertRow();
            row.setAttribute('data-order-id', order.id); // Set data attribute for easier access
            row.insertCell(0).textContent = order.id;
            row.insertCell(1).textContent = order.customer_name;
            row.insertCell(2).textContent = order.cuisine_name;
            row.insertCell(3).textContent = order.order_date;
            row.insertCell(4).textContent = order.price;
            const actionCell = row.insertCell(5);
            const generateBillButton = document.createElement('button');
            generateBillButton.textContent = 'Generate Bill';
            generateBillButton.addEventListener('click', () => {
                generateBill(order.id);
            });
            actionCell.appendChild(generateBillButton);
        });
    })
    .catch(error => console.error('Error fetching completed orders:', error));
}

// Function to generate bill for a completed order
function generateBill(orderId) {
    fetch(`http://127.0.0.1:8000/generate-bill/${orderId}`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(`Bill Generated: \nOrder ID: ${data.order_id}\nCustomer: ${data.customer_name}\nCuisine: ${data.cuisine_name}\nPrice: $${data.price}`);
        
        // Remove the order from the table
        const tableBody = document.getElementById('billingOrders').getElementsByTagName('tbody')[0];
        const rowToRemove = Array.from(tableBody.rows).find(row => row.getAttribute('data-order-id') == orderId);
        if (rowToRemove) {
            tableBody.removeChild(rowToRemove);
        }
    })
    .catch(error => console.error('Error generating bill:', error));
}

// Attach event listeners based on the current page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('kitchenOrders')) {
        fetchKitchenOrders();
    }

    if (document.getElementById('billingOrders')) {
        fetchCompletedOrders();
    }
});

// Attach event listeners based on the current page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }

    if (document.getElementById('customerForm')) {
        document.getElementById('customerForm').addEventListener('submit', handleCustomerForm);
    }

    if (document.getElementById('orderForm')) {
        document.getElementById('orderForm').addEventListener('submit', handleOrderForm);
    }

    if (document.getElementById('cuisineForm')) {
        document.getElementById('cuisineForm').addEventListener('submit', handleCuisineForm);
    }

    if (document.getElementById('employeeForm')) {
        document.getElementById('employeeForm').addEventListener('submit', handleEmployeeForm);
    }

    if (document.getElementById('kitchenOrders')) {
        fetchKitchenOrders();
    }
});
