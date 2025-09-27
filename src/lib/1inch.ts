// 1inch Fusion API integration
const ONEINCH_API_BASE = 'https://api.1inch.dev';
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface SwapQuote {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  protocols: any[];
}

export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  gas: string;
}

export class OneInchService {
  private chainId: number;
  private apiKey: string;

  constructor(chainId: number = 31) { // Rootstock Testnet
    this.chainId = chainId;
    this.apiKey = ONEINCH_API_KEY || '';
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${ONEINCH_API_BASE}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url.toString(), { headers });
    
    if (!response.ok) {
      throw new Error(`1inch API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getTokens(): Promise<Record<string, TokenInfo>> {
    try {
      const data = await this.makeRequest(`/swap/v6.0/${this.chainId}/tokens`);
      return data.tokens || {};
    } catch (error) {
      console.error('Error fetching tokens:', error);
      // Return mock tokens for Rootstock if API fails
      return {
        '0x0000000000000000000000000000000000000000': {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'RBTC',
          name: 'Rootstock Bitcoin',
          decimals: 18,
        },
        // Add mock USDC address for Rootstock
        '0x1bda44fda023f2af8280a16fd1b01d1a493ba6c4': {
          address: '0x1bda44fda023f2af8280a16fd1b01d1a493ba6c4',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
      };
    }
  }

  async getQuote(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string
  ): Promise<SwapQuote> {
    try {
      const data = await this.makeRequest(`/swap/v6.0/${this.chainId}/quote`, {
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount,
      });
      
      return {
        fromToken: data.fromToken,
        toToken: data.toToken,
        fromAmount: data.fromTokenAmount,
        toAmount: data.toTokenAmount,
        estimatedGas: data.estimatedGas,
        protocols: data.protocols,
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      throw new Error('Failed to get swap quote');
    }
  }

  async getSwapTransaction(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1
  ): Promise<SwapTransaction> {
    try {
      const data = await this.makeRequest(`/swap/v6.0/${this.chainId}/swap`, {
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount,
        from: fromAddress,
        slippage,
        disableEstimate: true,
      });
      
      return {
        from: data.tx.from,
        to: data.tx.to,
        data: data.tx.data,
        value: data.tx.value,
        gasPrice: data.tx.gasPrice,
        gas: data.tx.gas,
      };
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      throw new Error('Failed to get swap transaction');
    }
  }

  async getSpender(): Promise<string> {
    try {
      const data = await this.makeRequest(`/swap/v6.0/${this.chainId}/approve/spender`);
      return data.address;
    } catch (error) {
      console.error('Error getting spender:', error);
      // Return mock spender address for Rootstock
      return '0x0000000000000000000000000000000000000000';
    }
  }
}

export const oneInchService = new OneInchService();
