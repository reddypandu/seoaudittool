const express = require('express');
const fs = require('fs');
const path = require('path');
const seoAudit = require('./seoAudit'); // You’ll implement this
const generatePDF = require('./generatePDF');

const app = express();
const port = 4000;

// Middleware to parse JSON request body
app.use(express.json());

// Serve static files like HTML, CSS, JS
app.use(express.static('public'));

// Serve generated PDFs from this directory
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// === ROUTES === //

// SEO Audit route
app.get('/audit', async (req, res) => {
    const url = req.query.url;
    try {
        const auditResults = await seoAudit(url); // This is your SEO audit function
        res.json(auditResults);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Generate PDF route
app.post('/create-report', async (req, res) => {
    const { htmlContent } = req.body;
    const filename = `audit_${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, 'pdfs', filename);

    try {
        const pdfPath = await generatePDF(htmlContent, outputPath);
        const pdfUrl = `${req.protocol}://${req.get('host')}/pdfs/${filename}`;
        res.json({ success: true, pdfUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`✅ Server is running at http://localhost:${port}`);
});
