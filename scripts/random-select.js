const fs = require('fs');

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
        const data = JSON.parse(rawData);

        if (!Array.isArray(data)) {
            throw new Error("JSON root must be an array.");
        }

        // 2. Shuffle and pick N items
        // For very large arrays, a true Fisher-Yates shuffle is more efficient
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, n);

        // 3. Write to the new file
        fs.writeFileSync(outputFile, JSON.stringify(selected, null, 4));
        
        console.log(`Successfully saved ${selected.length} items to ${outputFile}`);
    } catch (error) {
        console.error("Error processing JSON:", error.message);
    }
}

// Usage:
selectRandomItems('../questions-full.json', '../questions.json', 75);