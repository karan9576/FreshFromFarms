const axios = require('axios');

async function testVercelUrls() {
  console.log('=== TESTING VERCEL DOMAIN MAPPINGS ===\n');

  try {
    const redRes = await axios.get('https://fresh-from-farms-red.vercel.app');
    console.log('1. https://fresh-from-farms-red.vercel.app');
    console.log('   - Contains "Coming Soon": ' + redRes.data.includes('Coming Soon'));

    const shopRes = await axios.get('https://www.freshfromfarms.shop');
    console.log('\n2. https://www.freshfromfarms.shop');
    console.log('   - Contains "Coming Soon": ' + shopRes.data.includes('Coming Soon'));
  } catch(e) {
    console.error('Error:', e.message);
  }
}

testVercelUrls();
