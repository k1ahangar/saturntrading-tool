const SYMBOLS = {
    BTC: "BTCUSDT",
    ETH: "ETHUSDT",
    TRX: "TRXUSDT",
    BNB: "BNBUSDT",
    SOL: "SOLUSDT"
};

const INTERVALS = ["15m"];
const INDICATORS = ["RSI", "EMA10", "SMA10", "CCI", "ADX", "MACD", "STOCH", "MOM", "WPR", "VWMA", "BBP", "FOSC", "ICHIMOKU"];
let historicalData = {};

async function fetchPrice(symbol) {
    try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${SYMBOLS[symbol]}`);
        const data = await response.json();
        document.getElementById(`current-price-${symbol}`).innerHTML = `current:<br>${parseFloat(data.price).toFixed(2)}$`;
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
    }
}

async function fetchHistoricalData(symbol, interval) {
    try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${SYMBOLS[symbol]}&interval=${interval}&limit=100`);
        const data = await response.json();
        return data.map(candle => ({ close: parseFloat(candle[4]) }));
    } catch (error) {
        console.error(`Error fetching historical data for ${symbol} (${interval}):`, error);
        return [];
    }
}

function calculateIndicators(data) {
    let votes = { buy: 0, sell: 0 };
    INDICATORS.forEach(() => {
        let signal = Math.random() > 0.5 ? "Buy" : "Sell";
        votes[signal.toLowerCase()]++;
    });
    return votes;
}

function determinePower(votes) {
    const totalVotes = votes.buy + votes.sell;
    const buyRatio = votes.buy / totalVotes;
    if (buyRatio > 0.66) return "High chance";
    if (buyRatio > 0.33) return "Medium chance";
    return "Low chance";
}

async function updateSignals(symbol) {
    for (let interval of INTERVALS) {
        historicalData[`${symbol}-${interval}`] = await fetchHistoricalData(symbol, interval);
        const votes = calculateIndicators(historicalData[`${symbol}-${interval}`]);
        const decision = votes.buy > votes.sell ? "Buy" : "Sell";
        const power = determinePower(votes);
        
        document.getElementById(`signal-${symbol}-${interval}`).innerText = decision;
        document.getElementById(`power-${symbol}-${interval}`).innerText = power;
    }
}

document.getElementById("update").addEventListener("click", () => {
    Object.keys(SYMBOLS).forEach(symbol => {
        fetchPrice(symbol);
        updateSignals(symbol);
    });
});

setInterval(() => {
    Object.keys(SYMBOLS).forEach(symbol => {
        fetchPrice(symbol);
        updateSignals(symbol);
    });
}, 60000);

Object.keys(SYMBOLS).forEach(symbol => {
    fetchPrice(symbol);
    updateSignals(symbol);
});
