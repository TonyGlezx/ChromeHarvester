import cheerio from 'cheerio';

export default function cleanHTML(htmlContent) {
    const $ = cheerio.load(htmlContent);

    // Remove script, style, link, and meta tags
    $('script, style, link, meta').remove();

    // Remove elements that typically don't contribute to main content
    $('header, nav, img, footer, aside, form, iframe, noscript, video, audio').remove();

    // Remove comments
    $('*').contents().filter(function() { 
        return this.type === 'comment'; 
    }).remove();

    // Remove elements with inline styles that hide content
    $('[style*="display: none"], [style*="display:none"]').remove();

    // Remove empty elements
    $('*').filter(function() { 
        return $(this).text().trim() === '' && $(this).children().length === 0; 
    }).remove();

    // Normalize spaces (replace multiple spaces with a single space)
    let text = $('body').text().replace(/\s\s+/g, ' ');

    // Trim leading and trailing whitespace
    text = text.trim();

    // Decode HTML entities
    text = $('<textarea/>').html(text).text();

    text = text.replace(/<style[^>]*>.*?<\/style>/g, '')  // Remove <style>...</style>
         .replace(/<[^>]+>/g, '')  // Remove remaining HTML tags
         .replace(/&[a-z]+;/gi, '');  // Remove HTML entities

    return text;
}
