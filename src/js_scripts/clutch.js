function testir() {
    const providers = document.querySelectorAll("li.provider.provider-row");
    let csvContent = "data:text/csv;charset=utf-8,"
    let counter = 0;
    providers.forEach(function(item, index) {
        
        // Corrected the selector: added a missing dot for class selection
        const profile_link = item.querySelector(".provider-detail .directory_profile");
        console.log(item);
        
        // Check if profile_link is found
        if (profile_link) {
            counter += 1;
            const profile_href = profile_link.getAttribute("href");
            console.log(profile_href);
    
            // Add the href to the CSV content, and a newline character
            csvContent += profile_href + "\r\n";
        }
    });
    return counter;

}

testir();

//window.location.toString()

//window.location.reload();


    // Your actions go here after a 5-second wait
//alert("hello");





/*let csvContent = "data:text/csv;charset=utf-8,";

providers.forEach(function(item, index) {
    // Corrected the selector: added a missing dot for class selection
    const profile_link = item.querySelector(".provider-detail.directory_profile");
    alert("about to check profile link");
    // Check if profile_link is found
    if (profile_link) {
        const profile_href = profile_link.getAttribute("href");
        console.log(profile_href);

        // Add the href to the CSV content, and a newline character
        csvContent += profile_href + "\r\n";
    }
});

// Create a function to download the CSV
function downloadCSV(csv, filename) {
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Call the download function with your CSV content and a filename
//downloadCSV(csvContent, "profile_links.csv");
*/