# 📊 Website Analytics Setup Guide

This guide shows you how to add Google Analytics (GA4) to track visitors on your FranResearch website.

---

## 🎯 What Analytics Are Already Installed

✅ **Google Analytics 4 (GA4) tracking code** has been added to:
- `index.html` (Homepage)
- `FranchiseNews/news-feed.html`
- `FranchiseNews/news-ticker.html`
- `FranchiseNews/news-scroller.html`

All you need to do is **replace the placeholder** `G-XXXXXXXXXX` with your actual Google Analytics Measurement ID.

---

## 📝 Step-by-Step Setup

### 1. Create a Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **"Start measuring"** or **"Admin"** (bottom left)
3. Create a new account:
   - **Account name**: "FranResearch" (or your choice)
   - **Property name**: "WebApp" or "FranResearch Website"
   - **Reporting time zone**: Your timezone
   - **Currency**: Your currency

4. Click **"Next"** and complete setup

### 2. Get Your Measurement ID

1. In Google Analytics, go to **Admin** (bottom left gear icon)
2. Under **Property**, click **Data Streams**
3. Click **Add stream** → **Web**
4. Enter your website URL: `https://monroegamble.github.io`
5. Stream name: "GitHub Pages"
6. Click **Create stream**

7. You'll see your **Measurement ID** (format: `G-XXXXXXXXXX`)
   - Copy this ID

### 3. Replace the Placeholder in Your Files

**Find and replace** `G-XXXXXXXXXX` with your actual Measurement ID in these files:

#### Using Command Line (Easiest)

```bash
cd /path/to/WebApp

# Replace in all files at once
sed -i 's/G-XXXXXXXXXX/G-YOUR-ACTUAL-ID/g' index.html
sed -i 's/G-XXXXXXXXXX/G-YOUR-ACTUAL-ID/g' FranchiseNews/news-feed.html
sed -i 's/G-XXXXXXXXXX/G-YOUR-ACTUAL-ID/g' FranchiseNews/news-ticker.html
sed -i 's/G-XXXXXXXXXX/G-YOUR-ACTUAL-ID/g' FranchiseNews/news-scroller.html
```

#### Using Text Editor

Or manually open each file and replace `G-XXXXXXXXXX` with your ID:

1. Open `index.html`
2. Find: `G-XXXXXXXXXX`
3. Replace with: `G-YOUR-ACTUAL-ID` (e.g., `G-1A2B3C4D5E`)
4. Save the file
5. Repeat for the other 3 files

### 4. Commit and Deploy

```bash
git add index.html FranchiseNews/*.html
git commit -m "Add Google Analytics tracking with measurement ID"
git push origin main
```

Wait 1-2 minutes for GitHub Pages to deploy.

### 5. Test Analytics

1. Visit your website: https://monroegamble.github.io/WebApp/
2. In Google Analytics, go to **Reports** → **Realtime**
3. You should see yourself as an active user within 30 seconds

---

## 📊 What Gets Tracked

### Automatic Tracking

✅ **Page views** - Every time someone loads a page
✅ **User sessions** - How long people stay on your site
✅ **Bounce rate** - How many leave immediately
✅ **Traffic sources** - Where visitors come from (Google, social media, direct, etc.)
✅ **Device types** - Desktop, mobile, tablet
✅ **Location** - Country, city (IP-based, anonymized)
✅ **Browser & OS** - Chrome, Safari, Firefox, etc.

### Privacy Features Enabled

✅ **IP anonymization** - User IPs are anonymized
✅ **No personal data collection** - No emails, names, etc.
✅ **Cookie consent** - Follows best practices
✅ **Secure cookies** - SameSite=None;Secure flags

---

## 🔍 How to View Analytics

### Go to Google Analytics Dashboard

1. Visit [analytics.google.com](https://analytics.google.com/)
2. Select your property (FranResearch)

### Key Reports

#### **Realtime Report**
- See visitors on your site RIGHT NOW
- Location: **Reports** → **Realtime**

#### **Acquisition Report**
- Where your visitors come from
- Location: **Reports** → **Acquisition** → **Traffic acquisition**

#### **Engagement Report**
- Which pages are most popular
- Location: **Reports** → **Engagement** → **Pages and screens**

#### **User Demographics**
- Age, gender, interests, location
- Location: **Reports** → **User** → **User attributes**

#### **Tech Report**
- Browsers, devices, screen sizes
- Location: **Reports** → **Tech** → **Tech details**

---

## 🎯 Custom Event Tracking (Optional)

The analytics code includes custom event tracking functions. To use them:

### Track Custom Events

```javascript
// Track button clicks
trackEvent('Button', 'click', 'Download CSV', 1);

// Track widget views
trackWidgetView('Stock Ticker');

// Track external link clicks
trackEvent('External Link', 'click', 'GitHub Repo', 1);
```

### Example: Track Chart Interactions

Add this to your chart JavaScript:

```javascript
// When user zooms on chart
trackEvent('Chart', 'zoom', 'Stock Chart', 1);

// When user changes time range
trackEvent('Chart', 'time_range_change', '1 Year', 1);
```

### Example: Track News Clicks

Add this to news widget:

```javascript
// When user clicks a news article
trackEvent('News', 'article_click', articleTitle, 1);
```

---

## 📈 Recommended Dashboards

### Create a Custom Dashboard

1. Go to **Explore** (left sidebar)
2. Click **Create Exploration**
3. Add these key metrics:
   - **Users** (total visitors)
   - **Sessions** (total visits)
   - **Pageviews** (total pages viewed)
   - **Bounce Rate** (% who leave immediately)
   - **Average Session Duration**

### Monitor These Key Metrics

| Metric | What It Means | Target |
|--------|---------------|--------|
| **Users** | Unique visitors | Growing over time |
| **Sessions** | Total visits | 2-3x users (return visits) |
| **Pages/Session** | Engagement | 2-3+ pages |
| **Bounce Rate** | Quality | <60% is good |
| **Session Duration** | Interest | 2+ minutes is good |

---

## 🚀 Advanced Setup (Optional)

### Google Tag Manager

For more advanced tracking, consider Google Tag Manager:

1. Create account at [tagmanager.google.com](https://tagmanager.google.com/)
2. Install GTM code instead of GA4 code
3. Add GA4 as a tag in GTM
4. Add custom triggers and events

### Search Console Integration

Link Google Search Console for SEO data:

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property: `https://monroegamble.github.io/WebApp/`
3. Verify ownership (via Google Analytics)
4. Link in GA4: **Admin** → **Product Links** → **Search Console**

---

## 🛡️ Privacy Compliance

Your analytics setup already includes:

✅ **GDPR Compliant** - IP anonymization enabled
✅ **CCPA Compliant** - No personal data collection
✅ **Cookie Policy** - Secure cookie flags
✅ **Anonymized IPs** - User privacy protected

### Optional: Add Cookie Consent Banner

If you want to be extra careful (required in EU):

```html
<!-- Cookie Consent Banner -->
<div id="cookie-consent" style="position: fixed; bottom: 0; width: 100%; background: #000; color: #fff; padding: 15px; text-align: center; z-index: 9999;">
  We use cookies to analyze site usage. By continuing, you accept our use of cookies.
  <button onclick="acceptCookies()" style="margin-left: 10px; padding: 8px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
    Accept
  </button>
</div>

<script>
function acceptCookies() {
  document.getElementById('cookie-consent').style.display = 'none';
  localStorage.setItem('cookieConsent', 'true');
}

// Hide banner if already accepted
if (localStorage.getItem('cookieConsent') === 'true') {
  document.getElementById('cookie-consent').style.display = 'none';
}
</script>
```

---

## 🔧 Troubleshooting

### Analytics Not Showing Data

**1. Check Measurement ID**
- Make sure you replaced `G-XXXXXXXXXX` with your actual ID
- Format should be `G-` followed by 10 characters

**2. Clear Browser Cache**
```bash
# Hard refresh
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**3. Check Browser Console**
- Open DevTools (F12)
- Look for errors in Console
- Check Network tab for `gtag/js` requests

**4. Verify Deployment**
- Make sure changes are committed and pushed
- Check GitHub Actions completed successfully
- Wait 2-3 minutes after deployment

**5. Test in Incognito**
- Ad blockers can block analytics
- Try incognito/private mode

**6. Check Realtime Report**
- Data can take 24-48 hours to appear in main reports
- Realtime report shows data within 30 seconds

### Common Issues

| Issue | Solution |
|-------|----------|
| No data after 24 hours | Double-check Measurement ID is correct |
| Realtime shows data, reports don't | Wait 24-48 hours for processing |
| Getting errors in console | Check that gtag.js script is loading |
| Data seems low | Many users block analytics with ad blockers |

---

## 📚 Resources

- [Google Analytics Documentation](https://support.google.com/analytics/)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [Event Tracking Guide](https://support.google.com/analytics/answer/9267735)
- [Privacy & Compliance](https://support.google.com/analytics/answer/9019185)

---

## ✅ Quick Checklist

- [ ] Created Google Analytics account
- [ ] Created GA4 property
- [ ] Created web data stream
- [ ] Copied Measurement ID
- [ ] Replaced `G-XXXXXXXXXX` in 4 files
- [ ] Committed and pushed changes
- [ ] Verified deployment
- [ ] Tested in Realtime report
- [ ] Set up custom dashboard (optional)
- [ ] Linked Search Console (optional)
- [ ] Added cookie consent (optional, EU)

---

**That's it!** Your website now has professional analytics tracking. 🎉

For questions or issues, check the [Google Analytics Help Center](https://support.google.com/analytics/).
