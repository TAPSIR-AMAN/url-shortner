import crypto from "crypto";
import { loadLinks, saveLinks } from "../model/shorten.module.js";
import { getAllShortLinks, getshortlinksbyShortcode, insertingurl, findShortLinkbyId, updateshortcode, deleteShortcodebyId } from "../service/shortner.service.js"
import z from "zod";
import { shortenerSchema } from "../validators/shortner-validator.js";
import { shortenerSearchParamsSchema } from "../drizzle/schema.js";

export const getshortner = async (req, res) => {
    try {
        if (!req.user) return res.redirect("/login")
        // const links = await getAllShortLinks(req.user.id)

        const searchParams = shortenerSearchParamsSchema.parse(req.query);

        const { shortLinks, totalCount } = await getAllShortLinks({
            userId: req.user.id,
            limit: 10,
            offset: (searchParams.page - 1) * 10,
        });
        const totalPages=Math.ceil(totalCount/10)

        return res.render("index", { links:shortLinks,
             host: req.host,
             currentPage:searchParams.page, 
             totalPages,
             errors: req.flash("errors")
             })

    } catch (error) {
        console.error(error)
        return res.status(500).send("internal server error")

    }
}
export const postUrlShortner = async (req, res) => {
    try {
        if (!req.user) return res.redirect("/login")
        const { data, error } = shortenerSchema.safeParse(req.body)
        if (error) {
            const errorMessages = error.issues.map((err) => err.message);
            req.flash("errors", errorMessages);
            return res.redirect("/");
        }
        const { shortcode, url } = data;

        const finalShortcode = shortcode || crypto.randomBytes(4).toString("hex")

        // const links=await loadLinks()
        const links = await getshortlinksbyShortcode(finalShortcode)

        if (links) {
            // return res.status(404).send("Shortcode already exists please choose another")
            req.flash(
                "errors",
                "URL with that shortcode already exists, please choose another"
            );
            return res.redirect("/");


        }
        // links[finalShortcode]=newUrl;
        // await saveLinks(links)

        await insertingurl({ url, finalShortcode, userId: req.user.id })
        return res.redirect("/")
    } catch (error) {
        console.error("POST Error:", error);  // <-- SEE THE ERROR
        return res.status(500).send("Internal Server Error");
    }
}

export const redirectToShortlink = async (req, res) => {
    try {
        const { shortcode } = req.params
        const links = await getshortlinksbyShortcode(shortcode)

        if (!links) return res.status(404).send("404 error occured")

        return res.redirect(links.url)
    } catch (error) {
        console.error(error)
        return res.status(500).send("internal server error")
    }
}
export const getShortnerEditPage = async (req, res) => {
    if (!req.user) return res.redirect("/login")
    // const id=req.params;
    const { data: id, error } = z.coerce.number().int().safeParse(req.params.id)
    if (error) return res.redirect("/404")
    try {
        const shortLinks = await findShortLinkbyId(id)

        if (!shortLinks) return res.redirect("/404")

        res.render("edit-shortLink", {
            id: shortLinks.id,
            url: shortLinks.url,
            shortcode: shortLinks.shortCode,
            errors: req.flash("errors")
        })

    } catch (error) {
        console.error(error)
        return res.status(500).send("internal server error")
    }
}

export const postShortnerEditPage = async (req, res) => {
    if (!req.user) return res.redirect("/login")
    // const id=req.params;
    const { data: id, error } = z.coerce.number().int().safeParse(req.params.id)
    if (error) return res.redirect("/404")

    try {
        const { url, shortcode } = req.body;

        const newUpdatedShortcode = await updateshortcode({ id, url, shortcode })

        if (!newUpdatedShortcode) return res.redirect("/404")
        res.redirect("/")
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY" || error.cause?.code === "ER_DUP_ENTRY") {
            req.flash("errors", "Shortcode already exists, please choose another");
            return res.redirect(`/edit/${id}`);
        }

        return res.status(500).send("internal server error")
    }
}
export const deleteShortcode = async (req, res) => {
    try {
        const { data: id, error } = z.coerce.number().int().safeParse(req.params.id)
        if (error) return res.redirect("/404")

        await deleteShortcodebyId(id)
        res.redirect("/")

    } catch (error) {
        console.error(error)
        return res.status(500).send("internal server error")
    }
}