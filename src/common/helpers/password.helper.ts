import * as argon2 from "argon2";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // Adjust based on your server capacity
    timeCost: 3, // Adjust based on your requirements
    parallelism: 1,
  });
}

export async function verifyPassword(
  hashedPassword: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(hashedPassword, password);
}
