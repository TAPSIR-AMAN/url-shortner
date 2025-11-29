import { Router } from "express";
import * as authControllers  from "../controller/auth.controller.js"
 const router=Router()


 router.get("/register",authControllers.getRegisterpage)
//  router.get("/login",authControllers.getLoginpage)
//  router.post("/login",authControllers.postLogin)

router
.route("/register")
.get(authControllers.getRegisterpage)
.post(authControllers.postRegisterpage)
 router
 .route("/login")
 .get(authControllers.getLoginpage)
 .post(authControllers.postLogin)

router.route("/me")
.get(authControllers.getme)

router.route("/profile").get(authControllers.getProfilePage)
router.route("/verify-email").get(authControllers.getVerifyEmailPage)

router.route("/logout").get(authControllers.loggedoutuser)


export const authRoutes=router; 