// seoAudit.js

const puppeteer = require('puppeteer');
const path = require('path'); 

async function performAudit(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
      // Record the start time before navigating to the URL
      const startTime = Date.now();
    try {
        await page.goto(url, { waitUntil: 'networkidle2',timeout: 0  });
 
   
    
        const title = await page.title();
        const titleLen = title.length;
        
        // Check the title length and add the appropriate symbol
        let symbolHTML = '';
        if (titleLen >= 10 && titleLen <= 70) {
            symbolHTML = '<i class="fa fa-check" style="font-size:24px;color:green"></i>';
        } else {
            symbolHTML = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        }
        
        // Append the symbol to the title
        const titleWithSymbol = `${title} ${symbolHTML}`;
        

          // Calculate the time taken to load the webpage
    const loadTime = Date.now() - startTime;
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



        // Get the meta description
        // const metaDescription = await page.$eval('meta[name="description"]', element => element.content);
  
        let metaDescription;
        try {
            metaDescription = await page.$eval('meta[name="description"]', element => element ? element.content : '');
            
            // Check the meta description length and add the appropriate symbol
            let metaSymbolHTML = '';
            if (metaDescription.length >= 70 && metaDescription.length <= 160) {
                metaSymbolHTML = '<i class="fa fa-check" style="font-size:24px;color:green"></i>';
            } else {
                metaSymbolHTML = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
            }
        
            // Append the symbol to the meta description
            metaDescription += metaSymbolHTML;
        } catch (error) {
            // metaDescription = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        }
        



        let canonical;
        try {
            // canonical = await page.$eval('link[rel="canonical"]',element => element.href);
            canonical = await page.$eval('link[rel="canonical"]', element => element.href);
            // If canonical link is found, add the check icon with green color
            canonical += ' <i class="fa fa-check" style="font-size:24px;color:green"></i>';
        
        } catch (error) {
       
            canonical = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        }


        let googleAnalyticsStatus;
        try {
            // Evaluate the Google Analytics status on the page
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
        
            // If Google Analytics is found, add the check icon with green color
            if (googleAnalyticsStatus) {
                googleAnalyticsStatus = '<i class="fa fa-check" style="font-size:24px;color:green"></i>';
            } else {
                googleAnalyticsStatus = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
            }
        
        } catch (error) {
            googleAnalyticsStatus = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        }
        
    
        
        

        // Evaluate the function in the context of the page to count images
        const imageCount = await page.evaluate(() => {
            return document.querySelectorAll('img').length;
        });

        let robotsTxtUrl='<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        try {
            const robotsTxtResponse = await page.goto(`${url}/robots.txt`);
            if (robotsTxtResponse && robotsTxtResponse.ok()) {
                robotsTxtUrl = `${url}robots.txt  <i class="fa fa-check" style="font-size:24px;color:green"></i>`;

            }

        } catch (error) {
            // Handle errors when ;navigating to robots.txt
            console.error('Error navigating to robots.txt:', error);
        }
        let sitemapUrl='<i class="fa fa-close" style="font-size:24px;color:red"></i>';
        try {
            const sitemapResponse = await page.goto(`${url}/sitemap.xml`);
            if (sitemapResponse && sitemapResponse.ok()) {
                sitemapUrl = `${url}sitemap.xml  <i class="fa fa-check" style="font-size:24px;color:green"></i>`;

            }

        } catch (error) {
            // Handle errors when ;navigating to robots.txt
            console.error('Error navigating to sitemap.xml:', error);
        }
      

        



        // const robotsTxtExists = robotsTxtResponse && robotsTxtResponse.ok();


      // Evaluate the function in the context of the page to audit images
      const imageAudits = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        const results = [];

        images.forEach(image => {
            const alt = image.getAttribute('alt');
            if (!alt || alt.trim() === '') {
                results.push({
                    src: image.getAttribute('src'),
                    alt: alt || '[MISSING]',
                    error: 'Alt text is missing or empty'
                });
            }
        });

        return results;
    });


// Take a screenshot
// Resolve the absolute file path for saving the screenshot
const screenshotPath = path.resolve('screenshot.png');
const filename = path.basename(screenshotPath);

const relativePath =  filename;
await page.screenshot({ path: screenshotPath });
       

   
        return {
            url:url,
            title: titleWithSymbol,
            titleLen:titleLen,
            loadtime:loadTime,
            h1Content:h1Tags.content,
            h1Count:h1Tags.count,
            metaDescription: metaDescription,
            metaDescriptionLength: metaDescription.length,
            imagesC:imageCount,
            imageA:imageAudits.length,
            screenshot: relativePath,
            robotsTxtExists:robotsTxtUrl,
            canonical:canonical,
            sitemapUrl:sitemapUrl,
            googleAnalyticsStatus:googleAnalyticsStatus
        };

        
    } catch (error) {
        console.error('Error performing audit:', error);
        console.error('Error:', error);
       // Return -1 to indicate error
        await browser.close();
        throw error; // Rethrow the error to be caught in the calling code
    
    }finally {
        await browser.close();
    }
}

module.exports = performAudit;
