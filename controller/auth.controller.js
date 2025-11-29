
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import {
    authenticateUser,
    clearSession,
    comparePassword,
    createAccessToken,
    createRefreshToken,
    createSession,
    createUser,
    findUserById,
    getAllShortLinks,
    getUserbyemail,
    hashpassword
} from "../service/auth.services.js";
import { loginUserSchema, registerUserSchema } from "../validators/auth-validator.js";



export const getRegisterpage = (req, res) => {
    if (req.user) return res.redirect("/")

    return res.render("./auth/register", { errors: req.flash("errors") })
}
export const postRegisterpage = async (req, res) => {
    if (req.user) return res.redirect("/")
    // const {name,email,password}=req.body;

    const { data, error } = registerUserSchema.safeParse(req.body)
    console.log(data);

    if (error) {
        const errors = error.issues[0].message
        req.flash("errors", errors);
        return res.redirect("/register")
    }
    const { name, email, password } = data
    const userExists = await getUserbyemail(email)
    // console.log(userExists);
    // if(userExists) return res.redirect("/register")
    if (userExists) {
        req.flash("errors", "user already exists")
        return res.redirect("/register")
    }
    const hashedpassword = await hashpassword(password)
    const [user] = await createUser({ name, email, password: hashedpassword })
    // console.log(users);

    // console.log(req.body);
    // res.redirect("/login")
    await authenticateUser({ req, res, user, name, email })
    res.redirect('/');

}
export const getLoginpage = (req, res) => {
    if (req.user) return res.redirect("/")
    return res.render("./auth/login", { errors: req.flash("errors") })

}
export const postLogin = async (req, res) => {
    if (req.user) return res.redirect("/")
    const { data, error } = loginUserSchema.safeParse(req.body)
    // console.log(data);
    if (error) {
        const errors = error.issues[0].message
        req.flash("errors", errors);
        res.redirect("/login")
    }
    const { email, password } = data
    // const { email, password } = req.body;

    const user = await getUserbyemail(email)
    if (!user) {
        req.flash("errors", "Invalid Email and Password")
        return res.redirect("/login")

    }

    const isPasswordValid = await comparePassword(password, user.password)


    // if(user.password !=password) return res.redirect("/login");
    if (!isPasswordValid) {
        req.flash("errors", "Invalid Email and Password")
        return res.redirect("/login");
    }

    await authenticateUser({ req, res, user })
    res.redirect('/');

}

export const getme = (req, res) => {
    if (!req.user) return res.send("not logged in");
    return res.send(`<h1>Hey ${req.user.name}-${req.user.email} `)
}

export const loggedoutuser = async (req, res) => {
    await clearSession(req.user.sessionId)

    res.clearCookie("access_token")
    res.clearCookie("Refresh_token")
    return res.redirect('/login')
}

export const getProfilePage = async (req, res) => {
    if (!req.user) return res.send("not logged in");
    const user = await findUserById(req.user.id);
    if (!user) return res.redirect("/login");
    
    const usersShortlink = await getAllShortLinks(user.id)
    // console.log(user);
    
    return res.render("auth/profile", {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt:user.createdAt,
            links:usersShortlink,
            isEmailValid:user.isEmailValid,
        }
    })
}

export const getVerifyEmailPage = async (req, res) => {
    if (!req.user) return res.redirect("/");
    const user =await findUserById(req.user.id)
    if(!user || user.isEmailValid) return res.redirect("/")

    return res.render("auth/verify_email",{email:req.user.email})
}