const SYMBOLS = {
    BTC: "BTCUSDT",
    ETH: "ETHUSDT",
    TRX: "TRXUSDT",
    BNB: "BNBUSDT",
    SOL: "SOLUSDT"
};

const INTERVAL = "1m"; // Adjusted for 15-minute trading
const INDICATORS = ["RSI", "EMA10", "SMA10", "CCI", "ADX", "MACD", "STOCH", "MOM", "WPR", "VWMA", "BBP", "FOSC", "ICHIMOKU"];
let historicalData = {};

async function fetchPrice(symbol) {
    try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${SYMBOLS[symbol]}`);
        const data = await response.json();
        document.getElementById(`current-price-${symbol}`).innerHTML = `Current:<br>${parseFloat(data.price).toFixed(2)}$`;
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
    }
}

async function fetchHistoricalData(symbol) {
    try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${SYMBOLS[symbol]}&interval=1m&limit=15`);
        const data = await response.json();
        return data.map(candle => parseFloat(candle[4])); // Closing prices of last 15 minutes
    } catch (error) {
        console.error(`Error fetching historical data for ${symbol} (15M approximation):`, error);
        return [];
    }
}

function calculateSMA(data, period) {
    if (data.length < period) return null;
    let sum = data.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
}

function calculateEMA(data, period) {
    let multiplier = 2 / (period + 1);
    return data.reduce((acc, val, index) => {
        if (index === 0) return val;
        return (val - acc) * multiplier + acc;
    });
}

function calculateRSI(data) {
    let gains = 0, losses = 0;
    for (let i = 1; i < data.length; i++) {
        let change = data[i] - data[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    let rs = gains / (losses || 1);
    return 100 - (100 / (1 + rs));
}

function calculateMACD(data) {
    let ema12 = calculateEMA(data, 12);
    let ema26 = calculateEMA(data, 26);
    return ema12 - ema26;
}

function calculateMomentum(data) {
    return data[data.length - 1] - data[0];
}

function predictPrice(data) {
    let lastClose = data[data.length - 1];
    let trend = (data[data.length - 1] - data[0]) / data.length;
    return (lastClose + trend).toFixed(2);
}

function determineSignal(indicators) {
    let weight = 0;
    if (indicators.rsi > 55) weight += 2;
    if (indicators.ema10 > indicators.sma10) weight += 2;
    if (indicators.macd > 0) weight += 3;
    if (indicators.momentum > 0) weight += 2;
    
    if (weight >= 5) return { signal: "Strong Buy", power: "High Confidence" };
    if (weight >= 2) return { signal: "Buy", power: "Medium Confidence" };
    if (weight <= -5) return { signal: "Strong Sell", power: "High Confidence" };
    if (weight <= -2) return { signal: "Sell", power: "Medium Confidence" };
    return { signal: "Neutral", power: "Low Confidence" };
}

async function updateSignals(symbol) {
    historicalData[symbol] = await fetchHistoricalData(symbol);
    if (historicalData[symbol].length < 15) return;
    
    const indicators = {
        rsi: calculateRSI(historicalData[symbol]),
        ema10: calculateEMA(historicalData[symbol], 10),
        sma10: calculateSMA(historicalData[symbol], 10),
        macd: calculateMACD(historicalData[symbol]),
        momentum: calculateMomentum(historicalData[symbol])
    };
    
    const { signal, power } = determineSignal(indicators);
    const predictedPrice = predictPrice(historicalData[symbol]);
    
    const signalElement = document.getElementById(`signal-${symbol}`);
    if (signalElement) signalElement.innerText = signal;
    
    const powerElement = document.getElementById(`power-${symbol}`);
    if (powerElement) powerElement.innerText = power;
    
    const predictElement = document.getElementById(`predictPrice-${symbol}`);
    if (predictElement) predictElement.innerText = predictedPrice;
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
}, 3000); // Faster updates for 15-minute trading

Object.keys(SYMBOLS).forEach(symbol => {
    fetchPrice(symbol);
    updateSignals(symbol);
});
