// seoAudit.js

const puppeteer = require('puppeteer');
const path = require('path'); 

async function performAudit(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
      // Record the start time before navigating to the URL
      const startTime = Date.now();
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
 
     
    
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
        const metaDescription = await page.$eval('meta[name="description"]', element => element.content);
        // Evaluate the function in the context of the page to count images
        const imageCount = await page.evaluate(() => {
            return document.querySelectorAll('img').length;
        });
       



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

        // Resolve the absolute file path for saving the screenshot
        const screenshotPath = path.resolve('screenshot.png');
// Extract the filename from the absolute path
const filename = path.basename(screenshotPath);

// Construct the relative path
const relativePath =  filename;

// Take a screenshot
await page.screenshot({ path: screenshotPath });
       

   
        return {
            title: title,
            loadtime:loadTime,
            h1Content:h1Tags.content,
            h1Count:h1Tags.count,
            metaDescription: metaDescription,
            imagesC:imageCount,
            imageA:imageAudits.length,
            screenshot: relativePath
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
