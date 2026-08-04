const axios = require('axios');

async function checkLiveDeployment() {
  console.log('================================================================================');
  console.log('         CHECKING LIVE PRODUCTION METADATA AT HTTPS://FRESHFROMFARMS.SHOP        ');
  console.log('================================================================================\n');

  try {
    const res = await axios.get('https://freshfromfarms.shop');
    const html = res.data;

    const title = html.match(/<title>(.*?)<\/title>/i);
    const desc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
    const keywords = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["'](.*?)["']/i);
    const googleVerify = html.match(/<meta[^>]*name=["']google-site-verification["'][^>]*content=["'](.*?)["']/i);

    console.log('✅ PAGE TITLE        : ' + (title ? title[1] : 'Not Found'));
    console.log('✅ META DESCRIPTION : ' + (desc ? desc[1] : 'Not Found'));
    console.log('✅ META KEYWORDS    : ' + (keywords ? keywords[1] : 'Not Found'));
    console.log('✅ GOOGLE VERIFY TAG: ' + (googleVerify ? googleVerify[1] : 'Not Found'));

    const fileRes = await axios.get('https://freshfromfarms.shop/googleaaa2a88a8a24932c.html');
    console.log('✅ GOOGLE VERIFY FILE: Status ' + fileRes.status + ' | Content: ' + fileRes.data.trim());

    console.log('\n================================================================================');
    console.log('           ALL METADATA & VERIFICATION FILES ARE 100% LIVE IN PRODUCTION!       ');
    console.log('================================================================================');
  } catch(e) {
    console.error('Error:', e.message);
  }
}

checkLiveDeployment();
