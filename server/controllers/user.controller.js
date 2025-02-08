import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

// Register User
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        await User.create({
            name,
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully."
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to register."
        });
    }
};

// Login User
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login Attempt:', { email, password });

        if (!email || !password) {
            console.log('Missing fields');
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const user = await User.findOne({ email });
        console.log('User Found:', user);

        if (!user) {
            console.log('User not found in DB');
            return res.status(400).json({
                success: false,
                message: "Incorrect email or password"
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        console.log('Password Match:', isPasswordMatch);

        if (!isPasswordMatch) {
            console.log('Password mismatch');
            return res.status(400).json({
                success: false,
                message: "Incorrect email or password"
            });
        }

        generateToken(res, user);
        console.log('Token generated successfully');

        return res.status(200).json({
            success: true,
            message: `Welcome back ${user.name}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login Error:', error);  // This will show the exact error in the terminal
        return res.status(500).json({
            success: false,
            message: "Failed to login."
        });
    }
};


// Logout User
export const logout = async (_, res) => {
    try {
        res.cookie("token", "", { maxAge: 0 }).status(200).json({
            success: true,
            message: "Logged out successfully."
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to logout."
        });
    }
};

// Get User Profile
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.id;
        const user = await User.findById(userId).select("-password").populate("enrolledCourses");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Profile not found."
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to load user profile."
        });
    }
};

// Update User Profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { name } = req.body;
        const profilePhoto = req.file;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Delete old photo if exists
        if (user.photoUrl) {
            const publicId = user.photoUrl.split("/").pop().split(".")[0];
            await deleteMediaFromCloudinary(publicId);
        }

        // Upload new photo
        const cloudResponse = await uploadMedia(profilePhoto.path);
        const photoUrl = cloudResponse.secure_url;

        // Update user data
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, photoUrl },
            { new: true }
        ).select("-password");

        return res.status(200).json({
            success: true,
            user: updatedUser,
            message: "Profile updated successfully."
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile."
        });
    }
};
