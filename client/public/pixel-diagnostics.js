// Meta Pixel Diagnostics Tool
// Run this in browser console to check pixel setup

(function() {
  console.log('=== Meta Pixel Diagnostics ===\n');
  
  // Check if fbq is loaded
  if (typeof window.fbq === 'undefined') {
    console.error('❌ ERROR: fbq is not defined. Pixel script not loaded!');
    console.log('Possible causes:');
    console.log('1. Script blocked by ad blocker');
    console.log('2. Network error loading Facebook script');
    console.log('3. Script not included in HTML');
    return;
  }
  
  console.log('✅ fbq function exists');
  
  // Check pixel queue
  if (window.fbq.queue && window.fbq.queue.length > 0) {
    console.log(`📦 Queued events: ${window.fbq.queue.length}`);
    console.log('Events waiting to be sent:', window.fbq.queue);
  } else {
    console.log('✅ No queued events (pixel is loaded and processing)');
  }
  
  // Check if pixel is loaded
  if (window.fbq.loaded) {
    console.log('✅ Pixel script loaded successfully');
  } else {
    console.error('❌ WARNING: Pixel script not fully loaded');
  }
  
  // Check pixel version
  console.log(`📌 Pixel version: ${window.fbq.version || 'unknown'}`);
  
  // Check pixel ID by looking at the script
  const pixelScripts = document.querySelectorAll('script[src*="facebook.net/en_US/fbevents.js"]');
  console.log(`📄 Pixel scripts found: ${pixelScripts.length}`);
  
  // Look for pixel ID in scripts
  const allScripts = Array.from(document.scripts);
  const pixelInitScripts = allScripts.filter(s => s.innerHTML.includes('fbq(\'init\''));
  
  if (pixelInitScripts.length > 0) {
    console.log(`\n🔍 Pixel Init Calls Found: ${pixelInitScripts.length}`);
    pixelInitScripts.forEach((script, i) => {
      const matches = script.innerHTML.match(/fbq\('init',\s*['"](\d+)['"]/g);
      if (matches) {
        matches.forEach(match => {
          const id = match.match(/\d+/)[0];
          console.log(`   ${i + 1}. Pixel ID: ${id}`);
        });
      }
    });
  } else {
    console.warn('⚠️  No pixel init scripts found in HTML');
  }
  
  // Test event tracking
  console.log('\n📊 Testing Event Tracking...');
  
  // Intercept fbq calls
  const originalFbq = window.fbq;
  const eventLog = [];
  
  window.fbq = function() {
    const args = Array.from(arguments);
    eventLog.push({
      timestamp: new Date().toISOString(),
      type: args[0],
      event: args[1],
      data: args[2] || {}
    });
    console.log(`📤 Event sent: ${args[0]} - ${args[1]}`, args[2] || '');
    return originalFbq.apply(this, arguments);
  };
  
  // Copy properties from original fbq
  Object.keys(originalFbq).forEach(key => {
    window.fbq[key] = originalFbq[key];
  });
  
  console.log('\n✅ Event logging enabled. Events will be logged to console.');
  console.log('📝 To see all logged events, run: console.table(window.fbqEventLog)');
  
  window.fbqEventLog = eventLog;
  
  // Check for ad blockers
  console.log('\n🛡️  Ad Blocker Check...');
  const fbDomain = 'https://www.facebook.com';
  fetch(fbDomain, { mode: 'no-cors' })
    .then(() => {
      console.log('✅ Facebook domains accessible (no ad blocker detected)');
    })
    .catch(err => {
      console.error('❌ WARNING: Cannot reach Facebook domains. Ad blocker may be active!');
      console.log('This will prevent events from being sent to Meta.');
    });
  
  // Check Pixel Helper
  console.log('\n🔧 Recommendations:');
  console.log('1. Install Meta Pixel Helper Chrome extension');
  console.log('2. Check Events Manager > Test Events for real-time event data');
  console.log('3. Verify Aggregated Event Measurement (AEM) configuration');
  console.log('4. Check if Domain Verification is complete');
  console.log('5. Ensure Pixel is active (not in restricted mode)');
  
  console.log('\n=== Diagnostics Complete ===');
})();
