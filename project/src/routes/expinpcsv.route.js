import {Router} from "express"
import { exportUsersToCSV,importUsersCSV } from "../controllers/expinpcsv.controller.js";
import { uploadCsv } from "../utils/uploadCsv.js";
import { verifyJWT,authorizeRole } from "../middlewares/auth.middleware.js";
import{UserRolesEunm} from '../utils/constant.js'

const router= Router();

router.route("/export-users").get(verifyJWT,exportUsersToCSV);
router.route("/import-users").post(verifyJWT,uploadCsv.single("file"),importUsersCSV);

export default router;