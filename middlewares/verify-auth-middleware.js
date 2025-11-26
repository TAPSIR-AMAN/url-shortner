import {verifyJWTToken} from "../service/auth.services.js"

export const verifyAuthentication=async(req,res,next)=>{
    const token=req.cookies.access_token;
    
    if(!token){
        req.user=null;
        return next()
    }
    try {
        const decodedToken=verifyJWTToken(token)
        req.user=decodedToken;
        console.log("req.user",req.user);

    } catch (error) {
        console.error(error);
        
    }
    return next()
};
