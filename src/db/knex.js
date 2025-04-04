import knex from "knex";
import knexConfig from "../../knexfile.js";
import { config } from "../config/index.js";

const environment = config.nodeEnv || "development";
const environmentConfig = knexConfig[environment];

if (!environmentConfig) {
  throw new Error(
    `Knex configuration for environment "${environment}" not found.`,
  );
}

const db = knex(environmentConfig);

db.raw("SELECT 1")
  .then(() => {
    console.log("PostgreSQL connected successfully using Knex");
  })
  .catch((e) => {
    console.error("Failed to connect to PostgreSQL using Knex", e);
  });

export default db;
