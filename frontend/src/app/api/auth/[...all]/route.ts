import {auth} from "@/controllers/auth.controller";
import { toNextJsHandler} from "better-auth/next-js";

export const {GET, POST} = toNextJsHandler(auth);

