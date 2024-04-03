document.getElementById('printButton').addEventListener('click', function() {
    // Create a new window/tab to display the audit results
    var printWindow = window.open('', '_blank');

    // Write the audit results HTML content to the new window/tab
    printWindow.document.write(`
        <html>
        <head>
            <title>Audit Results</title>
        </head>
        <body>
            <div id="auditResults">
                
                ${document.getElementById('auditResults').innerHTML}
            </div>
            <script>
                // After the content is written, trigger the print dialog in the new window/tab
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);

    // Close the new window/tab after printing
    printWindow.onafterprint = function() {
        printWindow.close();
    };
});



