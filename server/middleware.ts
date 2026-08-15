import type { NextFunction, Request, Response } from "express";
import { createSupbaseClient } from "./lib/client";
import prisma from "./lib/db";

const supabase = createSupbaseClient();

// Authenticate user if token exists, but allow unauthenticated guests to proceed
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace(/^Bearer\s+/i, "");

        if (!token) {
            (req as any).userId = null;
            return next();
        }

        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            (req as any).userId = null;
            return next();
        }

        const user = data.user;
        let dbUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { supabaseId: user.id },
                    { email: user.email! }
                ]
            }
        });

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

        (req as any).userId = dbUser.id;
        return next();
    } catch (err) {
        console.error('[optionalAuth error]:', err);
        (req as any).userId = null;
        return next();
    }
}

// Strict authentication middleware for private routes (history list, delete, etc.)
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
        return res.status(403).json({ message: "Invalid session" });
    }

    const user = data.user;
    let dbUser = await prisma.user.findFirst({
        where: {
            OR: [
                { supabaseId: user.id },
                { email: user.email! }
            ]
        }
    });

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

    (req as any).userId = dbUser.id;
    next();
}

// Default export for backwards compatibility
export const middleware = optionalAuth;
