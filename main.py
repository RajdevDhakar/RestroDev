from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
import mysql.connector
from mysql.connector import Error
from typing import List

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2PasswordBearer instance
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='rms_db',
            user='root',  # replace with your MySQL username
            password='rajdev26'  # replace with your MySQL password
        )
        return connection
    except Error as e:
        print(f"Error: {e}")
        return None

class User(BaseModel):
    username: str
    password: str

class Customer(BaseModel):
    name: str
    email: str
    phone: str

class Cuisine(BaseModel):
    name: str
    price: int

class Employee(BaseModel):
    name: str
    position: str
    salary: int

class Order(BaseModel):
    customer_id: int
    cuisine_id: int
    order_date: str
    status: str = "Pending"

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (form_data.username, form_data.password))
    user = cursor.fetchone()
    cursor.close()
    connection.close()
    if user:
        return {"access_token": user['username'], "token_type": "bearer"}
    else:
        raise HTTPException(status_code=400, detail="Invalid credentials")

@app.post("/customers/", dependencies=[Depends(oauth2_scheme)])
def create_customer(customer: Customer):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = connection.cursor()
    try:
        cursor.execute(
            "INSERT INTO customer (name, email, phone) VALUES (%s, %s, %s)", 
            (customer.name, customer.email, customer.phone)
        )
        connection.commit()
        customer_id = cursor.lastrowid  # Get the ID of the newly inserted customer
    except Error as e:
        raise HTTPException(status_code=400, detail=f"Database error: {e}")
    finally:
        cursor.close()
        connection.close()
    
    return {"id": customer_id, "message": "Customer created successfully"}

@app.post("/cuisines/", dependencies=[Depends(oauth2_scheme)])
def create_cuisine(cuisine: Cuisine):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO cuisines (name, price) VALUES (%s, %s)", (cuisine.name, cuisine.price))
        connection.commit()
    except Error as e:
        raise HTTPException(status_code=400, detail=f"Database error: {e}")
    finally:
        cursor.close()
        connection.close()
    return {"message": "Cuisine created successfully"}

@app.post("/employees/", dependencies=[Depends(oauth2_scheme)])
def create_employee(employee: Employee):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO employee (name, position, salary) VALUES (%s, %s, %s)", (employee.name, employee.position, employee.salary))
        connection.commit()
    except Error as e:
        raise HTTPException(status_code=400, detail=f"Database error: {e}")
    finally:
        cursor.close()
        connection.close()
    return {"message": "Employee created successfully"}

@app.post("/orders/", dependencies=[Depends(oauth2_scheme)])
def create_order(order: Order):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO orders (customer_id, cuisine_id, order_date, status) VALUES (%s, %s, %s, %s)", (order.customer_id, order.cuisine_id, order.order_date, order.status))
        connection.commit()
    except Error as e:
        raise HTTPException(status_code=400, detail=f"Database error: {e}")
    finally:
        cursor.close()
        connection.close()
    return {"message": "Order created successfully"}

@app.get("/orders/", dependencies=[Depends(oauth2_scheme)])
def get_orders():
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM orders WHERE status = 'Pending'")
    orders = cursor.fetchall()
    cursor.close()
    connection.close()
    return orders

@app.get("/kitchen/", dependencies=[Depends(oauth2_scheme)])
def get_kitchen_orders():
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT orders.id, customer.name AS customer_name, cuisines.name AS cuisine_name, orders.order_date, orders.status FROM orders JOIN customer ON orders.customer_id = customer.id JOIN cuisines ON orders.cuisine_id = cuisines.id WHERE orders.status = 'Pending'")
    orders = cursor.fetchall()
    cursor.close()
    connection.close()
    return orders

@app.put("/orders/{order_id}/complete", dependencies=[Depends(oauth2_scheme)])
def complete_order(order_id: int):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = connection.cursor()
    try:
        cursor.execute("UPDATE orders SET status = 'Completed' WHERE id = %s", (order_id,))
        connection.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Order not found")
    except Error as e:
        raise HTTPException(status_code=400, detail=f"Database error: {e}")
    finally:
        cursor.close()
        connection.close()
    return {"message": "Order completed successfully"}

@app.get("/completed-orders/", dependencies=[Depends(oauth2_scheme)])
def get_completed_orders():
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT orders.id, customer.name AS customer_name, cuisines.name AS cuisine_name, cuisines.price, orders.order_date FROM orders JOIN customer ON orders.customer_id = customer.id JOIN cuisines ON orders.cuisine_id = cuisines.id WHERE orders.status = 'Completed'")
    orders = cursor.fetchall()
    cursor.close()
    connection.close()
    return orders

@app.post("/generate-bill/{order_id}", dependencies=[Depends(oauth2_scheme)])
def generate_bill(order_id: int):
    connection = get_db_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT orders.id, customer.name AS customer_name, cuisines.name AS cuisine_name, cuisines.price FROM orders JOIN customer ON orders.customer_id = customer.id JOIN cuisines ON orders.cuisine_id = cuisines.id WHERE orders.id = %s AND orders.status = 'Completed'", (order_id,))
        order = cursor.fetchone()
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found or not completed")
        
        # Generate bill
        bill = {
            "order_id": order["id"],
            "customer_name": order["customer_name"],
            "cuisine_name": order["cuisine_name"],
            "price": order["price"]
        }

        # Delete the order after generating the bill
        cursor.execute("DELETE FROM orders WHERE id = %s", (order_id,))
        connection.commit()
        
    except Error as e:
        raise HTTPException(status_code=400, detail=f"Database error: {e}")
    finally:
        cursor.close()
        connection.close()
    
    return JSONResponse(content=bill)
