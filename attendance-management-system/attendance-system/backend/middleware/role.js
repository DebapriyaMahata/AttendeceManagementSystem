// Restricts route access to specific roles, e.g. authorize('hr')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Access denied: requires role(s) ${allowedRoles.join(', ')}`);
    }
    next();
  };
};

module.exports = { authorize };
