
module.exports = function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/auth/login');
    if (roles.length && !roles.includes(req.session.user.role)) {
      return res.status(403).send('Tidak memiliki akses');
    }
    next();
  };
};
