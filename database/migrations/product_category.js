exports.up = async (knex) => {
  await knex.schema.createTable("products", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.text("description").notNullable();
    table.decimal("price").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("categories", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.integer("parent_category_id").unsigned().nullable();
    table.foreign("parent_category_id").references("categories.id");
  });

  await knex.schema.createTable("attributes", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
  });

  await knex.schema.createTable("product_attributes", (table) => {
    table.increments("id").primary();
    table.integer("product_id").unsigned().notNullable();
    table.foreign("product_id").references("products.id");
    table.integer("attribute_id").unsigned().notNullable();
    table.foreign("attribute_id").references("attributes.id");
    table.string("value").notNullable();
  });

  await knex.schema.createTable("product_category", (table) => {
    table.integer("product_id").unsigned().notNullable();
    table.foreign("product_id").references("products.id");
    table.integer("category_id").unsigned().notNullable();
    table.foreign("category_id").references("categories.id");
    table.primary(["product_id", "category_id"]);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("product_category");
  await knex.schema.dropTableIfExists("product_attributes");
  await knex.schema.dropTableIfExists("attributes");
  await knex.schema.dropTableIfExists("categories");
  await knex.schema.dropTableIfExists("products");
};
