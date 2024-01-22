async function copyToClipboard(data) {
    try {
      const clipboardy = await import('clipboardy');
      clipboardy.default.writeSync(data);
      console.log('✔️ ChatGPT response copied to clipboard.');
    } catch (error) {
      console.error('❌ Error copying to clipboard:', error.message);
    }
  }