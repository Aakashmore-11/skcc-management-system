module.exports = function(req, res, next) {
    // req.admin is set by auth middleware
    if (!req.admin || req.admin.role === 'teacher') {
        return res.status(403).json({ msg: 'Access Denied: Administrative privileges required.' });
    }
    next();
};
