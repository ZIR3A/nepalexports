import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Checks if the current user has one of the allowed roles.
 * @param {Array<string>} allowedRoles - Array of snake_case roles (e.g., ['super_admin', 'admin'])
 * @returns {NextResponse|null} Returns a 403/401 NextResponse if unauthorized, or null if authorized
 */
export async function authorizeRoles(...allowedRoles) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Return null if authorization succeeds, so the route handler can proceed
    return null;
  } catch (error) {
    console.error('[Authorization Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
