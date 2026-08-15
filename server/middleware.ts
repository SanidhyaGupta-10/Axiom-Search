import type { NextFunction, Request, Response } from "express";
import { createSupbaseClient } from "./client";
import prisma from "./db";

const supabase = createSupbaseClient();

export async function middleware(req: Request, res: Response, next: NextFunction) {

    // Step 1: Get the token from the request header
    // Frontend sends: { Authorization: "Bearer eyJhbGciOi..." }
    // We need to remove "Bearer " to get just the token
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    // Step 2: Ask Supabase "who is this user?" using the token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        return res.status(403).json({ message: "Incorrect inputs" });
    }

    const user = data.user;

    // Step 3: Check if this user already exists in OUR database (Prisma)
    // Why? Because Supabase has its own users table, but we need one too
    // for storing conversations, messages, etc.
    let dbUser = await prisma.user.findFirst({
        where: {
            OR: [
                { supabaseId: user.id },
                { email: user.email! }
            ]
        }
    });

    // Step 4: If user doesn't exist in our DB yet, create them
    if (!dbUser) {
        const provider = user.app_metadata?.provider === "github" ? "GITHUB" : "GOOGLE";

        dbUser = await prisma.user.create({
            data: {
                email: user.email!,
                supabaseId: user.id,
                name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
                provider: provider
            }
        });
    }

    // Step 5: Attach the user's DB id to the request so route handlers can use it
    (req as any).userId = dbUser.id;
    next();
}




