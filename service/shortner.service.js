import { eq } from "drizzle-orm";
import {db} from "../config/db.js"
import { shortLink } from "../drizzle/schema.js"

export const getAllShortLinks=async(userId)=>{
   return await db.select().from(shortLink).where(eq(shortLink.userId,userId));
}


export const getshortlinksbyShortcode=async(shortCode)=>{
    const [result]= await db.select().from(shortLink).where(eq(shortLink.shortCode, shortCode))
    
    return result;
}

export const insertingurl=async({url,finalShortcode,userId})=>{
    await db.insert(shortLink).values({
        url,shortCode:finalShortcode,userId
    })
}
export const findShortLinkbyId=async(id)=>{
    const [result]= await db.select().from(shortLink).where(eq(shortLink.id, id))
    return result;
}
export const updateshortcode=async({id,url,shortcode})=>{
    return await db.update(shortLink).set({url,shortCode:shortcode}).where(eq(shortLink.id,id));
}
export const deleteShortcodebyId=async(id)=>{
     return await db.delete(shortLink).where(eq(shortLink.id,id))
}