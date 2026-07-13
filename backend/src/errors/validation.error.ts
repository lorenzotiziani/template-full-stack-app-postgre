import {NextFunction, Request, Response} from "express";
import {ZodError} from "zod";

export const validationError = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ZodError) {
        const errors = err.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
        }));

        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors
        });
    }

    next(err);
}