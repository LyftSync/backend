import jwt from 'jsonwebtoken';

export async function authMiddleware(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized: No token provided', { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    return null; // Proceed to next handler
  } catch (error) {
    return new Response('Unauthorized: Invalid token', { status: 401 });
  }
}
