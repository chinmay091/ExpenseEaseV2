import {
    createUser,
    deleteUserById,
    getAllUsers,
    getCurrentUser,
    getUserById,
    deleteCurrentUser,
} from "../services/user.service.js";

export const createUserController = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required",
            });
        }
        
        const user = await createUser({ name, email });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "User already exists",
        });
    }
};

export const getAllUsersController = async (req, res) => {
    try {
        const users = await getAllUsers();

        return res.status(200).json({
            success: true,
            // count: users.length,
            data: users,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};

export const getUserByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "UserID is required",
            });
        }

        const user = await getUserById(id);

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "User does not exist",
        });
    }
};

export const deleteUserByIdController = async (req, res) => {
    try {
        const { id } = req.params;
       
        const deletedUser = await deleteUserById(id);
        
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: deletedUser,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
};

export const getCurrentUserController = async (req, res) => {
    try {
        const user = await getCurrentUser(req.user.id);

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error(error);

        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }
};

export const deleteCurrentUserController = async (req, res) => {
    try {
        await deleteCurrentUser(req.user.id);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error(error);

        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }
};