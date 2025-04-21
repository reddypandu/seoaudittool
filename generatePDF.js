const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf'); // Make sure you installed this using `npm install html-pdf`

function generatePDF(htmlContent, outputPath) {
    return new Promise((resolve, reject) => {
        const options = { format: 'A4' };
        pdf.create(htmlContent, options).toFile(outputPath, (err, res) => {
            if (err) return reject(err);
            resolve(res.filename); // resolves the file path
        });
    });
}

module.exports = generatePDF;