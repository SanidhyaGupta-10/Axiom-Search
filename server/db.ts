import { PrismaClient } from "./prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL!; // use direct DB connection for Prisma adapter

const adapter = new PrismaPg({ 
    connectionString 
});

const prisma = new PrismaClient({ 
    adapter 
});

export default prisma;