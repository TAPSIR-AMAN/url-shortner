import { Router } from "express";
import { postUrlShortner, getshortner, redirectToShortlink, getShortnerEditPage, postShortnerEditPage, deleteShortcode } from "../controller/shortner.controller.js";

const router = Router()

router.get("/", getshortner);
router.post("/", postUrlShortner)

router.get("/:shortcode", redirectToShortlink)

router.route("/edit/:id").get(getShortnerEditPage).post(postShortnerEditPage)

router.route("/delete/:id").post(deleteShortcode)
export const shortnerRoute = router;

