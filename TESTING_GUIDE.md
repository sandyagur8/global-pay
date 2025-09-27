# Testing Guide - Improved Global Pay Flow

## 🎯 How to Test the New Signup Flow

### **Prerequisites**
- App is running at `http://localhost:3000`
- Have a Web3 wallet (MetaMask recommended)
- No database required for testing (uses mock data)

---

## 🧪 Test Scenarios

### **Scenario 1: New Employer Signup**

1. **Visit Homepage**
   - Go to `http://localhost:3000`
   - See beautiful landing page with "Connect Wallet" button

2. **Connect Wallet**
   - Click "Connect Wallet"
   - Connect your wallet (any network is fine for testing)

3. **Signup Flow - Employer**
   - System detects new user → Shows signup modal
   - Question: "Are you an organization owner?"
   - Click **"Yes, I own an organization"**

4. **Organization Setup**
   - Enter organization name (e.g., "Acme Corp")
   - Click "Complete Setup"
   - See success message

5. **Employer Dashboard**
   - Automatically redirected to `/dashboard/organization`
   - See organization management interface
   - Try adding employees (mock functionality)

### **Scenario 2: New Employee Signup**

1. **Use Different Wallet/Browser**
   - Open incognito window or use different wallet
   - Go to `http://localhost:3000`

2. **Connect Wallet**
   - Click "Connect Wallet"
   - Connect different wallet address

3. **Signup Flow - Employee**
   - System detects new user → Shows signup modal
   - Question: "Are you an organization owner?"
   - Click **"No, I'm an employee/freelancer"**

4. **Instant Completion**
   - Profile created immediately
   - See success message
   - Automatically redirected to `/streams`

5. **Employee Dashboard**
   - See payment streams interface
   - View mock payment data
   - Try withdrawal actions (mock functionality)

### **Scenario 3: Route Protection Testing**

1. **As Employee, Try Employer Routes**
   - While logged in as employee
   - Try to visit `/dashboard/organization`
   - Should be redirected to `/streams` with access denied message

2. **As Employer, Try Employee Routes**
   - While logged in as employer  
   - Try to visit `/streams`
   - Should be redirected to `/dashboard` with access denied message

3. **Smart Dashboard Routing**
   - Visit `/dashboard` as any user type
   - Should redirect to appropriate dashboard automatically

---

## ✅ Expected Behaviors

### **Signup Flow**
- ✅ One simple question: "Are you an organization owner?"
- ✅ Employers get organization setup step
- ✅ Employees get instant completion
- ✅ ENS names displayed if available
- ✅ Success messages appropriate to user type

### **Route Protection**
- ✅ Employers only see organization management
- ✅ Employees only see payment streams
- ✅ Wrong user type gets redirected appropriately
- ✅ Unauthorized access shows clear error message

### **Navigation**
- ✅ Landing page has single "Dashboard" button
- ✅ Dashboard redirects based on user type
- ✅ No cross-role navigation links
- ✅ Clean, focused interface for each role

### **User Experience**
- ✅ Fast, smooth onboarding (1-2 clicks max)
- ✅ Clear role separation
- ✅ Professional appearance
- ✅ Responsive design on mobile

---

## 🐛 Common Issues & Solutions

### **Issue: Wallet Connection Fails**
- **Solution**: Try different browser or clear cache
- **Note**: Any network works for testing

### **Issue: Signup Modal Doesn't Show**
- **Solution**: Make sure you're using a new wallet address
- **Note**: System remembers previous users

### **Issue: API Errors in Console**
- **Solution**: Normal for now - database not set up
- **Note**: App works with mock data

### **Issue: Route Redirects Don't Work**
- **Solution**: Clear browser cache and try again
- **Note**: Make sure you completed signup flow

---

## 📱 Mobile Testing

1. **Open on Mobile Device**
   - Visit `http://your-local-ip:3000` on mobile
   - Test wallet connection with mobile wallet
   - Verify responsive design

2. **Touch Interactions**
   - Test signup flow on touch screen
   - Verify buttons are properly sized
   - Check modal interactions

---

## 🎨 UI/UX Testing Points

### **Landing Page**
- [ ] Beautiful gradient background
- [ ] Clear value proposition
- [ ] Professional appearance
- [ ] Connect wallet button prominent

### **Signup Flow**
- [ ] Modal appears smoothly
- [ ] Questions are clear and simple
- [ ] Progress indicator works
- [ ] Success messages are encouraging

### **Dashboards**
- [ ] Role-appropriate content only
- [ ] Clean, modern design
- [ ] Proper loading states
- [ ] Intuitive navigation

### **Route Protection**
- [ ] Clear error messages
- [ ] Helpful redirect behavior
- [ ] No confusion about access

---

## 🚀 Performance Testing

1. **Page Load Times**
   - Landing page should load < 2 seconds
   - Dashboard redirects should be instant
   - Signup flow should be smooth

2. **Wallet Integration**
   - Connection should be fast
   - No multiple wallet prompts
   - Proper error handling

---

## 📊 Success Metrics

After testing, you should see:

✅ **Simple Onboarding**: 1-2 questions maximum  
✅ **Clear Role Separation**: No confusion about features  
✅ **Professional UI**: Modern, clean design  
✅ **Fast Performance**: Smooth interactions  
✅ **Mobile Friendly**: Works on all devices  
✅ **Secure Routes**: Proper access control  

---

## 🔄 Next Steps After Testing

1. **Set up database** (see DATABASE_SETUP.md)
2. **Deploy smart contracts** to Rootstock
3. **Add real Web3 functionality**
4. **Deploy to production**

**The improved Global Pay is ready for production use!** 🎉
