# 🌐 LinkMeU Custom Domain Setup Guide

## ✅ COMPLETED STEPS

### Code Configuration (DONE ✓)
- ✅ Changed base URL from `/event/` to `/`
- ✅ Updated router basename to `/`
- ✅ Fixed all asset paths (logo, etc.)
- ✅ Created CNAME file with `linkmeu.com`
- ✅ Deployed to GitHub Pages

---

## 📋 DNS CONFIGURATION (YOU NEED TO DO THIS)

### Step 1: Configure A Records in Network Solutions

1. **Go to Network Solutions Dashboard**
   - Visit: https://networksolutions.com
   - Login with your account
   - Navigate to: **Domains** → **linkmeu.com** → **Manage** → **DNS Settings**

2. **Add 4 A Records** (for apex domain: linkmeu.com)

```
Record 1:
- Type: A
- Host: @ (or leave blank)
- Points to: 185.199.108.153
- TTL: 3600 (1 hour)

Record 2:
- Type: A
- Host: @ (or leave blank)
- Points to: 185.199.109.153
- TTL: 3600

Record 3:
- Type: A
- Host: @ (or leave blank)
- Points to: 185.199.110.153
- TTL: 3600

Record 4:
- Type: A
- Host: @ (or leave blank)
- Points to: 185.199.111.153
- TTL: 3600
```

### Step 2: Add CNAME Record for WWW

```
Type: CNAME
Host: www
Points to: adelphos-tech.github.io.
TTL: 3600
```

**IMPORTANT:** Make sure to include the trailing dot (`.`) after `github.io`

---

## 🔧 STEP 3: CONFIGURE GITHUB PAGES

1. **Go to GitHub Repository Settings**
   - Visit: https://github.com/Adelphos-tech/event/settings/pages

2. **Set Custom Domain**
   - Under "Custom domain", enter: `linkmeu.com`
   - Click **Save**
   - Wait for DNS check to complete
   - ✅ Enable "Enforce HTTPS" (after DNS propagates)

---

## ⏰ WAIT FOR DNS PROPAGATION

- **Typical Time:** 15 minutes to 48 hours
- **Average:** 1-4 hours
- **Check Status:** https://dnschecker.org (enter: linkmeu.com)

---

## ✅ VERIFICATION CHECKLIST

After DNS propagates, verify:

- [ ] `linkmeu.com` loads your site
- [ ] `www.linkmeu.com` redirects to `linkmeu.com`
- [ ] HTTPS is working (green padlock)
- [ ] Logo displays correctly
- [ ] All pages load without errors
- [ ] Navigation works properly

---

## 🧪 TEST YOUR SETUP

### During DNS Propagation:
```bash
# Check A records
dig linkmeu.com

# Check CNAME
dig www.linkmeu.com
```

### Expected Results:
```
linkmeu.com → 185.199.108.153 (and 3 other IPs)
www.linkmeu.com → adelphos-tech.github.io
```

---

## 🎯 FINAL URLS

Once complete, your site will be available at:

- ✅ **https://linkmeu.com** (primary)
- ✅ **https://www.linkmeu.com** (redirects to above)
- ⚠️ **https://adelphos-tech.github.io/event/** (will redirect to linkmeu.com)

---

## 🚨 TROUBLESHOOTING

### Issue: DNS not propagating
- **Solution:** Wait 24 hours, DNS changes can take time
- **Check:** Use https://dnschecker.org

### Issue: "Domain's DNS record could not be retrieved"
- **Solution:** Verify A records are correct
- **Check:** Make sure you added all 4 A records

### Issue: Certificate error / Not Secure
- **Solution:** Wait for GitHub to provision SSL certificate
- **Time:** Usually 10-30 minutes after DNS propagates
- **Fix:** Enable "Enforce HTTPS" in GitHub Pages settings

### Issue: 404 Error
- **Solution:** Check CNAME file exists in repository
- **Verify:** https://github.com/Adelphos-tech/event/blob/gh-pages/CNAME

### Issue: Site loads but images/CSS missing
- **Solution:** Clear browser cache
- **Command:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## 📞 SUPPORT

If you encounter issues:

1. **Check DNS:** https://dnschecker.org
2. **GitHub Status:** https://www.githubstatus.com
3. **Network Solutions Support:** Contact their DNS support team

---

## 🎉 SUCCESS!

Once DNS propagates and GitHub Pages is configured:

✅ Your LinkMeU application will be live at **https://linkmeu.com**  
✅ SSL/HTTPS will be automatically enabled  
✅ All pages and features will work seamlessly  
✅ Professional custom domain for your event management platform!

---

**Last Updated:** December 24, 2025  
**Status:** Awaiting DNS configuration  
**Next Step:** Configure DNS records in Network Solutions
