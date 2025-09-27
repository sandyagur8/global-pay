import { NextRequest, NextResponse } from 'next/server';
import { oneInchService } from '@/lib/1inch';

export async function GET(request: NextRequest) {
  try {
    const tokens = await oneInchService.getTokens();
    
    return NextResponse.json({
      success: true,
      tokens,
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    return NextResponse.json(
      { error: 'Failed to get tokens' },
      { status: 500 }
    );
  }
}
