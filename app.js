import express from "express"
import path from "path"
// import router from "./routes/shortner.route.js";
import { shortnerRoute } from "./routes/shortner.route.js";
import { authRoutes } from "./routes/auth.route.js";

import cookieParser from "cookie-parser";
import { verifyAuthentication } from "./middlewares/verify-auth-middleware.js";
import session from "express-session";
import flash from "connect-flash";

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