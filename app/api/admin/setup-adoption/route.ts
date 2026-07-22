import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ADMIN_SECRET = 'Lumo2026@';

const SQL = `
-- 1. Shelters table
CREATE TABLE IF NOT EXISTS shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  zip TEXT,
  website TEXT,
  org_photo_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adoption Pets table
CREATE TABLE IF NOT EXISTS adoption_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL DEFAULT 'dog',
  breed TEXT,
  age TEXT NOT NULL DEFAULT 'adult',
  size TEXT NOT NULL DEFAULT 'medium',
  sex TEXT NOT NULL DEFAULT 'male',
  spayed_neutered BOOLEAN DEFAULT TRUE,
  temperament TEXT,
  description TEXT,
  adoption_fee TEXT,
  adoption_process TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'available',
  city TEXT NOT NULL,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Adoption Messages table
CREATE TABLE IF NOT EXISTS adoption_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES adoption_pets(id) ON DELETE CASCADE,
  shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  receiver_email TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export async function GET(request: NextRequest) {
  try {
    const { error: err1 } = await supabaseAdmin.from('shelters').select('id').limit(1);
    const { error: err2 } = await supabaseAdmin.from('adoption_pets').select('id').limit(1);
    const { error: err3 } = await supabaseAdmin.from('adoption_messages').select('id').limit(1);

    const tablesStatus = {
      shelters: !err1,
      adoption_pets: !err2,
      adoption_messages: !err3
    };

    const isReady = tablesStatus.shelters && tablesStatus.adoption_pets && tablesStatus.adoption_messages;

    return NextResponse.json({
      isReady,
      tablesStatus,
      sql: SQL
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('exec_sql', { sql: SQL });

    if (!rpcError) {
      return NextResponse.json({ success: true, message: 'Migration executed successfully via RPC exec_sql!', rpcData });
    }

    // Check direct status
    const { error: err1 } = await supabaseAdmin.from('shelters').select('id').limit(1);
    const { error: err2 } = await supabaseAdmin.from('adoption_pets').select('id').limit(1);
    const { error: err3 } = await supabaseAdmin.from('adoption_messages').select('id').limit(1);

    const isReady = !err1 && !err2 && !err3;

    return NextResponse.json({
      success: isReady,
      isReady,
      rpcError: rpcError.message,
      message: isReady
        ? 'All adoption tables are present and ready in Supabase!'
        : 'Anonymous RPC is blocked on Supabase. Please copy-paste the SQL script into Supabase SQL Editor.',
      sql: SQL
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
