import { Response } from "express";

export const sendErrRes = (res: Response, message: string, statusCode: number) => {
    res.status(statusCode).json({message})
}