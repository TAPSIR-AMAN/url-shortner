import { count, eq } from "drizzle-orm"
import { db } from "../config/db.js"
import { sessionsTable, shortLink, usersTable } from "../drizzle/schema.js"
// import bcrypt from "bcryptjs";
import argon2 from "argon2"
import jwt from "jsonwebtoken"
import { email } from "zod"
import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js"


export const getUserbyemail = async (email) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email))
  return user;
}
export const createUser = async ({ name, email, password }) => {
  return await db.insert(usersTable).values({ name, email, password }).$returningId()
}
export const hashpassword = async (password) => {
  // return await bcrypt.hash(password,10)
  return await argon2.hash(password)
}
export const comparePassword = async (password, hash) => {
  // return await bcrypt.compare(password,hash)
  return await argon2.verify(hash, password)
}
// export const generateToken=async({id,name,email})=>{
//     return  jwt.sign({id,name,email},process.env.JWT_SECREAT,{
//         expiresIn:"30d",
//     })
// }

export const createSession = async (userId, { ip, userAgent }) => {
  const [session] = await db.insert(sessionsTable).values({ userId, ip, userAgent }).$returningId();
  return session;

}
export const createAccessToken = ({ id, name, email, sessionId }) => {
  console.log("JWT SECRET =>", process.env.JWT_SECREAT);
  
  
  return jwt.sign({ id, name, email, sessionId }, process.env.JWT_SECREAT,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
      // equivalent to "15m"
    });
  };
  
  export const createRefreshToken = (sessionId) => {
    return jwt.sign({ sessionId }, process.env.JWT_SECREAT,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
      });
    };
    
    
    export const verifyJWTToken = (token) => {
      return jwt.verify(token, process.env.JWT_SECREAT)
    }
    export const findSessonById = async (sessionId) => {
      const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id,sessionId));
      
      return session;
      
    }
    export const findUserById = async (userId) => {
      const [user] =await db.select().from(usersTable).where(eq(usersTable.id,userId))
  return user;
}
export const refreshTokens = async (refreshToken) => {
  try {
    const decodedToken = verifyJWTToken(refreshToken)
    const currentSesson = await findSessonById(decodedToken.sessionId)
    
    if(!currentSesson || ! currentSesson.valid){
      throw new Error("Invalid sesson");
    }
    
    const user=await findUserById(currentSesson.userId)
    if(!user) throw new Error("Invalid User")
    
      const userInfo={
        id:user.id,
        name:user.name,
        email:user.email,
        isEmailValid:user.isEmailValid,
        sessionId:currentSesson.id
      }
      const newAccessToken = createAccessToken(userInfo)
      const newRefreshToken = createRefreshToken(currentSesson.id)
      
      return {
        newAccessToken,
        newRefreshToken,
        user:userInfo, 
      }
      
      
    } catch (error) {
      console.log(error.message);
      
    }
  }   
  
  export const clearSession = async (sessionId) => {
    return db.delete(sessionsTable).where(eq(sessionsTable.id,sessionId))
    
  }
  
  export const authenticateUser=async({req,res,user,name,email})=>{
    const session =await createSession(user.id,{
      ip:req.clientIp,
      userAgent:req.headers["user-agent"],
      
    })
    const accessToken = createAccessToken({
      id: user.id,
      name:user.name|| name,
      email:user.email || email,
      sessionId:session.id,
      isEmailValid:false,
    })
    const refreshToken = createRefreshToken(session.id)
    
    const baseConfig={httpOnly:true,secure:true}
    res.cookie("access_token",accessToken,{
      ...baseConfig,
      maxAge:ACCESS_TOKEN_EXPIRY
    })
    res.cookie("Refresh_token",refreshToken,{
      ...baseConfig,
      maxAge:REFRESH_TOKEN_EXPIRY
    })
    
  }
  
  // getAllShortLinks
  export const getAllShortLinks = async (userId) => {
    return await db.select().from(shortLink).where(eq(shortLink.userId,userId))
  }
  