#**ChromeHarvester 🌐🔍**

Welcome to ChromeHarvester - your sleek and powerful tool for mining the depths of open Chrome tabs! Dive into a sea of data, effortlessly extracting and shuttling tab URLs and source codes to your desired destination, be it a REST endpoint or a cozy SQL database.

# Features **✨

📄 **Data Extraction:** Get the URLs and full HTML source from all your open Chrome tabs.
🌐 **Endpoint Integration:** Effortlessly post data to your specified REST API endpoint.
💾 **Database Storage:** Seamlessly save data to your MySQL database.
⚙️ **Customizable:** Flexible configurations to fit your workflow.

# **Getting Started **🏁

## **Prerequisites**
Node.js
MySQL database (optional, for database storage mode)

## **Installation**
````
git clone https://github.com/TonyGlezx/ChromeHarvester.git
cd ChromeHarvester
npm install -g .
````
## **Usage 🔧**

### **Starting Chrome in Debugging Mode**

To use ChromeHarvester, start Google Chrome with the remote debugging option enabled:

````
google-chrome --remote-debugging-port=9222
````

### **Unleash ChromeHarvester with:**

#### **Endpoint Mode:**
````
scrape-tabs -e [endpoint]
````
Replace **[endpoint]** with your target URL.

#### **Database Mode:**


````
scrape-tabs --dbconfig [path to db config file]
````
Point to your database configuration JSON file.
### **Command-Line Options**

**--version:** Uncover the current version.
**-e, --endpoint:** Designate your endpoint for data dispatch.
**--dbconfig:** Specify your database config file path.
**--help:** Need assistance? Just ask!

### **Configuration 📝**

For database adventures, format your dbconfig.json like so:

```
{
    "host": "localhost",
    "user": "your_username",
    "password": "your_password",
    "database": "your_database"
}
```

# Contributing 🤝****

Dive into open-source! Suggestions, improvements, and enhancements are warmly welcomed. Feel free to fork, modify, and send those pull requests, or drop an issue if you spot something amiss!

