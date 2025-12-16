# 🌐 DNS Setup Guide for linkmeu.com

## 📋 **REQUIRED DNS CONFIGURATION**

To point your `linkmeu.com` domain to GitHub Pages, you need to configure DNS records with your domain registrar.

---

## 🎯 **DNS RECORDS TO ADD**

### **Option 1: CNAME Record (Recommended)**
```
Type: CNAME
Name: www
Value: adelphos-tech.github.io
TTL: 3600 (or default)
```

### **Option 2: A Records (Alternative)**
```
Type: A
Name: @
Value: 185.199.108.153
TTL: 3600

Type: A
Name: @
Value: 185.199.109.153
TTL: 3600

Type: A
Name: @
Value: 185.199.110.153
TTL: 3600

Type: A
Name: @
Value: 185.199.111.153
TTL: 3600
```

### **AAAA Records (IPv6 - Optional but Recommended)**
```
Type: AAAA
Name: @
Value: 2606:50c0:8000::153
TTL: 3600

Type: AAAA
Name: @
Value: 2606:50c0:8001::153
TTL: 3600

Type: AAAA
Name: @
Value: 2606:50c0:8002::153
TTL: 3600

Type: AAAA
Name: @
Value: 2606:50c0:8003::153
TTL: 3600
```

---

## 🛠️ **STEP-BY-STEP SETUP**

### **Step 1: Access Your Domain Registrar**
1. Log into your domain registrar (where you bought linkmeu.com)
2. Navigate to DNS management/DNS settings
3. Look for "Manage DNS" or "DNS Records"

### **Step 2: Add DNS Records**
1. **Delete any existing A or CNAME records** for @ and www
2. **Add the records** from the options above
3. **Save changes**

### **Step 3: Wait for Propagation**
- DNS changes can take **24-48 hours** to fully propagate
- You can check status using tools like:
  - https://dnschecker.org/
  - https://whatsmydns.net/

### **Step 4: Verify GitHub Pages Configuration**
1. Go to your GitHub repository: https://github.com/Adelphos-tech/event
2. Navigate to **Settings** → **Pages**
3. Under "Custom domain", enter: `linkmeu.com`
4. Check "Enforce HTTPS" (recommended)

---

## 🔍 **COMMON DOMAIN REGISTRARS**

### **GoDaddy**
1. Login → My Products → DNS
2. Add records in DNS Management

### **Namecheap**
1. Domain List → Manage → Advanced DNS
2. Add records in Host Records section

### **Cloudflare**
1. Select domain → DNS → Records
2. Add records and set proxy status to "DNS only" (gray cloud)

### **Google Domains**
1. My domains → Manage → DNS
2. Add records in Custom resource records

---

## ✅ **VERIFICATION CHECKLIST**

### **Before DNS Changes**
- [ ] CNAME file created in repository (`public/CNAME`)
- [ ] Application configured for root domain (`base: '/'`)
- [ ] Router updated (`basename="/"`)
- [ ] Code deployed to GitHub Pages

### **After DNS Changes**
- [ ] DNS records added to registrar
- [ ] GitHub Pages custom domain configured
- [ ] HTTPS enforcement enabled
- [ ] Domain resolves to GitHub Pages
- [ ] Application loads correctly

---

## 🚨 **TROUBLESHOOTING**

### **Domain Not Resolving**
- Check DNS propagation: https://dnschecker.org/
- Verify DNS records are correct
- Wait 24-48 hours for full propagation

### **SSL Certificate Issues**
- Enable "Enforce HTTPS" in GitHub Pages settings
- Wait for GitHub to provision SSL certificate (can take 24 hours)

### **404 Errors**
- Ensure CNAME file exists in repository
- Check that custom domain is set in GitHub Pages settings
- Verify application routes are correct

### **Mixed Content Warnings**
- Update any hardcoded HTTP URLs to HTTPS
- Check external resources (fonts, APIs) use HTTPS

---

## 📞 **SUPPORT RESOURCES**

### **GitHub Pages Documentation**
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

### **DNS Checker Tools**
- https://dnschecker.org/
- https://whatsmydns.net/
- https://mxtoolbox.com/

### **SSL Certificate Check**
- https://www.ssllabs.com/ssltest/

---

## 🎯 **EXPECTED TIMELINE**

### **Immediate (0-1 hours)**
- [ ] Code changes deployed
- [ ] DNS records added
- [ ] GitHub Pages configured

### **Within 24 Hours**
- [ ] DNS propagation starts
- [ ] Domain begins resolving
- [ ] SSL certificate provisioning

### **Within 48 Hours**
- [ ] Full DNS propagation complete
- [ ] SSL certificate active
- [ ] Domain fully functional

---

## 🎉 **FINAL RESULT**

Once complete, your EventsX application will be accessible at:

- **Primary**: https://linkmeu.com
- **With www**: https://www.linkmeu.com (if CNAME configured)
- **Secure**: HTTPS enforced
- **Fast**: Global CDN via GitHub Pages

Your professional event management platform will be live on your custom domain! 🚀
