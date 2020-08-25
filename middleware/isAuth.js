module.exports = function (req, res, next) {
    // console.log(JSON.stringify(req.session));
    // console.log(req.session.isLoggedIn);
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
};
