import { NextRequest, NextResponse } from 'next/server';
import {
  getVerifiedSessionDetails,
  applySlidingSessionRenewal,
  clearAccountSessionCookie,
} from '@/lib/accountAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  };

  try {
    const sessionDetails = await getVerifiedSessionDetails(request);

    if (!sessionDetails) {
      const response = NextResponse.json(
        { signedIn: false, email: null },
        { status: 200, headers: noCacheHeaders }
      );
      clearAccountSessionCookie(response);
      return response;
    }

    const tempResponse = NextResponse.next();
    const refreshedToken = applySlidingSessionRenewal(tempResponse, sessionDetails);

    const response = NextResponse.json(
      {
        signedIn: true,
        email: sessionDetails.email,
        ...(refreshedToken ? { sessionToken: refreshedToken, renewed: true } : {}),
      },
      { status: 200, headers: noCacheHeaders }
    );

    if (refreshedToken) {
      applySlidingSessionRenewal(response, sessionDetails);
    }

    return response;
  } catch (err) {
    console.error('[Account Session API] Error verifying session:', err);
    const response = NextResponse.json(
      { signedIn: false, email: null },
      { status: 200, headers: noCacheHeaders }
    );
    clearAccountSessionCookie(response);
    return response;
  }
}
