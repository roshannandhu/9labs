# Nine Labs Solutions — SEO Sitemap & Keywords Guide

This guide details the sitemap setup for **Google Search Console (GSC)** and provides the **Master SEO Keyword Strategy** tailored to Nine Labs Solutions' 9 activities in Dubai, UAE.

---

## 1. Sitemap for Google Search Console

### 1.1 How the Sitemap Works

The project provides three compatible ways the sitemap is delivered:

1. **Next.js Dynamic & Static Route (`src/app/sitemap.ts`)**:
   - Next.js automatically maps this to `https://<your-domain>/sitemap.xml`.
   - When deploying with static export (`output: "export"`), Next.js builds `out/sitemap.xml` automatically.
   - It sets `priority: 1.0`, `changeFrequency: "weekly"`, dynamic `lastModified: new Date()`, and includes OpenGraph image references.

2. **Standalone XML File (`sitemap.xml` in project root)**:
   - Formatted using standard Sitemaps Protocol 0.9 with Google Image extensions.
   - Can be uploaded directly to any web root, FTP, or static storage (S3, Cloudflare Pages, Netlify) if needed.

3. **Robots.txt Directive (`src/app/robots.ts`)**:
   - Points search engine crawlers directly to `https://<your-domain>/sitemap.xml`.
   - Automatically respects `NEXT_PUBLIC_NOINDEX=1` during staging/preview runs to avoid premature indexing.

---

### 1.2 Step-by-Step: Submitting to Google Search Console

1. **Configure Your Live Domain**:
   - In your deployment environment (e.g. Cloudflare Pages, Vercel, or `.env.local`), set:
     ```bash
     NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
     ```
   - If using `sitemap.xml` directly, update the `<loc>` URL inside [sitemap.xml](file:///C:/Users/midhu/OneDrive/Desktop/nj/9labs/sitemap.xml) with your live domain.

2. **Open Google Search Console**:
   - Go to [Google Search Console](https://search.google.com/search-console).
   - If not already verified, add your domain as a **Domain Property** (DNS verification via Cloudflare/host) or **URL prefix** (`https://your-domain.com`).

3. **Submit the Sitemap**:
   - In the left sidebar, click **Indexing** → **Sitemaps**.
   - Under **Add a new sitemap**, type:
     ```text
     sitemap.xml
     ```
   - Click **Submit**.

4. **Verify Submission**:
   - The status will change to **Success** (or "Processing" initially).
   - Googlebot will periodically crawl `sitemap.xml` and discover your homepage, structured data, and images.

---

## 2. Master SEO Keyword Strategy

The keyword strategy is built around high-intent B2B decision makers, startup founders, and enterprise marketing directors in **Dubai, Dubai South, and the wider UAE/GCC**.

### Cluster 1: Core Brand & Agency Keywords
| Target Keyword | Search Intent | Target Placement |
|---|---|---|
| 9labs | Branded | Meta Keywords, Title, Schema |
| 9 labs | Branded | Meta Keywords, Content |
| 9labs Dubai | Branded / Local | Meta Keywords, Schema |
| 9labs solutions | Branded | Meta Keywords, Schema |
| Nine Labs Solutions | Branded | Title, H1, Footer, Schema |
| Nine Labs Dubai | Branded / Local | Meta Keywords, Nav, About |
| marketing agency Dubai | Commercial | Meta Title, Hero Headline, Schema |
| marketing agency Dubai South | Local Commercial | Hero Eyebrow, LocalBusiness Schema |
| technology consultancy Dubai | Commercial | Hero Subtitle, Services |
| events management company Dubai | Commercial | Services Section, Title |

---

### Cluster 2: Digital & Social Media Marketing (Activity 01)
*Focus: Organic growth, community management, short-form video reels, and paid social strategy.*

- **Primary Keywords**:
  - `digital marketing agency Dubai`
  - `social media marketing Dubai`
  - `social media agency UAE`
  - `social media management Dubai South`
- **Secondary & Long-Tail**:
  - `B2B social media strategy Dubai`
  - `Instagram marketing agency Dubai`
  - `TikTok marketing company UAE`
  - `content calendar management Dubai`
  - `influencer marketing campaigns Dubai`
  - `community management agency UAE`

---

### Cluster 3: Advertising & Performance Marketing (Activity 02)
*Focus: Google Ads, Meta Ads, Paid Search, Retargeting, and Outdoor/OOH.*

- **Primary Keywords**:
  - `advertising agency Dubai`
  - `digital advertising company UAE`
  - `Google Ads agency Dubai`
  - `PPC management Dubai`
- **Secondary & Long-Tail**:
  - `pay per click advertising UAE`
  - `paid social media advertising Dubai`
  - `retargeting campaigns agency UAE`
  - `LinkedIn B2B lead generation Dubai`
  - `outdoor advertising Dubai billboard marketing`
  - `performance marketing agency Dubai South`

---

### Cluster 4: Digital Content & Creative Production (Activity 03)
*Focus: Brand storytelling, commercial video production, and motion graphics.*

- **Primary Keywords**:
  - `creative agency Dubai`
  - `corporate video production Dubai`
  - `commercial video production UAE`
  - `motion graphics studio Dubai`
- **Secondary & Long-Tail**:
  - `brand storytelling agency Dubai`
  - `social media video production UAE`
  - `brand identity design agency Dubai`
  - `corporate copywriting services UAE`
  - `product promo video Dubai`

---

### Cluster 5: Photography & Events Filming (Activity 04)
*Focus: High-end commercial photography, exhibition filming, drone videography, and aftermovies.*

- **Primary Keywords**:
  - `commercial photography Dubai`
  - `corporate event filming Dubai`
  - `event videographer UAE`
  - `drone videography Dubai`
- **Secondary & Long-Tail**:
  - `product photography studio Dubai`
  - `corporate headshots Dubai South`
  - `aftermovie production Dubai`
  - `exhibition and conference videography UAE`
  - `commercial shoot production Dubai`

---

### Cluster 6: Events & Trade Shows (Activity 05)
*Focus: Corporate conferences, exhibition stands (DWTC, Expo City Dubai), launches, and galas.*

- **Primary Keywords**:
  - `event management company Dubai`
  - `trade show organizers Dubai`
  - `corporate conference planners UAE`
  - `exhibition stand design and management Dubai`
- **Secondary & Long-Tail**:
  - `product launch event agency Dubai`
  - `DWTC exhibition support agency`
  - `corporate gala dinner planners Dubai`
  - `event staffing agency Dubai`
  - `business events Dubai South`

---

### Cluster 7: PR & Communications (Activity 06)
*Focus: Media relations, press releases, thought leadership, and reputation management.*

- **Primary Keywords**:
  - `PR agency Dubai`
  - `public relations company UAE`
  - `corporate communications agency Dubai`
  - `press release distribution UAE`
- **Secondary & Long-Tail**:
  - `media relations agency GCC`
  - `crisis communications consultancy Dubai`
  - `thought leadership PR Dubai`
  - `product launch PR UAE`
  - `executive personal branding Dubai`

---

### Cluster 8: Marketing & Strategy Consultancy (Activity 07)
*Focus: Market research, go-to-market strategy, brand positioning, and fractional CMO.*

- **Primary Keywords**:
  - `marketing consultancy Dubai`
  - `business strategy consultancy UAE`
  - `go-to-market strategy Dubai`
  - `brand positioning consultancy UAE`
- **Secondary & Long-Tail**:
  - `market research company Dubai`
  - `fractional CMO services Dubai`
  - `marketing audit company UAE`
  - `B2B growth strategy consultancy GCC`
  - `startup launch consultancy Dubai South`

---

### Cluster 9: AI Consultancy & Business Automation (Activity 08)
*Focus: AI roadmaps, workflow automation, AI assistants, and enterprise adoption.*

- **Primary Keywords**:
  - `AI consultancy Dubai`
  - `AI business solutions UAE`
  - `artificial intelligence consulting Dubai`
  - `business automation consultancy Dubai`
- **Secondary & Long-Tail**:
  - `AI workflow automation UAE`
  - `AI chatbot integration Dubai`
  - `enterprise AI strategy UAE`
  - `corporate AI training Dubai`
  - `AI marketing tools implementation Dubai`

---

### Cluster 10: IT Consultancy & Technology Infrastructure (Activity 09)
*Focus: Systems planning, cloud infrastructure, cybersecurity, web applications, and IT support.*

- **Primary Keywords**:
  - `IT consultancy UAE`
  - `IT consulting services Dubai`
  - `cloud solutions consultancy Dubai`
  - `cybersecurity consulting UAE`
- **Secondary & Long-Tail**:
  - `business IT support Dubai South`
  - `custom web application development Dubai`
  - `ERP CRM implementation Dubai`
  - `network infrastructure services UAE`
  - `enterprise IT audit Dubai`

---

## 3. Implemented Site Code Updates

1. **[src/app/sitemap.ts](file:///C:/Users/midhu/OneDrive/Desktop/nj/9labs/src/app/sitemap.ts)**:
   - Configured dynamic date, `weekly` change frequency, `1.0` priority, and image indexing metadata.
2. **[sitemap.xml](file:///C:/Users/midhu/OneDrive/Desktop/nj/9labs/sitemap.xml)**:
   - Standalone XML file generated for direct search engine upload or verification.
3. **[src/app/layout.tsx](file:///C:/Users/midhu/OneDrive/Desktop/nj/9labs/src/app/layout.tsx)**:
   - Keywords array updated with over 35 high-value targeted terms.
   - Added author, creator, publisher, category, and Dubai geo-coordinates (`AE-DU`, `24.89, 55.16`).
4. **[src/lib/seo/jsonld.ts](file:///C:/Users/midhu/OneDrive/Desktop/nj/9labs/src/lib/seo/jsonld.ts)**:
   - Enhanced Schema.org `Organization`, `ProfessionalService`, and `OfferCatalog` with comprehensive `knowsAbout`, `keywords`, and `contactPoint` metadata.
5. **[.env.example](file:///C:/Users/midhu/OneDrive/Desktop/nj/9labs/.env.example)**:
   - Template for configuring the live domain URL for sitemaps, canonical tags, and OpenGraph.
