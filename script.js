
// 1. DECODING TITLE ANIMATION

function runDecodeEffect(element, targetText, hashLength, duration = 1800) {
  if (!element) return;
  const hexChars = '0123456789abcdef';
  const len = hashLength || targetText.length;

  let currentArr = Array.from({ length: len }, () => 
    hexChars[Math.floor(Math.random() * hexChars.length)]
  );
  
  element.innerText = currentArr.join('');
  const totalSteps = targetText.length;
  const stepInterval = duration / totalSteps;
  let revealedCount = 0;

  const noiseInterval = setInterval(() => {
    for (let i = revealedCount; i < len; i++) {
      currentArr[i] = hexChars[Math.floor(Math.random() * hexChars.length)];
    }
    element.innerText = currentArr.join('');
  }, 40);

  const revealInterval = setInterval(() => {
    if (revealedCount < totalSteps) {
      currentArr[revealedCount] = targetText[revealedCount];
      revealedCount++;
    } else {
      currentArr = currentArr.slice(0, targetText.length);
      element.innerText = currentArr.join('');
      clearInterval(noiseInterval);
      clearInterval(revealInterval);
    }
  }, stepInterval);
}


// 2. PAGE 2: FLIP CARDS CONTROLLER

function setupFlipCards() {
  const cards = document.querySelectorAll('.flip-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });
}


// 3. PAGE 3: COINGECKO LIVE PRICE FETCHING (8 CRYPTOS)

async function fetchCryptoPrices() {
  const container = document.getElementById('price-cards-container');
  const statusEl = document.getElementById('api-status');
  if (!container) return;

  statusEl.innerText = 'Fetching latest prices...';

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,arbitrum,solana,polygon-ecosystem-token,cardano,avalanche-2,chainlink&vs_currencies=usd&include_24hr_change=true'
    );
    
    if (!response.ok) throw new Error('Network response failed');
    
    const data = await response.json();
    statusEl.innerText = `Last updated: ${new Date().toLocaleTimeString()}`;

    // Array of 8 cryptocurrencies
    const coins = [
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
      { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
      { id: 'solana', name: 'Solana', symbol: 'SOL' },
      { id: 'polygon-ecosystem-token', name: 'Polygon', symbol: 'POL' },
      { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
      { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
      { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' }
    ];

    container.innerHTML = coins.map(coin => {
      const coinData = data[coin.id];
      if (!coinData) return '';
      
      const price = coinData.usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      const change = coinData.usd_24h_change || 0;
      const isPositive = change >= 0;
      const arrow = isPositive ? '▲' : '▼';
      const changeClass = isPositive ? 'up' : 'down';

      return `
        <div class="price-card">
          <div class="coin-name">${coin.name} (${coin.symbol})</div>
          <div class="coin-price">${price}</div>
          <div class="price-change ${changeClass}">
            ${arrow} ${Math.abs(change).toFixed(2)}% (24h)
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error fetching prices:', error);
    statusEl.innerText = 'Failed to load prices. Please try again.';
  }
}


// 4. PAGE 4: SHA-256 BLOCK CHAIN SIMULATOR (6 BLOCKS)

async function calculateSHA256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

async function updateChainUI() {
  const b1DataInput = document.getElementById('b1-data');
  if (!b1DataInput) return; // Exit if not on simulator page

  let previousHash = GENESIS_PREV_HASH;
  let chainIsBroken = false;

  // Iterate sequentially across all 6 blocks
  for (let i = 1; i <= 6; i++) {
    const nonce = document.getElementById(`b${i}-nonce`).value;
    const data = document.getElementById(`b${i}-data`).value;
    
    if (i > 1) {
      document.getElementById(`b${i}-prev`).value = previousHash;
    }

    const raw = `${i}${nonce}${data}${previousHash}`;
    const currentHash = await calculateSHA256(raw);
    document.getElementById(`b${i}-hash`).value = currentHash;

    const hasValidPrefix = currentHash.startsWith('00');
    const isValid = hasValidPrefix && !chainIsBroken;

    const card = document.getElementById(`b${i}-card`);
    const status = document.getElementById(`b${i}-status`);
    card.className = `block-card ${isValid ? 'valid' : 'invalid'}`;
    status.innerText = isValid ? 'Block Valid' : 'Block Invalid';

    if (!isValid) {
      chainIsBroken = true;
    }

    previousHash = currentHash;
  }
}

async function mineBlock(blockNumber) {
  const nonceInput = document.getElementById(`b${blockNumber}-nonce`);
  let nonce = 0;
  let hash = '';
  
  const data = document.getElementById(`b${blockNumber}-data`).value;
  const prevHash = blockNumber === 1 
    ? GENESIS_PREV_HASH 
    : document.getElementById(`b${blockNumber}-prev`).value;

  while (true) {
    const raw = `${blockNumber}${nonce}${data}${prevHash}`;
    hash = await calculateSHA256(raw);
    if (hash.startsWith('00')) break;
    nonce++;
    if (nonce > 100000) break;
  }

  nonceInput.value = nonce;
  updateChainUI();
}


// INITIALIZATION

document.addEventListener('DOMContentLoaded', () => {
  // Hero decoding title
  const heroHeading = document.getElementById('hero-decoding-heading');
  if (heroHeading) {
    const targetText = "Web3 & Blockchain";
    runDecodeEffect(heroHeading, targetText, targetText.length, 1800);
  }

  // Concepts flip cards
  setupFlipCards();

  // Prices auto-fetch
  if (document.getElementById('price-cards-container')) {
    fetchCryptoPrices();
  }

  // Block Simulator initialization
  if (document.getElementById('b1-data')) {
    updateChainUI();
  }
});