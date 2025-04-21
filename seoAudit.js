const puppeteer = require('puppeteer');
const path = require('path'); 
const fs = require('fs');

async function performAudit(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // Record the start time before navigating to the URL
    const startTime = Date.now();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

        // Wait for the body element to be loaded
        await page.waitForSelector('body', { timeout: 0 });
        const title = await page.title();
        const titleLen = title.length;

        // Check the title length and add the appropriate symbol
        let symbolHTML = '';
        if (titleLen >= 50 && titleLen <= 60) {
            symbolHTML = '<i class="fa fa-check" style="font-size:24px;color:green"></i>';
        } else {
            symbolHTML = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        }

        // Append the symbol to the title
        const titleWithSymbol = `${title} ${symbolHTML}`;

        // Calculate the time taken to load the webpage
        const loadTime = Date.now() - startTime;

        const businessData = await page.evaluate(() => {
            const businessName = document.querySelector('selector-for-business-name')?.innerText;
            const address = document.querySelector('selector-for-address')?.innerText;
            const phone = document.querySelector('selector-for-phone')?.innerText;
            const site = document.querySelector('selector-for-website')?.href;
            const rating = document.querySelector('selector-for-rating')?.innerText;
            const reviewsCount = document.querySelector('selector-for-reviews-count')?.innerText;

            return {
                businessName,
                address,
                phone,
                site,
                rating,
                reviewsCount
            };
        });
        console.log(businessData);








        const h1Tags = await page.evaluate(() => {
            const h1Elements = document.querySelectorAll('h1');
            const h1Content = [];
            h1Elements.forEach(h1 => {
                h1Content.push(h1.textContent);
            });
            return {
                count: h1Elements.length,
                content: h1Content
            };
        });

        let wordCount;
        let wordCountWithSymbol;
        try {
            const textContent = await page.evaluate(() => {
                return document.body.innerText;
            });

            // Count the words
            wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

            // Check the word count and add the appropriate symbol
            let wordSymbolHTML = '';
            if (wordCount >= 300) { // Adjust this threshold as needed
                wordSymbolHTML = '<i class="fa fa-check" style="font-size:24px;color:green"></i>';
            } else {
                wordSymbolHTML = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
            }

            // Append the symbol to the word count
            wordCountWithSymbol = `Word Count: ${wordCount} ${wordSymbolHTML}`;
        } catch (error) {
            wordCountWithSymbol = 'Word Count: <i class="fa fa-close" style="font-size:24px;color:red"></i>';
        }

        let metaDescription = '';
        let metaDescriptionLength = 0;
        try {
            metaDescription = await page.$eval('meta[name="description"]', element => element ? element.content : '');

            // Check the meta description length and add the appropriate symbol
            let metaSymbolHTML = '';
            metaDescriptionLength = metaDescription.length;
            if (metaDescriptionLength >= 120 && metaDescriptionLength <= 160) {
                metaSymbolHTML = '<i class="fa fa-check" style="font-size:24px;color:green"></i>';
            } else {
                metaSymbolHTML = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
            }

            // Append the symbol to the meta description
            metaDescription += metaSymbolHTML;
        } catch (error) {
            metaDescription = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        }

        let canonical;
        try {
            canonical = await page.$eval('link[rel="canonical"]', element => element.href);
            // If canonical link is found, add the check icon with green color
            canonical += ' <i class="fa fa-check" style="font-size:24px;color:green"></i>';
        } catch (error) {
            canonical = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        }

        let googleAnalyticsStatus;
        try {
            googleAnalyticsStatus = await page.evaluate(() => {
                function checkGoogleAnalytics() {
                    const scripts = document.getElementsByTagName('script');
                    const gaPatterns = [
                        /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=UA-\d+-\d+/,
                        /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+/,
                        /https:\/\/www\.google-analytics\.com\/analytics\.js/,
                        /https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-[A-Z0-9]+/,
                        /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=AW-[A-Z0-9]+/
                    ];

                    for (let i = 0; i < scripts.length; i++) {
                        const src = scripts[i].src;
                        for (let j = 0; j < gaPatterns.length; j++) {
                            if (gaPatterns[j].test(src)) {
                                return true;
                            }
                        }
                    }
                    return false;
                }

                return checkGoogleAnalytics();
            });

            if (googleAnalyticsStatus) {
                googleAnalyticsStatus = '<i class="fa fa-check" style="font-size:24px;color:green"></i>';
            } else {
                googleAnalyticsStatus = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
            }

        } catch (error) {
            googleAnalyticsStatus = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        }

        const imageCount = await page.evaluate(() => {
            return document.querySelectorAll('img').length;
        });

        let imageAudits;
        try {
            imageAudits = await page.evaluate(() => {
                const images = document.querySelectorAll('img');
                const results = [];

                images.forEach(image => {
                    const alt = image.getAttribute('alt');
                    if (!alt || alt.trim() === '') {
                        results.push({
                            src: image.getAttribute('src'),
                            alt: alt || '[MISSING]',
                            error: 'Alt text is missing or empty',
                            symbol: '<i class="fa fa-close" style="font-size:24px;color:red"></i>'
                        });
                    } else {
                        results.push({
                            src: image.getAttribute('src'),
                            alt: alt,
                            error: null,
                            symbol: '<i class="fa fa-check" style="font-size:24px;color:green"></i>'
                        });
                    }
                });

                return results;
            });
        } catch (error) {
            console.error('Error extracting image audits:', error);
        }

        // Take screenshots of the home page in both desktop and mobile views
        const screenshotDir = path.resolve('public', 'screenshots');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        // Desktop screenshot
        // Revert to desktop view for further analysis if needed
        await page.setViewport({ width: 1920, height: 1080 });
        const desktopScreenshotPath = path.resolve(screenshotDir, 'desktop_screenshot.png');
        await page.screenshot({ path: desktopScreenshotPath });
        const desktopRelativePath = `screenshots/desktop_screenshot.png`;

        // Mobile screenshot
        await page.setViewport({ width: 375, height: 667, isMobile: true });
        const mobileScreenshotPath = path.resolve(screenshotDir, 'mobile_screenshot.png');
        await page.screenshot({ path: mobileScreenshotPath });
        const mobileRelativePath = `screenshots/mobile_screenshot.png`;

        //robotsfile
        let robotsTxtUrl = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        try {
            const robotsTxtResponse = await page.goto(`${url}/robots.txt`);
            if (robotsTxtResponse && robotsTxtResponse.ok()) {
                robotsTxtUrl = `${url}/robots.txt  <i class="fa fa-check" style="font-size:24px;color:green"></i>`;
            }
        } catch (error) {
            console.error('Error navigating to robots.txt:', error);
        }
//sitemap.xml
        let sitemapUrl = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        try {
            const sitemapResponse = await page.goto(`${url}/sitemap.xml`);
            if (sitemapResponse && sitemapResponse.ok()) {
                sitemapUrl = `${url}/sitemap.xml  <i class="fa fa-check" style="font-size:24px;color:green"></i>`;
            }
        } catch (error) {
            console.error('Error navigating to sitemap.xml:', error);
        }



// iFrames
const iframes = await page.$$('iframe');
const iFramesStatus = iframes.length > 0
  ? `Found ${iframes.length} iFrame(s) on your page. <i class="fa fa-close" style="font-size:24px;color:red"></i>`
  : 'There are no iFrames detected on your page. <i class="fa fa-check" style="font-size:24px;color:green"></i>';

// Favicon
const favicon = await page.$('link[rel~="icon"]');
const faviconStatus = favicon
  ? 'Your page has specified a favicon. <i class="fa fa-check" style="font-size:24px;color:green"></i>'
  : 'No favicon detected on your page. <i class="fa fa-close" style="font-size:24px;color:red"></i>';

// SSL
const urlObj = new URL(url);
const sslStatus = urlObj.protocol === 'https:'
  ? 'Your website has SSL enabled. <i class="fa fa-check" style="font-size:24px;color:green"></i>'
  : 'SSL is not enabled on your website. <i class="fa fa-close" style="font-size:24px;color:red"></i>';


// SCORING SYSTEM
let score = 0;
let total = 11; // Total number of checks

// Check if each field includes the green check icon
if (titleWithSymbol.includes('fa-check')) score++;
if (wordCountWithSymbol.includes('fa-check')) score++;
if (metaDescription.includes('fa-check')) score++;
if (canonical.includes('fa-check')) score++;
if (googleAnalyticsStatus.includes('fa-check')) score++;
if (robotsTxtUrl.includes('fa-check')) score++;
if (sitemapUrl.includes('fa-check')) score++;
if (sslStatus.includes('fa-check')) score++;
if (faviconStatus.includes('fa-check')) score++;
if (iFramesStatus.includes('fa-check')) score++;

// For images, if all have proper alt tags, full points
const imageScore = imageCount === imageAudits.length ? 1 : 0;
score += imageScore;

// Calculate percentage
const gradePercent = (score / total) * 100;

// Determine grade
let grade;
if (gradePercent >= 90) grade = 'A';
else if (gradePercent >= 80) grade = 'B+';
else if (gradePercent >= 70) grade = 'B';
else if (gradePercent >= 60) grade = 'B-';
else if (gradePercent >= 50) grade = 'C';
else grade = 'D';
return {
 
        url: url,
        title: titleWithSymbol,
        titleLen: titleLen,
        loadtime: loadTime,
        h1Content: h1Tags.content,
        wordCountWithSymbol: wordCountWithSymbol,
        h1Count: h1Tags.count,
        metaDescription: metaDescription,
        metaDescriptionLength: metaDescriptionLength,
        imagesC: imageCount,
        imageA: imageAudits.length,
        mobileRelativePath: mobileRelativePath,
        desktopRelativePath: desktopRelativePath,
        robotsTxtExists: robotsTxtUrl,
        canonical: canonical,
        sitemapUrl: sitemapUrl,
        googleAnalyticsStatus: googleAnalyticsStatus,
        iframesDetected: iFramesStatus,
        faviconStatus: faviconStatus,
        sslEnabled: sslStatus,
        auditGrade: grade,
        scoreBreakdown: `${score}/${total} checks passed`

    
};


    } catch (error) {
        console.error('Error performing audit:', error);
        console.error('Error:', error);
        // Return -1 to indicate error
        await browser.close();
        throw error; // Rethrow the error to be caught in the calling code

    } finally {
        await browser.close();
    }
}
module.exports = performAudit;

