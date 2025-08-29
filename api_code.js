
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// User details (replace with your own)
const USER_DATA = {
    user_id: "neeraj_01012001",
    email: "neeraj@gmail.com", 
    roll_number: "ABCD123"
};

// Helper function to check if a string is a number
function isNumber(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
}

// Helper function to check if a string is alphabetic
function isAlphabet(str) {
    return /^[a-zA-Z]+$/.test(str);
}

// Helper function to check if a string is a special character
function isSpecialChar(str) {
    return !/^[a-zA-Z0-9]+$/.test(str);
}

// POST endpoint for /bfhl
app.post('/bfhl', (req, res) => {
    try {
        const { data } = req.body;

        // Validate input
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                is_success: false,
                message: "Invalid input. 'data' should be an array."
            });
        }

        // Initialize result arrays
        const odd_numbers = [];
        const even_numbers = [];
        const alphabets = [];
        const special_characters = [];
        let sum = 0;

        // Process each element in the data array
        data.forEach(item => {
            const str = String(item);

            if (isNumber(str)) {
                const num = parseInt(str);
                sum += num;

                if (num % 2 === 0) {
                    even_numbers.push(str);
                } else {
                    odd_numbers.push(str);
                }
            } else if (isAlphabet(str)) {
                alphabets.push(str.toUpperCase());
            } else if (isSpecialChar(str)) {
                special_characters.push(str);
            }
        });

        // Create concatenated string in reverse order with alternating caps
        let concat_string = "";
        if (alphabets.length > 0) {
            const allAlphabets = alphabets.join('').split('');
            allAlphabets.reverse();

            allAlphabets.forEach((char, index) => {
                if (index % 2 === 0) {
                    concat_string += char.toUpperCase();
                } else {
                    concat_string += char.toLowerCase();
                }
            });
        }

        // Return response
        res.status(200).json({
            is_success: true,
            user_id: USER_DATA.user_id,
            email: USER_DATA.email,
            roll_number: USER_DATA.roll_number,
            odd_numbers: odd_numbers,
            even_numbers: even_numbers,
            alphabets: alphabets,
            special_characters: special_characters,
            sum: sum.toString(),
            concat_string: concat_string
        });

    } catch (error) {
        res.status(500).json({
            is_success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// GET endpoint for testing
app.get('/bfhl', (req, res) => {
    res.status(200).json({ 
        operation_code: 1 
    });
});

// Default route
app.get('/', (req, res) => {
    res.json({ 
        message: "BFHL API is running!",
        endpoints: {
            "POST /bfhl": "Main processing endpoint",
            "GET /bfhl": "Test endpoint"
        }
    });
});

// For Vercel serverless deployment
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
