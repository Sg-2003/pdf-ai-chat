import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_that_is_at_least_32_characters_long_12345';
const key = new TextEncoder().encode(JWT_SECRET);

/**
 * Sign a payload into a JWT token valid for 7 days.
 */
export async function signJWT(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

/**
 * Verify a JWT token. Returns the payload or null if invalid/expired.
 */
export async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}
