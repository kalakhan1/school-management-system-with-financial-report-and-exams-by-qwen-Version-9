// Factory function to check roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Role '${req.user?.role || 'Guest'}' is not authorized to access this route` 
      });
    }
    next();
  };
};

// Pre-defined role checkers for convenience
const isAdmin = authorize('Admin');
const isAccountant = authorize('Admin', 'Accountant');
const isAcademicStaff = authorize('Admin', 'Clerk');
const isStaff = authorize('Admin', 'Accountant', 'Clerk');

module.exports = { authorize, isAdmin, isAccountant, isAcademicStaff, isStaff };