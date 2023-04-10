# Express API with Knex
This is an example Express API that uses Knex to interact with a MySQL database. It provides endpoints to retrieve, create, update, and delete categories, attributes, and products.

## Setup
- Install dependencies using npm install
- Create a MySQL database and run the SQL code in db.sql to create the necessary tables
- Update the connection details in index.js to match your MySQL setup
- Start the server using npm start
## Endpoints
### Categories
* `GET /categories`: Returns a list of all categories
* `GET /categories/:id`: Returns a single category with the specified ID
* `POST /categories`: Creates a new category
* `PUT /categories/:id`: Updates an existing category with the specified ID
* `DELETE /categories/:id`: Deactivates the category with the specified ID and all its children recursively
### Attributes
* `GET /attributes`: Returns a list of all attributes
* `GET /attributes/:id`: Returns a single attribute with the specified ID
## Products
* GET /products: Returns a list of all products
* POST /products: Creates a new product, and optionally adds it to one or more categories. The request body should contain a JSON object with the following properties:
- name: The name of the product (required)
- description: A description of the product
- price: The price of the product
- categories: An array of category IDs to add the product to (optional)# task
