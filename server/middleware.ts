import type { NextFunction, Request, Response } from "express";
import { createSupbaseClient } from "./client";

const client = createSupbaseClient();

export async function middleware (req: Request, res: Response, next: NextFunction){
    const token = req.headers.authorization;

    const data = await client.auth.getUser(token!);
    const userId = data.data.user?.id;
    if(userId){
        req.body.userId = userId;
        next();
    } else {
       res.status(403).json({
            message: "Invalid Input"
       })
    }
}