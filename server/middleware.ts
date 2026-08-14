import type { NextFunction, Request, Response } from "express";
import { createSupbaseClient } from "./client";

const client = createSupbaseClient();

export async function middleware (req: Request, res: Response, next: NextFunction){
    const token = req.headers.authorization;

    const { data, error} = await client.auth.getUser(token)
}