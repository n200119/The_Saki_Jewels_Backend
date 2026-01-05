const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access only" });
  }
  console.log("Admin access granted");
  next();
};

export default adminOnly;
