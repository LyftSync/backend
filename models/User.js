import { getDB } from "../config/db.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const SALT_ROUNDS = 10;

export async function createUser(userData) {
  const db = getDB();
  const { password } = userData;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = { ...userData, password: hashedPassword, createdAt: new Date() };
  const result = await db.collection("users").insertOne(user);
  return { ...user, _id: result.insertedId };
}

export async function findUserByEmail(email) {
  const db = getDB();
  return await db.collection("users").findOne({ email });
}

export async function findUserByPhone(phoneNumber) {
  const db = getDB();
  return await db.collection("users").findOne({ phoneNumber });
}

export async function findUserById(userId) {
  const db = getDB();
  return await db.collection("users").findOne({ _id: new ObjectId(userId) });
}

export async function validateUserCredentials(email, password) {
  const db = getDB();
  const user = await db.collection("users").findOne({ email });
  if (!user) return null;
  const isMatch = await bcrypt.compare(password, user.password);
  return isMatch ? user : null;
}
