import { registerUser, loginUser } from "../services/authService";
import { Request, Response } from "express";

export async function register(request: Request, response: Response) {
  const { email, password } = request.body;
  try {
    await registerUser(email, password);
    return response.status(201).json({ message: "User created with success" });
  } catch (error) {
    if (error instanceof Error) {
      // error in service
      if (error.message === "Email already taken") {
        return response.status(409).json({ message: error.message });
      }
    }
    return response.status(500).json({ message: "Internal server error" });
  }
}

export async function login(request: Request, response: Response) {
  const { email, password } = request.body;
  try {
    const token = await loginUser(email, password);
    return response.status(200).json({ token });
  } catch (error) {
    if (error instanceof Error) {
      // error in service
      if (error.message === "Credentials are not correct") {
        return response.status(401).json({ message: error.message });
      }
    }
    return response.status(500).json({ message: "Internal server error" });
  }
}
