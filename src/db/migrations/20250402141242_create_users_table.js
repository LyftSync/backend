/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("users", (table) => {
    table.bigIncrements("id").primary();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.string("full_name");
    table.string("phone_number").unique();
    table.timestamps(true, true);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("users");
}
