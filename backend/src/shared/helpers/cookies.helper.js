const isProduction = process.env.NODE_ENV === "production";

const storeLoginCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 15 * 60 * 1000,   // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,   // 7 days
    });
}

const storeAccessToken = (res, accessToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
}

module.exports = { storeLoginCookies, storeAccessToken };
