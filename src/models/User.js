import db from "../db/knex.js";

const TABLE_NAME = "users";

export const User = {
  async create(userData) {
    const [newUser] = await db(TABLE_NAME).insert(userData).returning("*");
    return newUser;
  },

  async findByEmail(email) {
    const user = await db(TABLE_NAME).where({ email }).first();
    return user;
  },

  async findById(id) {
    const user = await db(TABLE_NAME).where({ id }).first();
    return user;
  },

  async findByPhoneNumber(phoneNumber) {
    const user = await db(TABLE_NAME)
      .where({ phone_number: phoneNumber })
      .first();
    return user;
  },
};
