import { config } from "./src/config/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const knexConfig = {
  development: {
    client: "postgresql",
    connection: config.databaseUrl,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: path.join(__dirname, "/src/db/migrations"),
      tableName: "knex_migrations",
    },
    seeds: {
      directory: path.join(__dirname, "/src/db/seeds"),
    },
  },
};

export default knexConfig;
