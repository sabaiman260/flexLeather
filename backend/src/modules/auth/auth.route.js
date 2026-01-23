const { Router } = require("express");
const { upload } = require("../../core/middleware/multer.js");
const { validate } = require("../../core/middleware/validate.js");
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require("../../shared/validators/auth.validator.js");
const { registerUser, loginUser,verifyUserEmail, logoutUser, getAccessToken, forgotPasswordMail, resetPassword, getMe, googleLogin, updateMe, getGoogleClientId } = require("./auth.controller.js");
const { isLoggedIn } = require("../../core/middleware/isLoggedIn.js");

const authRouter = Router();

authRouter.post("/register", upload.single("profileImage"), validate(registerSchema), registerUser);
authRouter.post("/login", validate(loginSchema), loginUser);
authRouter.post("/google-login", googleLogin);
authRouter.get("/google-client-id", getGoogleClientId);
authRouter.post("/logout", isLoggedIn, logoutUser);
authRouter.get("/me", isLoggedIn, getMe);
authRouter.put("/me", isLoggedIn, updateMe);
authRouter.get("/verify/:token", verifyUserEmail);
authRouter.post("/refresh-token", getAccessToken);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordMail);
authRouter.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);

module.exports = authRouter;
