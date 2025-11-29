import flash from "connect-flash";
import express from "express"
import cookieParser from "cookie-parser";
import path from "path"
import requestIp from "request-ip";
import session from "express-session";
// import router from "./routes/shortner.route.js";
import { authRoutes } from "./routes/auth.route.js";
import { shortnerRoute } from "./routes/shortner.route.js";
import { verifyAuthentication } from "./middlewares/verify-auth-middleware.js";


const app=express()

app.use(express.static("public"))

app.use(express.urlencoded({ extended: true }));

app.use("/views", express.static(path.join(import.meta.dirname, "views")));

app.set("view engine","ejs")
// app.set("views","./views")
app.set("views", path.join(import.meta.dirname, "views"));

app.use(cookieParser())

app.use(
    session({secret:"my-secret",resave:true,saveUninitialized:false})
)
app.use(flash())

app.use(requestIp.mw())

// this must be after cookieParser
app.use(verifyAuthentication);

app.use((req,res,next)=>{
    res.locals.user=req.user
    return next()
})


app.use(authRoutes)
app.use(shortnerRoute)



const PORT=3001;
app.listen(PORT, () => {

    console.log(`server runing on port http://localhost:${PORT}`);

})