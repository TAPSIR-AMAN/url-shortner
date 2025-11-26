import crypto from "crypto";
import {loadLinks,saveLinks} from "../model/shorten.module.js";
import {getAllShortLinks, getshortlinksbyShortcode, insertingurl} from "../service/shortner.service.js"
import { log } from "console";

export const getshortner =async(req,res)=>{
    try {
        if(!req.user) return res.redirect("/login")
        const links=await getAllShortLinks(req.user.id)

        return res.render("index",{links,host:req.host})
        
    } catch (error) {
        console.error(error)
        return res.status(500).send("internal server error")
        
    }
}
export const postUrlShortner=async(req,res)=>{
    try {
        if(!req.user) return res.redirect("/login")
        const { url, shortcode } = req.body;
        const finalShortcode=shortcode || crypto.randomBytes(4).toString("hex")
        
        // const links=await loadLinks()
        const links=await getshortlinksbyShortcode(finalShortcode)

        if(links){
            return res.status(404).send("Shortcode already exists please choose another")
            
        }
        // links[finalShortcode]=newUrl;
        // await saveLinks(links)

        await insertingurl({url,finalShortcode,userId:req.user.id})
        return res.redirect("/")
    } catch (error) {
        console.error("POST Error:", error);  // <-- SEE THE ERROR
        return res.status(500).send("Internal Server Error");
    }
}

export const redirectToShortlink=async(req,res)=>{
    try {
        const {shortcode}=req.params
        const links=await getshortlinksbyShortcode(shortcode)

        if(!links) return res.status(404).send("404 error occured")
            
        return res.redirect(links.url)
        } catch (error) {
            console.error(error)
            return res.status(500).send("internal server error")
        }
}