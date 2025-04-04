/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.raw("CREATE EXTENSION IF NOT EXISTS postgis;").then(() => {
    return knex.schema.createTable("waypoints", (table) => {
      table.bigIncrements("id").primary();
      table
        .bigInteger("ride_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("rides")
        .onDelete("CASCADE");
      table.integer("sequence_order").notNullable();
      table.decimal("latitude", 9, 6).notNullable();
      table.decimal("longitude", 9, 6).notNullable();
      table.specificType("location", "GEOGRAPHY(Point, 4326)").notNullable();
      table.timestamp("estimated_arrival_time", { useTz: true }).nullable();

      table.index(["ride_id", "sequence_order"]);
      table.index("location", "waypoints_location_gix", "gist");

      table.timestamps(true, true);
    });
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("waypoints");
}
