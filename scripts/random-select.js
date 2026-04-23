const fs = require('fs');

const already_there = [
    271,
    272,
    273,
    274,
    275,
    276,
    277,
    278,
    279,
    280,
    281,
    282,
    283,
    284,
    285,
    286,
    287,
    288,
    289,
    290,
    291,
    292,
    293,
    294,
    295,
    296,
    297,
    298,
    299,
    300,
    301,
    302,
    303,
    304,
    305,
    306,
    307,
    308,
    309,
    310,
    311,
    312,
    313,
    314,
    315,
    316,
    317,
    318,
    319,
    320,
    321,
    322,
    323,
    324,
    325,
    326,
    327,
    328,
    329,
    330,
    331,
    332,
    333,
    334,
    335,
    336,
    337,
    338,
    339,
    340,
    341,
    342,
    343,
    344,
    345,
    264,
    318,
    232,
    225,
    260,
    191,
    234,
    178,
    229,
    238,
    91,
    200,
    15,
    116,
    180,
    1,
    211,
    186,
    174,
    152,
    135,
    136,
    42,
    75,
    143,
    39,
    241,
    221,
    240,
    205,
    237,
    139,
    138,
    171,
    176,
    224,
    148,
    55,
    137,
    210,
    54,
    134,
    141,
    153,
    262,
    77,
    40,
    223,
    142,
    66,
    147,
    244,
    247,
    179,
    100,
    25,
    61,
    256,
    259,
    131,
    70,
    26,
    144,
    169,
    251,
    27,
    85,
    127,
    182,
    239,
    133,
    76,
    193,
    57,
    226
]
/**
 * Randomly selects N items from a JSON array and saves them to a new file.
 * @param {string} sourceFile - Path to the original JSON file.
 * @param {string} outputFile - Path where the new JSON will be saved.
 * @param {number} n - Number of items to select.
 */
function selectRandomItems(sourceFile, outputFile, n) {
    try {
        // 1. Read and parse the source file
        const rawData = fs.readFileSync(sourceFile, 'utf8');
        let data = JSON.parse(rawData);

        if (!Array.isArray(data)) {
            throw new Error("JSON root must be an array.");
        }
        data = data.filter(d => !already_there.includes(d.id))

        // 2. Shuffle and pick N items
        // For very large arrays, a true Fisher-Yates shuffle is more efficient
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, data.length >= n ? n : data.length);

        // 3. Write to the new file
        fs.writeFileSync(outputFile, JSON.stringify(selected, null, 4));

        console.log(`Successfully saved ${selected.length} items to ${outputFile}`);
    } catch (error) {
        console.error("Error processing JSON:", error.message);
    }
}

// Usage:
selectRandomItems('../questions-full.json', '../questions.json', 75);