import {Router} from "express"
import {registerUser,login,getUsers,getMe,deleteUser,updateUser,logoutUser,refreshAccessToken,resetUserPassword,requestResetPassword,forgotPasswordReset,getUserdetails} from "../controllers/auth.controller.js"
import { verifyJWT,authorizeRole } from "../middlewares/auth.middleware.js";
import{UserRolesEunm} from '../utils/constant.js';

const router= Router();

router.route("/register").post(registerUser);
router.route("/login").post(login);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(requestResetPassword);
router.route("/forgot-password/:resetToken").post(forgotPasswordReset);

router.route("/me").get(verifyJWT,getMe);
router.route("/user-details").post(verifyJWT,getUserdetails);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/reset-password").post(verifyJWT,resetUserPassword);
router.route("/users").get(verifyJWT,getUsers);
router.route("/delete").delete(verifyJWT,authorizeRole(UserRolesEunm.ADMIN),deleteUser);
router.route("/update-user").patch(verifyJWT,authorizeRole(UserRolesEunm.REVIEWER),updateUser);

export default router;