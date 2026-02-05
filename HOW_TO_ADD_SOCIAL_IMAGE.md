# How to Add Your Social Sharing Image

## Quick Steps

Your code is ready! Now you just need to upload your beautiful Arabic image.

### 1. Download/Save Your Image
- Save your beautiful Arabic image: **"رحلتك الشخصية مع القرآن"**
- Make sure it's **1200 x 630 pixels**
- Name it: `og-image.png`

### 2. Add to Your Repository

**Option A: Via GitHub Web Interface (Easiest)**
1. Go to: https://github.com/NmiriHoussem/Quranreadingplatform
2. Click on the `public` folder
3. Click "Add file" → "Upload files"
4. Drag and drop your `og-image.png` file
5. If a file with this name exists, choose to replace it
6. Scroll down and click "Commit changes"

**Option B: Via Git Command Line**
```bash
# Navigate to your project
cd Quranreadingplatform

# Copy your image to the public folder
cp /path/to/your/image.png public/og-image.png

# Commit and push
git add public/og-image.png
git commit -m "Add custom social sharing image"
git push origin main
```

### 3. Verify on Vercel

1. Go to your Vercel dashboard
2. Wait for the automatic deployment to complete
3. Visit your site: https://qurancircle.net
4. The build should succeed now!

### 4. Test Social Sharing

After deployment, test the image:

**Facebook:**
- Go to: https://developers.facebook.com/tools/debug/
- Enter: https://qurancircle.net
- Click "Debug" to see your image!

**Twitter:**
- Go to: https://cards-dev.twitter.com/validator
- Enter: https://qurancircle.net
- See your beautiful preview!

**WhatsApp (Quick Test):**
- Send yourself the link: https://qurancircle.net
- You should see your image in the preview!

## What If I Don't Have the Image Yet?

The current `og-image.png` in your public folder will be used as a placeholder. The site will build and deploy fine, but you'll want to replace it with your custom image later for better social sharing.

## Image Requirements

✅ **Size**: 1200 x 630 pixels (recommended)  
✅ **Format**: PNG or JPG  
✅ **File size**: Under 1 MB  
✅ **File name**: Must be exactly `og-image.png`  
✅ **Location**: `/public/og-image.png`

## Your Beautiful Image Content

Should include:
- 📝 Title: "رحلتك الشخصية مع القرآن"
- 📝 Subtitle: "منصة خالية من التشتيت للقراءة والحفظ وإتمام القرآن"
- 🎨 Background: Emerald green gradient (#059669)
- 🔘 CTA Button: "ابدأ رحلتك"

---

**Questions?** The code is ready. Just upload `og-image.png` to `/public/` folder and push to GitHub!
