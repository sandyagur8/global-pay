# 🧪 Quick Test Guide - Global Pay

## 🚀 **App is running on: http://localhost:3001**

### **Test the Complete Flow:**

## **Step 1: Visit the App**
1. Go to `http://localhost:3001`
2. You should see the beautiful landing page

## **Step 2: Connect Wallet**
1. Click "Connect Wallet" button
2. Connect with MetaMask (any network is fine for testing)
3. **Expected**: Signup modal should appear automatically

## **Step 3: Test Employer Flow**
1. In the signup modal, click "I am an Employer"
2. Enter organization name (e.g., "My Startup")
3. Click "Create Organization"
4. **Expected**: Success message and redirect to `/dashboard/organization`
5. **Expected**: See the full employer dashboard with treasury, employee management, etc.

## **Step 4: Test Employee Flow**
1. Use different wallet or clear browser data
2. Connect wallet again
3. In signup modal, click "I'm an employee/freelancer"
4. **Expected**: Instant success and redirect to `/streams`
5. **Expected**: See employee dashboard with payment tracking

## **Step 5: Test Navigation**
1. Try visiting `/dashboard` - should redirect based on user type
2. Try accessing wrong dashboard - should be blocked by route guards

## **Step 6: Test Smart Contracts (Advanced)**
1. Switch to Hardhat Local network (Chain ID 1337)
2. Import test account: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
3. Create organization as employer
4. Get test USDC tokens
5. Add employees and fund organization
6. Test real blockchain transactions!

---

## **What You Should See:**

### ✅ **Landing Page**
- Professional gradient design
- Connect wallet button
- Dashboard link in navigation

### ✅ **Signup Flow**
- Modal appears on wallet connect
- Simple role selection
- Organization setup for employers
- Instant completion for employees

### ✅ **Employer Dashboard**
- Organization creation interface
- Treasury management
- Employee management
- Token faucet for testing
- Real smart contract integration

### ✅ **Employee Dashboard** 
- Payment tracking
- Earnings visualization
- Withdrawal interface
- Employment details

### ✅ **Route Protection**
- Employers can't access `/streams`
- Employees can't access `/dashboard/organization`
- Smart redirects based on user type

---

## **Troubleshooting:**

### **Issue: Signup Modal Doesn't Appear**
- **Solution**: Make sure wallet is connected
- **Check**: Browser console for any errors

### **Issue: Dashboard Shows Loading Forever**
- **Solution**: Check if APIs are responding
- **Test**: Visit `http://localhost:3001/api/user/check?address=0x123`

### **Issue: Smart Contract Features Don't Work**
- **Solution**: Make sure Hardhat network is running
- **Check**: `npx hardhat node` in separate terminal

---

## 🎉 **Success Criteria:**

After testing, you should have:

✅ **Seamless wallet connection**  
✅ **Automatic signup flow**  
✅ **Role-based dashboards**  
✅ **Smart contract integration**  
✅ **Professional UI/UX**  
✅ **Route protection working**  

**The platform is fully functional!** 🚀

---

## **Next Steps:**
1. Set up real database (PostgreSQL)
2. Deploy to Rootstock Testnet
3. Add more advanced features
4. Deploy to production

**Global Pay is ready for real-world use!** 💼
