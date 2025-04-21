import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  findUserByPhone,
  validateUserCredentials,
} from "../models/User.js";

export async function register(req) {
  try {
    const { fullName, phoneNumber, email, password, age, gender } =
      await req.json();
    if (!fullName || !phoneNumber || !email || !password || !age || !gender) {
      return new Response("All fields are required", { status: 400 });
    }
    if (await findUserByEmail(email)) {
      return new Response("Email already exists", { status: 400 });
    }
    if (await findUserByPhone(phoneNumber)) {
      return new Response("Phone number already exists", { status: 400 });
    }
    await createUser({ fullName, phoneNumber, email, password, age, gender });
    return new Response(
      JSON.stringify({ message: "User registered successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response("Server error: " + error.message, { status: 500 });
  }
}

export async function login(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response("Email and password are required", { status: 400 });
    }
    const user = await validateUserCredentials(email, password);
    if (!user) {
      return new Response("Invalid credentials", { status: 401 });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE_IN,
    });
    return new Response(
      JSON.stringify({
        token,
        user: {
          fullName: user.fullName,
          email,
          phoneNumber: user.phoneNumber,
          age: user.age,
          gender: user.gender,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response("Server error: " + error.message, { status: 500 });
  }
}
