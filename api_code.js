
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const USER_DATA = {
    user_id: "neeraj-06122003",
    email: "neerajkp1920@gmail.com", 
    roll_number: "22BCE11178"
};

function isNumber(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
}

function isAlphabet(str) {
    return /^[a-zA-Z]+$/.test(str);
}

function isSpecialChar(str) {
    return !/^[a-zA-Z0-9]+$/.test(str);
}


app.post('/bfhl', (req, res) => {
    try {
        const { data } = req.body;

   
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                is_success: false,
                message: "Invalid input. 'data' should be an array."
            });
        }


        const odd_numbers = [];
        const even_numbers = [];
        const alphabets = [];
        const special_characters = [];
        let sum = 0;

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


app.get('/bfhl', (req, res) => {
    res.status(200).json({ 
        operation_code: 1 
    });
});


app.get('/', (req, res) => {
    res.json({ 
        message: "BFHL API is running!",
        endpoints: {
            "POST /bfhl": "Main processing endpoint",
            "GET /bfhl": "Test endpoint"
        }
    });
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
