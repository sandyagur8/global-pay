import { registerENSDomain } from './registerDomain';
import { checkDomainStatus } from './checkDomain';

async function main() {
  console.log('🌐 ENS Domain Registration Tool');
  console.log('==============================');
  console.log('');
  console.log('Available commands:');
  console.log('  npm run check    - Check domain availability and cost');
  console.log('  npm run register - Register the domain');
  console.log('  npm run dev      - Run this interactive menu');
  console.log('');
  
  // Get command line argument
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      await checkDomainStatus();
      break;
      
    case 'register':
      await registerENSDomain();
      break;
      
    default:
      console.log('💡 Usage examples:');
      console.log('  npm run check');
      console.log('  npm run register');
      console.log('');
      console.log('📝 Make sure to:');
      console.log('  1. Copy env.example to .env');
      console.log('  2. Fill in your PRIVATE_KEY and API keys');
      console.log('  3. Set your desired DOMAIN_NAME');
      console.log('  4. Ensure you have enough Sepolia ETH');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };

