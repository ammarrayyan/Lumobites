import { NextRequest, NextResponse } from 'next/server';
import { searchAmazonProducts } from '@/lib/amazon';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = {
    rescuegroups: {
      configured: false,
      status: 'Not Configured',
      error: null as string | null,
      lastChecked: new Date().toISOString()
    },
    amazon: {
      configured: false,
      status: 'Not Configured',
      error: null as string | null,
      lastChecked: new Date().toISOString()
    }
  };

  // 1. RescueGroups
  const rgKey = process.env.RESCUEGROUPS_API_KEY;
  if (rgKey) {
    status.rescuegroups.configured = true;
    try {
      const res = await fetch('https://api.rescuegroups.org/v5/public/orgs/search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/vnd.api+json',
          'Authorization': rgKey
        },
        body: JSON.stringify({
          data: {
            filters: [],
            filterRadius: {
              miles: 10,
              postalcode: "90210"
            }
          }
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        status.rescuegroups.status = 'Error';
        status.rescuegroups.error = errorData.errors?.[0]?.title || res.statusText;
      } else {
        status.rescuegroups.status = 'Connected';
      }
    } catch (err: any) {
      status.rescuegroups.status = 'Error';
      status.rescuegroups.error = err.message || String(err);
    }
  }

  // 2. Amazon
  const amzClientId = process.env.AMAZON_CLIENT_ID;
  const amzClientSecret = process.env.AMAZON_CLIENT_SECRET;
  const amzTag = process.env.AMAZON_ASSOCIATE_TAG;
  
  if (amzClientId && amzClientSecret && amzTag) {
    status.amazon.configured = true;
    try {
      // searchAmazonProducts bubbles up errors like AssociateNotEligible
      await searchAmazonProducts('dog food', 1);
      status.amazon.status = 'Connected';
    } catch (err: any) {
      status.amazon.status = 'Error';
      status.amazon.error = err?.message || String(err);
    }
  }

  return NextResponse.json(status);
}
