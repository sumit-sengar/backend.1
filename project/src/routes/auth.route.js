import {Router} from "express"
import {registerUser,login,getUsers,getMe,deleteUser,updateUser,logoutUser,refreshAccessToken,resetUserPassword,requestResetPassword,forgotPasswordReset,getUserdetails,uploadProfilePicture,deleteProfilePicture, uploadProfilePictureAdmin, deleteProfilePictureAdmin} from "../controllers/auth.controller.js"
import { verifyJWT,authorizeRole } from "../middlewares/auth.middleware.js";
import{UserRolesEunm} from '../utils/constant.js';
import { upload } from "../utils/multer.config.js";
import { User } from "../models/user.model.js";

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
router.route("/update-user").patch(verifyJWT,authorizeRole(UserRolesEunm.REVIEWER,UserRolesEunm.ADMIN),updateUser);

router.route("/profile-picture").post(verifyJWT,upload.single("profilePic"),uploadProfilePicture);
router.route("/profile-picture").delete(verifyJWT,deleteProfilePicture);
router.route("/profile-pic-ad").post(verifyJWT,authorizeRole(UserRolesEunm.ADMIN),upload.single("profilePic"),uploadProfilePictureAdmin);
router.route("/profile-pic-ad").delete(verifyJWT,authorizeRole(UserRolesEunm.ADMIN),deleteProfilePictureAdmin);

export default router;