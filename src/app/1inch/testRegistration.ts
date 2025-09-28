import { registerENSForRecipient } from './registerForRecipient';
import { config } from './config';

async function testRegistration() {
  try {
    // Example usage of the registration function
    const recipientAddress = '0x742d35Cc6634C0532925a3b8D0c9e3e0e8b9c5b1'; // Replace with actual recipient address
    const domainName = 'testdomain99999'; // Replace with desired domain name
    
    console.log('🧪 Testing ENS Registration for Recipient');
    console.log('=========================================');
    console.log(`Recipient: ${recipientAddress}`);
    console.log(`Domain: ${domainName}.eth`);
    console.log(`Registrar: ${config.PRIVATE_KEY ? 'Private key configured' : 'No private key'}`);
    
    // Call the registration function
    const result = await registerENSForRecipient(
      recipientAddress,
      domainName,
      undefined, // Use config.PRIVATE_KEY
      31536000   // 1 year duration
    );
    
    console.log('\n🎉 Registration completed successfully!');
    console.log('=====================================');
    console.log(`Domain: ${result.domain}`);
    console.log(`Recipient: ${result.recipient}`);
    console.log(`Registrar: ${result.registrar}`);
    console.log(`Registration Tx: ${result.transactionHash}`);
    console.log(`Transfer Tx: ${result.transferHash}`);
    console.log(`Cost: ${result.cost} ETH`);
    console.log(`Block: ${result.blockNumber}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRegistration()
    .then(() => {
      console.log('\n✨ Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

export { testRegistration };
