import User from "../models/user.model.js";

export const createUser = async ({ name, email }) => {
  const user = await User.create({
    name,
    email,
  });
  return user;
};

export const getAllUsers = async () => {
    const users = await User.findAll({
        order: [['createdAt', 'DESC']]
    });
    return users;
};

export const getUserById = async (id) => {
    const users = await User.findByPk(id);
    return users;
};

export const deleteUserById = async (id) => {
  const user =  await User.findByPk(id);

  if (!user) return null;

  await user.destroy();
  return user;
};

export const getCurrentUser = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "name", "email", "createdAt"],
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
}

export const deleteCurrentUser = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  await user.destroy();
};