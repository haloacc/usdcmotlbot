import { User } from '../models/user';
import { users, usersByEmail } from './userService';

export async function findOrCreateOAuthUser({ email, first_name, last_name, email_verified, avatar, provider, provider_id }: any): Promise<User> {
  let userId = usersByEmail.get(email);
  if (userId) {
    return users.get(userId)!;
  }
  // Create new user
  const id = `oauth_${provider}_${provider_id}`;
  const user: User = {
    id,
    email,
    first_name,
    last_name,
    email_verified: !!email_verified,
    mobile_verified: false,
    password_hash: '',
    created_at: new Date(),
    updated_at: new Date(),
    status: 'active',
  };
  users.set(id, user);
  usersByEmail.set(email, id);
  return user;
}
