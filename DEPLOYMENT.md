# Deployment Guide for Global Pay

This guide walks you through deploying Global Pay to production.

## 🚀 Quick Deploy to Vercel

### 1. Prerequisites
- GitHub account
- Vercel account
- PostgreSQL database (Vercel Postgres recommended)
- WalletConnect Project ID
- 1inch API Key (optional)

### 2. Database Setup

#### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel dashboard
2. Create a new Postgres database
3. Copy the connection string

#### Option B: External PostgreSQL
1. Set up PostgreSQL on your preferred provider (Railway, Supabase, etc.)
2. Get the connection string

### 3. Environment Variables

Set these in your Vercel project settings:

```env
# Database
DATABASE_URL="your-postgres-connection-string"

# NextAuth/SIWE
NEXTAUTH_SECRET="generate-a-random-32-char-string"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Web3 Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-project-id"

# 1inch API (Optional - will use mock data if not provided)
ONEINCH_API_KEY="your-1inch-api-key"

# Rootstock Network Configuration
NEXT_PUBLIC_ROOTSTOCK_RPC_URL="https://public-node.testnet.rsk.co"
NEXT_PUBLIC_CHAIN_ID="31"

# Smart Contract Addresses (update after deployment)
NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS=""
```

### 4. Deploy Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. **Run Database Migrations**
   ```bash
   # After deployment, run this locally with production DATABASE_URL
   npx prisma migrate deploy
   ```

## 🔧 Manual Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Set Up Database
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 3. Start Production Server
```bash
npm start
```

## 📋 Post-Deployment Checklist

### 1. Verify Core Functionality
- [ ] Landing page loads correctly
- [ ] Wallet connection works
- [ ] Authentication flow completes
- [ ] Dashboard displays properly
- [ ] Database connections work

### 2. Test Web3 Integration
- [ ] Connect to Rootstock Testnet
- [ ] Wallet interactions function
- [ ] ENS resolution works (if on mainnet)

### 3. Smart Contract Deployment

#### Deploy to Rootstock Testnet
```bash
# Set up your private key in .env
PRIVATE_KEY="your-private-key-for-deployment"

# Deploy contracts
npx hardhat run scripts/deploy.ts --network rootstockTestnet
```

#### Update Contract Addresses
After deployment, update the environment variable:
```env
NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS="deployed-contract-address"
```

### 4. Configure External Services

#### WalletConnect Project ID
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy the Project ID
4. Add to environment variables

#### 1inch API Key (Optional)
1. Go to [1inch Developer Portal](https://portal.1inch.dev)
2. Create an account and get API key
3. Add to environment variables

## 🔒 Security Considerations

### Production Environment Variables
- Use strong, unique secrets for `NEXTAUTH_SECRET`
- Never commit private keys to version control
- Use environment-specific database URLs
- Enable HTTPS in production

### Database Security
- Use connection pooling for better performance
- Enable SSL connections
- Regularly backup your database
- Monitor for unusual activity

### Smart Contract Security
- Audit contracts before mainnet deployment
- Use multi-signature wallets for contract ownership
- Implement proper access controls
- Monitor contract interactions

## 📊 Monitoring & Analytics

### Recommended Tools
- **Vercel Analytics** for web performance
- **Sentry** for error tracking
- **LogRocket** for user session replay
- **Mixpanel** for user analytics

### Health Checks
Set up monitoring for:
- Database connectivity
- API response times
- Smart contract interactions
- External service availability (1inch, ENS)

## 🔄 Updates & Maintenance

### Database Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration-name

# Deploy to production
npx prisma migrate deploy
```

### Smart Contract Updates
- Deploy new contract versions
- Update frontend contract addresses
- Migrate existing data if needed
- Communicate changes to users

### Frontend Updates
```bash
# Deploy updates
git push origin main
# Vercel will automatically redeploy
```

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify DATABASE_URL is correct
- Check database server status
- Ensure IP whitelist includes Vercel IPs

#### Wallet Connection Issues
- Verify WalletConnect Project ID
- Check network configuration
- Ensure RPC URLs are accessible

#### Smart Contract Errors
- Verify contract addresses
- Check network configuration
- Ensure sufficient gas fees

### Debug Commands
```bash
# Check database connection
npx prisma db pull

# View database in browser
npx prisma studio

# Check build output
npm run build

# View deployment logs
vercel logs
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Open an issue on GitHub
4. Contact the development team

---

**Happy Deploying! 🚀**
