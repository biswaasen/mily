import { User } from "../schema/index.schema.js";
import { Status } from "../schema/user.schema.js";

export class UserService {
  async getUser(identifier: { email?: string; userId?: string }): Promise<User | null> {
    if (identifier.userId) {
      return await User.findByPk(identifier.userId);
    }
    if (identifier.email) {
      return await User.findOne({
        where: { email: identifier.email },
      });
    }
    return null;
  }
  
  async createUser(data: {
    email: string;
    name: string;
    picture: string | null;
    status: Status;
  }): Promise<User> {
    const user = await User.create(data);
    return user;
  }

  async updateUser(
    user: User,
    data: {
      name?: string;
      picture?: string;
    }
  ): Promise<User> {
    try {
      await user.update(data);
      return user;
    } catch (error) {
      throw error;
    }
  }
}

