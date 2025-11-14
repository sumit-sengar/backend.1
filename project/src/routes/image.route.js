import { uploadImage,getUserImages,deleteImages,getImageById } from "../controllers/image.controller.js";
import { upload} from "../utils/multer.config.js"
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router= Router();

router.route("/upload").post(verifyJWT,upload.single("mypic"),uploadImage)
router.route("/my-images").get(verifyJWT, getUserImages);
router.route("/delete").delete(verifyJWT,deleteImages);
router.get("/images/:imageId", getImageById);

export default router;