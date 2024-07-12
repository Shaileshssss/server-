import { RequestHandler } from "express";
import { sendErrRes } from "src/utils/helper";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import UserModel from "src/models/user";
import PasswordResetTokenModel from "src/models/passwordResetToken";
import { Url } from "url";

interface UserProfile {
    id: string;
    email: string;
    name: string;
    verified: boolean;
    avatar?: string;
}

declare global {
    namespace Express {
        interface Request {
            user: UserProfile
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const isAuth: RequestHandler = async (req, res, next) => {
    try {
        const authToken = req.headers.authorization
        if (!authToken) return sendErrRes(res, "unauthorized request!", 403)

        const token = authToken.split("Bearer ")[1]
        const payload = jwt.verify(token, JWT_SECRET) as { id: string }

        const user = await UserModel.findById(payload.id)
        if (!user) return sendErrRes(res, "unauthorized request!", 403)

        req.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            verified: user.verified,
            avatar: user.avatar?.url,

        }

        next()
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return sendErrRes(res, "token expired!", 401)
        }
        if (error instanceof JsonWebTokenError) {
            return sendErrRes(res, "unauthorized access!", 401)
        }
        next(error)
    }
}

export const isValidPassResetToken: RequestHandler = async (req, res, next) => {
    const { id, token } = req.body;
    const resetPassToken = await PasswordResetTokenModel.findOne({ owner: id });
    if (!resetPassToken) return sendErrRes(res, "Unauthorized request, invalid token", 403)
    const matched = await resetPassToken.compareToken(token)
    if (!matched) return sendErrRes(res, "Unauthorized request, invalid token", 403)

    next()
}