import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const verifyAuth = async (token) => {
    let user;
    try {
        user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return NextResponse.json(
            { success: false, message: "Invalid or expired token." },
            { status: 401 }
        );
    }
    return user;
};