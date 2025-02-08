import jwt from 'jsonwebtoken';

export const generateToken = (res, user) => {
    console.log('JWT_SECRET:', process.env.JWT_SECRET);  // Add this line

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log('Generated Token:', token);
};
