import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token; // Make sure the token exists
    if (!token) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET); // Verify JWT token
    if (!decode || !decode.id) {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    req.id = decode.id; // Ensure user ID is correctly assigned
    next();
  } catch (error) {
    console.log("Authentication Error:", error);
    return res.status(500).json({
      message: "Authentication failed due to server error.",
      success: false,
    });
  }
};

export default isAuthenticated;
