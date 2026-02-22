# Quick Deployment Guide

## Pre-Deployment Checklist

1. **Backup Current Code**
   ```bash
   git add .
   git commit -m "Backup before security refactoring"
   ```

2. **Review Changes**
   ```bash
   git diff HEAD -- middleware/Verify.js
   git diff HEAD -- app.js
   git diff HEAD -- routes/routes.js
   git diff HEAD -- controllers/loginController.js
   git diff HEAD -- views/layouts/layout.ejs
   ```

## Deployment Steps

### 1. Test Locally First

```bash
# Install dependencies (if needed)
npm install

# Start server in test mode
npm start
```

### 2. Test Authentication Flow

**Test unauthorized access:**
1. Open incognito/private window
2. Go to `http://localhost:PORT/dashboard`
3. **Expected**: Should see HTTP 401 in Network tab, then redirect to /login
4. **NOT Expected**: HTTP 302 redirect

**Test forbidden access:**
1. Login as a user with limited permissions
2. Try accessing admin page
3. **Expected**: HTTP 403 in Network tab, then redirect back
4. **NOT Expected**: HTTP 302 redirect

**Test robots.txt:**
1. Visit `http://localhost:PORT/robots.txt`
2. **Expected**: See the robots.txt content
3. Verify `/login`, `/scoring/`, `/admin/` are disallowed

**Test meta tags:**
1. Visit `http://localhost:PORT/login`
2. View page source (Ctrl+U / Cmd+U)
3. **Expected**: See `<meta name="robots" content="noindex, nofollow">` in `<head>`

**Test security headers:**
1. Open DevTools → Network tab
2. Visit any protected page
3. Check Response Headers:
   - `X-Robots-Tag: noindex, nofollow` (for /login, /scoring, etc.)
   - `Content-Security-Policy: frame-ancestors 'self'`
   - `X-Content-Type-Options: nosniff`

### 3. Test Existing Functionality

- [ ] Normal login works
- [ ] Logout works
- [ ] Dashboard loads for authenticated users
- [ ] All user roles can access their permitted pages
- [ ] Session timeout still works
- [ ] Toast notifications appear for errors

### 4. Deploy to Production

```bash
# If using git deployment
git add .
git commit -m "Security refactoring: Fix Google Safe Browsing warning"
git push origin main

# If using manual upload
# Upload modified files:
# - middleware/Verify.js
# - app.js
# - routes/routes.js
# - controllers/loginController.js
# - views/layouts/layout.ejs
# - static/robots.txt (new file)
```

### 5. Restart Production Server

```bash
# If using PM2
pm2 restart app

# If using systemd
sudo systemctl restart vaultx

# If using Docker
docker-compose restart
```

## Post-Deployment Verification

### Immediate (5 minutes after deployment)

1. **Check server logs** for errors
   ```bash
   # PM2
   pm2 logs

   # Or check your log files
   tail -f logs/app.log
   ```

2. **Test live site** (same as local tests above)
   - Unauthorized access returns 401
   - Forbidden access returns 403
   - Login works normally
   - Users can access their dashboards

3. **Verify robots.txt**
   ```bash
   curl https://yourdomain.com/robots.txt
   ```

### Within 24 Hours

1. **Monitor error rates**
   - Check for 401/403 spike (normal)
   - Check for 500 errors (investigate if any)

2. **User feedback**
   - Ask active users if login experience changed
   - Check if anyone reports being locked out

### Within 1 Week

1. **Google Search Console**
   - Login to https://search.google.com/search-console
   - Check "Security & Manual Actions"
   - If still flagged, request review

2. **Check Google Safe Browsing**
   - Visit: https://transparencyreport.google.com/safe-browsing/search
   - Enter your domain
   - Should show "No unsafe content found" (may take 48-72 hours)

## Rollback Plan

If critical issues occur:

```bash
# Quick rollback
git revert HEAD
git push origin main

# Or restore specific files
git checkout HEAD~1 middleware/Verify.js
git checkout HEAD~1 app.js
git checkout HEAD~1 routes/routes.js
git checkout HEAD~1 controllers/loginController.js
git checkout HEAD~1 views/layouts/layout.ejs
rm static/robots.txt

# Commit and deploy
git add .
git commit -m "Rollback security changes"
git push origin main

# Restart server
pm2 restart app
```

## Troubleshooting

### Users can't login

**Symptom**: Login page loads but login fails

**Check**:
1. Server logs for JWT errors
2. Database connection
3. Session store (MongoDB)

**Quick fix**: Verify `MESSAGES.AUTH` constants exist in config

---

### Infinite redirect loop

**Symptom**: Browser says "too many redirects"

**Likely cause**: Meta refresh conflicting with other redirects

**Fix**: Check if `CheckLoggedIn` middleware is working on /login route

---

### 401/403 pages show raw HTML

**Symptom**: Users see HTML source code instead of redirect

**Check**: Are browsers sending `Accept: text/html` header?

**Debug**: Add console.log in `wantsHtml()` function

---

### Robots.txt 404

**Symptom**: `/robots.txt` returns 404 Not Found

**Check**:
1. File exists at `/static/robots.txt`
2. Route is registered in `/routes/routes.js`
3. Server restarted after adding route

**Fix**: Ensure robots.txt route is before other routes

---

### Security headers missing

**Symptom**: DevTools shows no X-Robots-Tag header

**Check**:
1. Middleware is registered in app.js
2. Middleware is before routes
3. Path matches (e.g., `/login` vs `/login/`)

**Debug**: Add console.log in security headers middleware

---

## Support Contacts

- **Google Safe Browsing Review**: https://safebrowsing.google.com/safebrowsing/report_error/
- **Search Console**: https://search.google.com/search-console
- **Documentation**: See SECURITY_REFACTORING_SUMMARY.md

---

## Timeline Expectations

| Action | Timeline |
|--------|----------|
| Deploy changes | Immediate |
| Users notice changes | Should be transparent |
| Google re-crawls site | 24-72 hours |
| Safe Browsing warning removed | 48-96 hours |
| Search Console update | 1-2 weeks |

---

## Success Metrics

✅ **Technical Success**:
- All 401/403 responses use proper HTTP status codes
- No redirect chains in authentication flow
- Security headers present on all responses
- robots.txt accessible and correct

✅ **User Success**:
- No increase in support tickets
- No login failures reported
- Session behavior unchanged
- Toast notifications working

✅ **SEO Success**:
- Google Safe Browsing warning removed
- Login page not indexed
- Public pages remain indexed
- No drop in legitimate search traffic

---

Good luck with deployment! 🚀
