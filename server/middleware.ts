import type { NextFunction, Request, Response } from "express";
import { createSupbaseClient } from "./client";

const client = createSupbaseClient();

export async function middleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(403).json({ message: "No token provided" });
    }

    // Extract token (remove "Bearer " if included)
    const token = authHeader.replace(/^Bearer\s+/i, "");

    const { data, error } = await client.auth.getUser(token);

    if (error || !data?.user) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }

    // Attach userId directly to req
    (req as any).userId = data.user.id;
    next();
}