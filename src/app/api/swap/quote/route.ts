import { NextRequest, NextResponse } from 'next/server';
import { oneInchService } from '@/lib/1inch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromToken = searchParams.get('fromToken');
    const toToken = searchParams.get('toToken');
    const amount = searchParams.get('amount');
    
    if (!fromToken || !toToken || !amount) {
      return NextResponse.json(
        { error: 'fromToken, toToken, and amount are required' },
        { status: 400 }
      );
    }

    const quote = await oneInchService.getQuote(fromToken, toToken, amount);
    
    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error) {
    console.error('Error getting swap quote:', error);
    return NextResponse.json(
      { error: 'Failed to get swap quote' },
      { status: 500 }
    );
  }
}
