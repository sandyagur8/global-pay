import { generateNonce } from 'siwe';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const nonce = generateNonce();
    
    // In a production app, you'd want to store this nonce in a session or database
    // For now, we'll just return it
    return NextResponse.json({ nonce });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}
