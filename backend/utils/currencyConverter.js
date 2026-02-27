import axios from 'axios';

/**
 * Fetches the conversion from LKR to USD using ExchangeRate-API
 * @param {number} lkrAmount - The total price in local currency
 */
export const getUSDPrice = async (lkrAmount) => {
    try {
        // Ensure you add this to your .env file
        const API_KEY = process.env.EXCHANGE_RATE_API_KEY; 
        const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/LKR/USD/${lkrAmount}`;
        
        const response = await axios.get(url);
        
        if (response.data.result === 'success') {
            return response.data.conversion_result;
        }
        return null;
    } catch (error) {
        console.error("Currency API Error:", error.message);
        return null; // Fallback so the order doesn't crash if API is down
    }
};