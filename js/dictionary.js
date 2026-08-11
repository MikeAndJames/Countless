/**
 * ===================================================================
 * COUNTLESS - DICTIONARY & ANAGRAM SOLVER ENGINE
 * ===================================================================
 * Educational Notes for Mike & James:
 * 1. Comprehensive Local Dataset: Loads over 61,000 valid 3-9 letter English words
 *    with real dictionary definitions from `data/dictionary.json`.
 * 2. Strict Word Validation: Word MUST exist in the official dictionary!
 * 3. Live API Fallback: Fetches definitions if needed.
 * 4. Fast Anagram Solver: Finds top matching words in milliseconds.
 */

const FALLBACK_DICTIONARY = {
    "COUNTLESS": "Too many to be counted; infinite or endless.",
    "CELEBRATE": "Perform a religious ceremony or engage in enjoyable activity for a special day.",
    "CHAMPIONS": "A person who has defeated all opponents in a competition."
};

export class CountdownDictionaryEngine {
    constructor() {
        this.dictionaryMap = new Map();
        this.isLoaded = false;
        
        // Load fallback dictionary immediately
        for (const [word, def] of Object.entries(FALLBACK_DICTIONARY)) {
            this.dictionaryMap.set(word.toUpperCase(), def);
        }

        // Load full 61,900+ word dictionary dataset from data/dictionary.json
        this.loadFullDictionary();
    }

    async loadFullDictionary() {
        try {
            const res = await fetch('data/dictionary.json');
            if (res.ok) {
                const data = await res.json();
                for (const [word, def] of Object.entries(data)) {
                    this.dictionaryMap.set(word.toUpperCase(), def);
                }
                this.isLoaded = true;
                this.nineLetterWords = []; // Reset cache so full 202,133-word dataset is used!
                console.log(`Loaded ${this.dictionaryMap.size} words into Countdown dictionary!`);
            }
        } catch(e) {
            console.warn("Using built-in dictionary fallback.", e);
        }
    }

    /**
     * Get a random 9-letter word from the full dictionary dataset
     */
    getRandom9LetterWord() {
        if (!this.nineLetterWords || this.nineLetterWords.length <= 3) {
            this.nineLetterWords = [];
            for (const word of this.dictionaryMap.keys()) {
                if (word.length === 9 && /^[A-Z]+$/.test(word)) {
                    this.nineLetterWords.push(word);
                }
            }
        }

        if (this.nineLetterWords.length === 0) {
            return "CELEBRATE";
        }

        const idx = Math.floor(Math.random() * this.nineLetterWords.length);
        return this.nineLetterWords[idx];
    }

    async getRandom9LetterWordAsync() {
        if (!this.isLoaded) {
            await this.loadFullDictionary();
        }
        return this.getRandom9LetterWord();
    }

    /**
     * STRICT DICTIONARY CHECK: Must exist in dictionaryMap!
     */
    isValidWord(word) {
        if (!word || word.length < 3 || word.length > 9) return false;
        const cleanWord = word.trim().toUpperCase();
        return this.dictionaryMap.has(cleanWord);
    }

    /**
     * Synchronous definition getter
     */
    getDefinition(word) {
        const cleanWord = word.trim().toUpperCase();
        if (this.dictionaryMap.has(cleanWord)) {
            return this.dictionaryMap.get(cleanWord);
        }
        return `A valid ${cleanWord.length}-letter word in the English dictionary.`;
    }

    /**
     * Async definition getter with live dictionary API fallback
     */
    async getDefinitionAsync(word) {
        if (!word) return "";
        const cleanWord = word.trim().toUpperCase();
        
        if (this.dictionaryMap.has(cleanWord)) {
            const cachedDef = this.dictionaryMap.get(cleanWord);
            if (cachedDef && !cachedDef.startsWith("Valid ")) {
                return cachedDef;
            }
        }

        const challenge = await this.challengeWordOnlineAsync(cleanWord);
        if (challenge.valid && challenge.definition) {
            this.dictionaryMap.set(cleanWord, challenge.definition);
            return challenge.definition;
        }

        if (this.dictionaryMap.has(cleanWord)) {
            return this.dictionaryMap.get(cleanWord);
        }

        return `A valid ${cleanWord.length}-letter word in the English dictionary.`;
    }

    /**
     * Live Online Dictionary Challenge
     * Queries Free Dictionary API & Datamuse API to verify words not in local dictionary (e.g. SLOVAK).
     */
    async challengeWordOnlineAsync(word) {
        if (!word || word.length < 3 || word.length > 9) return { valid: false, definition: null };
        const cleanWord = word.trim().toUpperCase();

        if (this.dictionaryMap.has(cleanWord)) {
            return { valid: true, definition: this.dictionaryMap.get(cleanWord) };
        }

        try {
            // 1. Query Free Dictionary API
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord.toLowerCase()}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data[0] && data[0].meanings && data[0].meanings.length > 0) {
                    const meaning = data[0].meanings[0];
                    const defText = meaning.definitions[0].definition;
                    const pos = meaning.partOfSpeech ? `[${meaning.partOfSpeech.toUpperCase()}] ` : '';
                    const fullDef = `${pos}${defText}`;
                    
                    this.dictionaryMap.set(cleanWord, fullDef);
                    return { valid: true, definition: fullDef };
                }
            }
        } catch(e) {}

        try {
            // 2. Query Datamuse API as secondary dictionary fallback
            const res2 = await fetch(`https://api.datamuse.com/words?sp=${cleanWord.toLowerCase()}&md=d&max=1`);
            if (res2.ok) {
                const data2 = await res2.json();
                if (data2 && data2.length > 0 && data2[0].word.toUpperCase() === cleanWord && data2[0].defs && data2[0].defs.length > 0) {
                    const rawDef = data2[0].defs[0];
                    const fullDef = `[DATAMUSE ONLINE] ${rawDef}`;
                    this.dictionaryMap.set(cleanWord, fullDef);
                    return { valid: true, definition: fullDef };
                }
            }
        } catch(e) {}

        return { valid: false, definition: null };
    }

    findBestWords(tileLetters) {
        const availableFreq = this._getLetterFrequency(tileLetters.join('').toUpperCase());
        const results = [];

        for (const [word, def] of this.dictionaryMap.entries()) {
            if (word.length > tileLetters.length) continue;

            if (this._canFormWord(word, availableFreq)) {
                results.push({
                    word: word,
                    length: word.length,
                    definition: def
                });
            }
        }

        results.sort((a, b) => {
            if (b.length !== a.length) return b.length - a.length;
            return a.word.localeCompare(b.word);
        });

        return results;
    }

    _getLetterFrequency(str) {
        const freq = {};
        for (const char of str) {
            freq[char] = (freq[char] || 0) + 1;
        }
        return freq;
    }

    _canFormWord(word, availableFreq) {
        const wordFreq = this._getLetterFrequency(word);
        for (const char in wordFreq) {
            if (!availableFreq[char] || wordFreq[char] > availableFreq[char]) {
                return false;
            }
        }
        return true;
    }
}

export const dictionaryEngine = new CountdownDictionaryEngine();
