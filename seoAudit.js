// seoAudit.js

const puppeteer = require('puppeteer');
const path = require('path'); 

async function performAudit(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
      // Record the start time before navigating to the URL
      const startTime = Date.now();
    try {
        await page.goto(url, { waitUntil: 'networkidle2',timeout: 60000  });
 
   
    
        const title = await page.title();
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
        metaDescription+='<i class="fa fa-check" style="font-size:24px;color:green"></i>';
       
        } catch (error) {
       
            metaDescription = '<i class="fa fa-close" style="font-size:24px;color:red"></i>';
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
            title: title,
            loadtime:loadTime,
            h1Content:h1Tags.content,
            h1Count:h1Tags.count,
            metaDescription: metaDescription,
            imagesC:imageCount,
            imageA:imageAudits.length,
            screenshot: relativePath,
            robotsTxtExists:robotsTxtUrl,
            canonical:canonical,
            sitemapUrl:sitemapUrl
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
