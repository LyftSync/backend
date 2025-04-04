/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("rides", (table) => {
    table.bigIncrements("id").primary();
    table
      .bigInteger("rider_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamp("start_time", { useTz: true }).notNullable();
    table
      .enum("status", ["scheduled", "active", "completed", "cancelled"], {
        useNative: true,
        enumName: "ride_status_type",
      })
      .notNullable()
      .defaultTo("scheduled");

    table.index(["rider_id"]);
    table.index(["status"]);

    table.timestamps(true, true);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .dropTable("rides")
    .then(() => knex.raw("DROP TYPE IF EXISTS ride_status_type"));
}
