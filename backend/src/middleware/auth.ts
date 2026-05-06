import jwt from "jsonwebtoken";
import "dotenv/config";
import { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  userId?: number;
}

export async function authentificateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized. No token provided." });
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(401)
        .json({ message:"JWT_SECRET is not defined"});
    }
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload; // return an object
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({
      message: "You are not authentificated",
    });
  }
}
