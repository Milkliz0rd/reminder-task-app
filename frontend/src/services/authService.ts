import instance from "../api/api";
import type { Credentials } from "../types/credentials";

export async function login(credentials: Credentials) {
  const response = await instance.post<{ token: string }>(
    "/auth/login",
    credentials,
  );
  const token = response.data.token;
  localStorage.setItem("token", token);
}

export async function register(credentials: Credentials) {
return await instance.post("/auth/register", credentials);
}
