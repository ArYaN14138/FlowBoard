import { z } from "zod";
import { User } from "../models/User.js";
import { signToken } from "../services/token.service.js";
import { ApiError } from "../utils/ApiError.js";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    role: z.enum(["Admin", "Manager", "Member"]).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.validated.body;
    const existing = await User.findOne({ email });

    if (existing) {
      throw new ApiError(409, "Email is already registered");
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role: role || "Member" });

    res.status(201).json({
      success: true,
      token: signToken(user),
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, "Invalid email or password");
    }

    res.json({
      success: true,
      token: signToken(user),
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.json({ success: true, user: serializeUser(req.user) });
};
