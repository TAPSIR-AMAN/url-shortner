import { Router } from "express";
import { postUrlShortner,getshortner ,redirectToShortlink} from "../controller/shortner.controller.js";

const router=Router()


// const DATA_FILE = path.join("data", "links.json");

// const loadLinks = async () => {
//     try {
        
//         const data = await readFile(DATA_FILE, "utf-8");
//         if (!data.trim()) return {};
//         return JSON.parse(data);
//     } catch (error) {
//         if (error.code === "ENOENT") {
//             await writeFile(DATA_FILE, JSON.stringify({}));
//             return {};
//         }
//         throw error;
//     }
// };
// const saveLinks=async (links)=>{
//     await writeFile(DATA_FILE,JSON.stringify(links))
    
// }


router.get("/",getshortner);
// router.get("/",async(req,res)=>{
//     try {
//         const file=await readFile(path.join("views","index.html"));
//         const links=await loadLinks()
        
//         const Content = file.toString().replaceAll("{{ shortend_url}}",
//             Object.entries(links)
//             .map(
//                 ([shortcode,url])=>
//                     `<li><a href="/${shortcode}" target="_blank">${req.host}/${shortcode}</a> ->${url}</li>`
//             )
//             .join(" ")
//         )
//         return res.send(Content)
        
//     } catch (error) {
//         console.error(error)
//         return res.status(500).send("internal server error")
        
//     }
// })

router.post("/",postUrlShortner)

// router.use(express.json());// this is same as above but a little different 
// router.post("/",async(req,res)=>{
//     try {
//         const { url, shortcode } = req.body;
//         const finalShortcode=shortcode || crypto.randomBytes(4).toString("hex")
        
//         const links=await loadLinks()
//         let newUrl;
//         if (url.length>20) {
//             newUrl=url.slice(0,60)
            
//         }
//         if(links[finalShortcode]){
//             return res.status(404).send("Shortcode already exists please choose another")
            
//         }
        
//         links[finalShortcode]=newUrl;
        
//         await saveLinks(links)
//         return res.redirect("/")
//     } catch (error) {
        
//     }
// })

router.get("/:shortcode",redirectToShortlink)
    
// router.get("/:shortcode",async(req,res)=>{
//     try {
//         const {shortcode}=req.params
//         const links=await loadLinks()
//         if(!links[shortcode]) return res.status(404).send("404 error occured")
            
//             return res.redirect(links[shortcode])
//         } catch (error) {
//             console.error(error)
//             return res.status(500).send("internal server error")
//         }
//     })
    
    // export default router;
    
    export const shortnerRoute=router;
    // router.get("/report",(req,res)=>{
    //    const students = [
    //     { name: "Aman", marks: 90, percentage: 90, cgpa: 9.5 },
    //     { name: "Ravi", marks: 85, percentage: 85, cgpa: 9.0 },
    //     { name: "Sumit", marks: 78, percentage: 78, cgpa: 8.2 },
    //     { name: "Neha", marks: 92, percentage: 92, cgpa: 9.6 }
    // ];
    
    //     res.render("report",{students})
    // })