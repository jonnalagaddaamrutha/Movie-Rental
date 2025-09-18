from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
from decimal import Decimal
import os
from werkzeug.exceptions import BadRequest

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "sakila",
    "user": "root",  # Change this to your MySQL username
    "password": "Jonnalagadda369",  # Change this to your MySQL password
    "port": 3306,
}


def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None


# Landing Page APIs
@app.route("/api/top-films", methods=["GET"])
def get_top_films():
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor(dictionary=True)
        query = """
        SELECT f.film_id, f.title, f.description, f.rental_rate, f.length, 
               f.rating, COUNT(r.rental_id) as rental_count
        FROM film f
        JOIN inventory i ON f.film_id = i.film_id
        JOIN rental r ON i.inventory_id = r.inventory_id
        GROUP BY f.film_id
        ORDER BY rental_count DESC
        LIMIT 5
        """
        cursor.execute(query)
        films = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(films)
    except Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/top-actors", methods=["GET"])
def get_top_actors():
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor(dictionary=True)
        query = """
        SELECT a.actor_id, a.first_name, a.last_name, COUNT(r.rental_id) as rental_count
        FROM actor a
        JOIN film_actor fa ON a.actor_id = fa.actor_id
        JOIN film f ON fa.film_id = f.film_id
        JOIN inventory i ON f.film_id = i.film_id
        JOIN rental r ON i.inventory_id = r.inventory_id
        GROUP BY a.actor_id
        ORDER BY rental_count DESC
        LIMIT 5
        """
        cursor.execute(query)
        actors = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(actors)
    except Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/film/<int:film_id>", methods=["GET"])
def get_film_details(film_id):
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor(dictionary=True)

        film_query = """
        SELECT f.*, l.name as language_name, c.name as category_name
        FROM film f
        LEFT JOIN language l ON f.language_id = l.language_id
        LEFT JOIN film_category fc ON f.film_id = fc.film_id
        LEFT JOIN category c ON fc.category_id = c.category_id
        WHERE f.film_id = %s
        """
        cursor.execute(film_query, (film_id,))
        film = cursor.fetchone()

        actors_query = """
        SELECT a.actor_id, a.first_name, a.last_name
        FROM actor a
        JOIN film_actor fa ON a.actor_id = fa.actor_id
        WHERE fa.film_id = %s
        """
        cursor.execute(actors_query, (film_id,))
        actors = cursor.fetchall()

        if film:
            # Add actors to the film details
            film["actors"] = actors

            # Convert non-serializable fields
            for key, value in film.items():
                if isinstance(value, datetime):
                    film[key] = value.isoformat()
                elif isinstance(value, set):
                    film[key] = list(value)
                elif isinstance(value, Decimal):
                    film[key] = float(value)

        cursor.close()
        connection.close()

        return jsonify(film)

    except Exception as e:
        print(f"Exception occurred: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/actor/<int:actor_id>", methods=["GET"])
def get_actor_details(actor_id):
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor(dictionary=True)

        # Get actor details
        actor_query = """
        SELECT * FROM actor WHERE actor_id = %s
        """
        cursor.execute(actor_query, (actor_id,))
        actor = cursor.fetchone()

        # Get top 5 rented films for this actor
        films_query = """
        SELECT f.film_id, f.title, f.description, f.rental_rate, 
               COUNT(r.rental_id) as rental_count
        FROM film f
        JOIN film_actor fa ON f.film_id = fa.film_id
        JOIN inventory i ON f.film_id = i.film_id
        JOIN rental r ON i.inventory_id = r.inventory_id
        WHERE fa.actor_id = %s
        GROUP BY f.film_id
        ORDER BY rental_count DESC
        LIMIT 5
        """
        cursor.execute(films_query, (actor_id,))
        films = cursor.fetchall()

        if actor:
            actor["films"] = films

        cursor.close()
        connection.close()

        return jsonify(actor)
    except Error as e:
        return jsonify({"error": str(e)}), 500


# Films Page APIs
@app.route("/api/films/search", methods=["GET"])
def search_films():
    try:
        query_param = request.args.get("q", "")
        search_type = request.args.get("type", "title")  # title, actor, genre

        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor(dictionary=True)

        if search_type == "actor":
            query = """
            SELECT DISTINCT f.film_id, f.title, f.description, f.rental_rate, 
                   f.length, f.rating
            FROM film f
            JOIN film_actor fa ON f.film_id = fa.film_id
            JOIN actor a ON fa.actor_id = a.actor_id
            WHERE CONCAT(a.first_name, ' ', a.last_name) LIKE %s
            """
            cursor.execute(query, (f"%{query_param}%",))
        elif search_type == "genre":
            query = """
            SELECT DISTINCT f.film_id, f.title, f.description, f.rental_rate, 
                   f.length, f.rating
            FROM film f
            JOIN film_category fc ON f.film_id = fc.film_id
            JOIN category c ON fc.category_id = c.category_id
            WHERE c.name LIKE %s
            """
            cursor.execute(query, (f"%{query_param}%",))
        else:  # title
            query = """
            SELECT film_id, title, description, rental_rate, length, rating
            FROM film
            WHERE title LIKE %s
            """
            cursor.execute(query, (f"%{query_param}%",))

        films = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(films)
    except Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/films/rent", methods=["POST"])
def rent_film():
    try:
        data = request.get_json()
        customer_id = data.get("customer_id")
        film_id = data.get("film_id")
        staff_id = data.get("staff_id", 1)  # Default staff ID

        if not customer_id or not film_id:
            return jsonify({"error": "Customer ID and Film ID are required"}), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor()

        # Check if film is available
        availability_query = """
        SELECT i.inventory_id FROM inventory i
        LEFT JOIN rental r ON i.inventory_id = r.inventory_id 
        AND r.return_date IS NULL
        WHERE i.film_id = %s AND r.rental_id IS NULL
        LIMIT 1
        """
        cursor.execute(availability_query, (film_id,))
        available_inventory = cursor.fetchone()

        if not available_inventory:
            cursor.close()
            connection.close()
            return jsonify({"error": "Film is not available for rent"}), 400

        inventory_id = available_inventory[0]

        # Create rental record
        rental_query = """
        INSERT INTO rental (rental_date, inventory_id, customer_id, staff_id)
        VALUES (%s, %s, %s, %s)
        """
        rental_date = datetime.now()
        cursor.execute(rental_query, (rental_date, inventory_id, customer_id, staff_id))
        rental_id = cursor.lastrowid

        # Create payment record
        payment_query = """
        INSERT INTO payment (customer_id, staff_id, rental_id, amount, payment_date)
        SELECT %s, %s, %s, f.rental_rate, %s
        FROM film f WHERE f.film_id = %s
        """
        cursor.execute(
            payment_query, (customer_id, staff_id, rental_id, rental_date, film_id)
        )

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({"message": "Film rented successfully", "rental_id": rental_id})
    except Error as e:
        return jsonify({"error": str(e)}), 500


# Customer Page APIs
@app.route("/api/customers", methods=["GET"])
def get_customers():
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
        search = request.args.get("search", "")
        search_type = request.args.get("search_type", "name")  # name, customer_id

        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor(dictionary=True)

        # Build WHERE clause based on search
        where_clause = ""
        params = []

        if search:
            if search_type == "customer_id":
                where_clause = "WHERE c.customer_id = %s"
                params.append(search)
            else:  # name search
                where_clause = "WHERE CONCAT(c.first_name, ' ', c.last_name) LIKE %s OR c.first_name LIKE %s OR c.last_name LIKE %s"
                params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        # Get total count
        count_query = f"""
        SELECT COUNT(*) as total
        FROM customer c
        {where_clause}
        """
        cursor.execute(count_query, params)
        total = cursor.fetchone()["total"]

        # Get customers with pagination
        offset = (page - 1) * per_page
        customers_query = f"""
        SELECT c.customer_id, c.first_name, c.last_name, c.email, 
               c.active, c.create_date, a.address, ci.city, co.country
        FROM customer c
        JOIN address a ON c.address_id = a.address_id
        JOIN city ci ON a.city_id = ci.city_id
        JOIN country co ON ci.country_id = co.country_id
        {where_clause}
        ORDER BY c.customer_id
        LIMIT %s OFFSET %s
        """
        params.extend([per_page, offset])
        cursor.execute(customers_query, params)
        customers = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(
            {
                "customers": customers,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page,
            }
        )
    except Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/customers", methods=["POST"])
def add_customer():
    try:
        data = request.get_json()
        required_fields = [
            "first_name",
            "last_name",
            "email",
            "address",
            "city_id",
            "phone",
        ]

        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor()

        # Create address first
        address_query = """
        INSERT INTO address (address, district, city_id, phone)
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(
            address_query,
            (
                data["address"],
                data.get("district", "District"),
                data["city_id"],
                data["phone"],
            ),
        )
        address_id = cursor.lastrowid

        # Create customer
        customer_query = """
        INSERT INTO customer (store_id, first_name, last_name, email, address_id, create_date)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            customer_query,
            (
                data.get("store_id", 1),  # Default store
                data["first_name"],
                data["last_name"],
                data["email"],
                address_id,
                datetime.now(),
            ),
        )
        customer_id = cursor.lastrowid

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify(
            {"message": "Customer added successfully", "customer_id": customer_id}
        )
    except Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/customers/<int:customer_id>", methods=["PUT"])
def update_customer(customer_id):
    try:
        data = request.get_json()

        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor()

        # Update customer
        update_query = """
        UPDATE customer 
        SET first_name = %s, last_name = %s, email = %s, active = %s
        WHERE customer_id = %s
        """
        cursor.execute(
            update_query,
            (
                data.get("first_name"),
                data.get("last_name"),
                data.get("email"),
                data.get("active", True),
                customer_id,
            ),
        )

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({"message": "Customer updated successfully"})
    except Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/customers/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor()

        # Check if customer has active rentals
        active_rentals_query = """
        SELECT COUNT(*) as count FROM rental 
        WHERE customer_id = %s AND return_date IS NULL
        """
        cursor.execute(active_rentals_query, (customer_id,))
        active_count = cursor.fetchone()[0]

        if active_count > 0:
            cursor.close()
            connection.close()
            return jsonify({"error": "Cannot delete customer with active rentals"}), 400

        # Soft delete by setting active = False
        delete_query = "UPDATE customer SET active = FALSE WHERE customer_id = %s"
        cursor.execute(delete_query, (customer_id,))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({"message": "Customer deleted successfully"})
    except Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/customers/<int:customer_id>/details", methods=["GET"])
def get_customer_details(customer_id):
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor(dictionary=True)

        # Get customer details
        customer_query = """
        SELECT c.*, a.address, a.phone, ci.city, co.country
        FROM customer c
        JOIN address a ON c.address_id = a.address_id
        JOIN city ci ON a.city_id = ci.city_id
        JOIN country co ON ci.country_id = co.country_id
        WHERE c.customer_id = %s
        """
        cursor.execute(customer_query, (customer_id,))
        customer = cursor.fetchone()

        # Get rental history
        rentals_query = """
        SELECT r.rental_id, r.rental_date, r.return_date, f.title, f.rental_rate,
               CASE WHEN r.return_date IS NULL THEN 'Active' ELSE 'Returned' END as status
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        WHERE r.customer_id = %s
        ORDER BY r.rental_date DESC
        """
        cursor.execute(rentals_query, (customer_id,))
        rentals = cursor.fetchall()

        if customer:
            customer["rental_history"] = rentals

        cursor.close()
        connection.close()

        return jsonify(customer)
    except Error as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/rentals/<int:rental_id>/return", methods=["PUT"])
def return_rental(rental_id):
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor()

        # Update rental with return date
        return_query = """
        UPDATE rental 
        SET return_date = %s 
        WHERE rental_id = %s AND return_date IS NULL
        """
        cursor.execute(return_query, (datetime.now(), rental_id))

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()
            return jsonify({"error": "Rental not found or already returned"}), 400

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({"message": "Rental returned successfully"})
    except Error as e:
        return jsonify({"error": str(e)}), 500


# Helper route to get cities for customer form
@app.route("/api/cities", methods=["GET"])
def get_cities():
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT city_id, city FROM city ORDER BY city")
        cities = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(cities)
    except Error as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
