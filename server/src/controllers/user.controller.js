import { User } from "../models/User.js";

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

export const listUsers = async (_req, res, next) => {
  try {
    const users = await User.find().select("-passwordHash").sort({ name: 1 });
    res.json({ success: true, users: users.map(serializeUser) });
  } catch (error) {
    next(error);
  }
};
