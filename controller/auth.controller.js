
import { comparePassword, createUser, generateToken, getUserbyemail, hashpassword } from "../service/auth.services.js";



 export const getRegisterpage=(req,res)=>{
    if(req.user) return res.redirect("/")
        
    return res.render("./auth/register",{errors:req.flash("errors")})
}
export const postRegisterpage=async(req,res)=>{
    if(req.user) return res.redirect("/")
    const {name,email,password}=req.body;

    const userExists=await getUserbyemail(email)
    // console.log(userExists);
    
    // if(userExists) return res.redirect("/register")
    if(userExists){ 
        req.flash("errors","user already exists")
        // console.log(req.flash("errors"));
        
        return res.redirect("/register")
    }
    const hashedpassword=await hashpassword(password)
    const [users]=await createUser({name,email,password:hashedpassword})
    // console.log(users);
    
    // console.log(req.body);
    res.redirect("/login")
    
 }
export const getLoginpage=(req,res)=>{
    if(req.user) return res.redirect("/")
    return res.render("./auth/login")
    
 }
export const postLogin=async(req,res)=>{
    if(req.user) return res.redirect("/")
    const {email,password}=req.body;

    const user=await getUserbyemail(email)
    if(!user) return res.redirect("/login")
    
    const isPasswordValid=await comparePassword(password,user.password)

    // if(user.password !=password) return res.redirect("/login");
    if(!isPasswordValid) return res.redirect("/login");
    // res.setHeader('Set-Cookie',"isLoggedIn=true;path=/;")
    // res.cookie("isLoggedIn",true);
    const token=await generateToken({
        id:user.id,
        name:user.name,
        email:user.email
    })
    res.cookie("access_token",token)
    // console.log(token);
    
    res.redirect('/');

 }
export const getme=(req,res)=>{
    if(!req.user) return res.send("not logged in");
    return res.send(`<h1>Hey ${req.user.name}-${req.user.email} `)
}

export const loggedoutuser=(req,res)=>{
    res.clearCookie("access_token")
    res.redirect('/login')
}