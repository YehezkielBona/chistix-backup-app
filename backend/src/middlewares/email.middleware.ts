import {z} from "zod";

export const emailSchema = z.object({
    email:z.email("Email Address Not Valid")
});

// untuk di forget-password