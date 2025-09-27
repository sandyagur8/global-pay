# Global Pay - Decentralized Payroll & Subscriptions dApp

A modern, decentralized payroll platform that allows employers to pay their global teams and freelancers using cryptocurrency. Built with Next.js, TypeScript, and deployed on Rootstock for low-cost transactions.

## 🌟 Features

### Core Functionality
- **Web3 Authentication**: Secure login using Ethereum wallets with Sign-In with Ethereum (SIWE)
- **Employer Dashboard**: Create organizations, manage employees, and set up payment streams
- **Employee Portal**: View incoming payment streams, track earnings, and withdraw funds
- **Multi-Asset Funding**: Pay with any token using 1inch Fusion API, automatically converted to USDC
- **Low-Cost Settlement**: Built on Rootstock network for minimal transaction fees
- **ENS Integration**: Display ENS names and avatars instead of wallet addresses

### Technical Features
- **Type-Safe**: Full TypeScript implementation with strict mode
- **Modern UI**: Built with Shadcn/UI components and Tailwind CSS
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Real-time Updates**: Live balance calculations and stream status
- **Database Integration**: PostgreSQL with Prisma ORM for data persistence

## 🛠 Tech Stack

### Frontend
- **Next.js 14+** with App Router
- **TypeScript** (Strict Mode)
- **Tailwind CSS** for styling
- **Shadcn/UI** for components
- **Framer Motion** for animations
- **Lucide React** for icons

### Web3 & Blockchain
- **Wagmi** for Ethereum interactions
- **RainbowKit** for wallet connections
- **Viem** for low-level blockchain operations
- **SIWE** for authentication
- **Rootstock** for smart contract deployment

### Backend & Database
- **Next.js API Routes**
- **PostgreSQL** database
- **Prisma ORM** for type-safe database access
- **1inch Fusion API** for token swaps

### Smart Contracts
- **Solidity 0.8.24**
- **OpenZeppelin** contracts for security
- **Hardhat** for development and testing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Ethereum wallet (MetaMask recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd global-pay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/globalpay"
   
   # NextAuth/SIWE
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Web3 Configuration
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-project-id"
   
   # 1inch API
   ONEINCH_API_KEY="your-1inch-api-key"
   
   # Rootstock Network
   NEXT_PUBLIC_ROOTSTOCK_RPC_URL="https://public-node.testnet.rsk.co"
   NEXT_PUBLIC_CHAIN_ID="31"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Usage

### For Employers

1. **Connect Your Wallet**
   - Click "Connect Wallet" on the landing page
   - Sign the authentication message

2. **Create Organization**
   - Navigate to the dashboard
   - Create your organization profile

3. **Add Employees**
   - Click "Create Stream" 
   - Enter employee wallet address or ENS name
   - Set salary amount and payment interval

4. **Fund Payment Streams**
   - Choose any token from your wallet
   - The system automatically swaps to USDC using 1inch
   - Funds are escrowed in the smart contract

### For Employees

1. **Connect Your Wallet**
   - Use the same wallet address your employer added

2. **View Your Streams**
   - Navigate to "My Streams"
   - See all incoming payment streams
   - Track vesting progress in real-time

3. **Withdraw Earnings**
   - Click "Withdraw" on any stream
   - Funds are transferred directly to your wallet

## 🏗 Architecture

### Smart Contract Architecture
```
GlobalPayroll.sol
├── createStream()     # Create new payment stream
├── fundStream()       # Add funds to existing stream
├── withdrawFromStream() # Employee withdrawals
├── balanceOf()        # Calculate vested amount
└── cancelStream()     # Employer cancellation
```

### Database Schema
```
User
├── walletAddress (unique)
├── isEmployer
└── organization (optional)

Organization
├── name
├── owner (User)
└── streams[]

PaymentStream
├── employer (Organization)
├── employeeAddress
├── amountPerSecond
├── startTime / stopTime
├── totalFunded / totalWithdrawn
└── isActive
```

### API Routes
```
/api/auth/
├── nonce          # Generate SIWE nonce
└── verify         # Verify signature

/api/organization/
├── POST           # Create organization
└── GET            # Get organization

/api/streams/
├── POST           # Create payment stream
└── GET            # List streams

/api/swap/
├── tokens         # Get available tokens
└── quote          # Get swap quote
```

## 🔧 Development

### Running Tests
```bash
# Smart contract tests
npx hardhat test

# Frontend tests (if implemented)
npm test
```

### Deploying Smart Contracts
```bash
# Deploy to Rootstock Testnet
npx hardhat run scripts/deploy.js --network rootstockTestnet
```

### Building for Production
```bash
npm run build
```

## 🌐 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database Setup
- Use Vercel Postgres or any PostgreSQL provider
- Run migrations: `npx prisma migrate deploy`

## 🔐 Security Considerations

- Smart contracts use OpenZeppelin's battle-tested implementations
- SIWE authentication prevents replay attacks
- Database queries use Prisma's built-in SQL injection protection
- All user inputs are validated and sanitized
- Funds are held in escrow until withdrawal

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Rootstock** for providing a Bitcoin-secured smart contract platform
- **1inch** for enabling seamless token swaps
- **ENS** for decentralized identity resolution
- **OpenZeppelin** for secure smart contract libraries
- **Shadcn/UI** for beautiful, accessible components

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for the decentralized future of work**