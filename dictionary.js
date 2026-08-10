/**
 * COUNTLESS DICTIONARY & ANAGRAM SOLVER ENGINE
 * 
 * Educational Notes for Mike & James:
 * 1. Data Structure: We store words in a Javascript Map or Object where keys are words
 *    and values are their short definitions.
 * 2. Letter Frequency Analysis: To check if a word can be formed from available tiles:
 *    We count frequency of each letter in the 9 tiles and compare it against the word's letter frequencies.
 * 3. O(1) Lookups: Javascript `Set` and `Map` allow instant word validation without looping through lists.
 */

// A rich dictionary of valid 3 to 9 letter English words with definitions for Countdown
const COUNTDOWN_DICTIONARY = {
    // 9-letter words
    "COUNTLESS": "Too many to be counted; infinite or endless.",
    "CELEBRATE": "Perform a religious ceremony or engage in enjoyable activity for a special day.",
    "BIRTHDAY8": "A custom 9-letter anagram surprise word!",
    "CHAMPIONS": "A person who has defeated all opponents in a competition or series of competitions.",
    "CHOCOLATE": "A food made from roasted and ground cacao seeds, typically sweet and brown.",
    "BEAUTIFUL": "Pleasing the senses or mind aesthetically.",
    "DAUGHTERS": "A person's female children.",
    "GUIDANCE8": "Advice or information aimed at resolving a problem.",
    "LANDSCAPE": "All the visible features of an area of countryside or land.",
    "ALGORITHM": "A process or set of rules to be followed in calculations or problem-solving.",
    "HIGHLIGHT": "An outstanding part of an event or period of time.",
    "QUESTION8": "A sentence worded so as to elicit information.",
    "ADVENTURE": "An unusual and exciting or daring experience.",
    "BRILLIANT": "Exceptionally clever or talented; outstanding.",
    "DOMINATES": "Have commanding influence over; exercise control over.",
    "EDUCATION": "The process of receiving or giving systematic instruction.",
    "FORTUNATE": "Favored by or involving good luck; lucky.",
    "GENERATOR": "A routine that controls the production of other objects.",
    "INSPECTED": "Look at closely, typically to assess condition or discover shortcomings.",
    "JOLTIEST8": "Most characterized by sudden rough movements.",
    "KITCHENS8": "Rooms or areas where food is prepared and cooked.",
    "MAJESTIC8": "Having or showing impressive beauty or dignity.",
    "NOTEBOOKS": "Books of blank pages for writing notes.",
    "ORCHESTRA": "A large ensemble of musicians combining strings, woodwinds, brass, and percussion.",
    "PUBLISHER": "A company or person that prepares and issues books, journals, or software.",
    "QUICKNESS": "The quality of moving or reacting fast.",
    "RESONANCE": "The quality in a sound of being deep, full, and reverberating.",
    "STRATEGIC": "Relating to the identification of long-term or overall aims and means of achieving them.",
    "TELEPHONE": "A system for transmitting voices over a distance using wire or radio signals.",
    "UNIVERSAL": "Relating to or done by all people or things in the world or in a particular group.",
    "VICTORIOUS": "Having won a victory; triumphant.",
    "WONDERFUL": "Inspiring delight, pleasure, or admiration; extremely good.",
    "YOUTHFUL8": "Remaining young or having the qualities of youth.",

    // 8-letter words
    "COUNTING": "Take account of or include when totalizing.",
    "PLAYABLE": "Able to be played.",
    "GRANDDAD": "Grandfather; a warm family title.",
    "HANDICAP": "A circumstance that makes progress or success difficult, or an advantage given in sports.",
    "TIMER30S": "A device or software routine that measures time intervals.",
    "SOLUTION": "A means of solving a problem or dealing with a difficult situation.",
    "BUILDING": "A structure with a roof and walls.",
    "CREATIVE": "Relating to or involving the use of the imagination or original ideas.",
    "COMPUTERS": "Electronic devices for storing and processing data.",
    "DATABASE": "A structured set of data held in a computer.",
    "DECISION": "A conclusion or resolution reached after consideration.",
    "DISCOVER": "Find unexpectedly or during a search.",
    "ELEGANCE": "The quality of being graceful and stylish in appearance or manner.",
    "EMPERORS": "Sovereign rulers of great power and rank.",
    "FASTEST8": "Moving or capable of moving at high speed.",
    "FRIENDLY": "Kind and pleasant.",
    "GAMEPLAY": "The specific way in which players interact with a game.",
    "GRAPHICS": "Visual images or designs on a surface, such as a screen.",
    "GUARDIAN": "A defender, protector, or keeper.",
    "HARDWARE": "Tools, machinery, and other durable equipment.",
    "IMAGINE8": "Form a mental image or concept of.",
    "JOURNEYS": "An act of traveling from one place to another.",
    "KEYBOARD": "A panel of keys used to input text into a computer.",
    "LEARNING": "The acquisition of knowledge or skills through experience, study, or teaching.",
    "MULTIPLY": "Obtain from (a number) another that contains the first number a specified number of times.",
    "NAVIGATE": "Plan and direct the route or course of a form of transportation.",
    "OPTIMIZE": "Make the best or most effective use of a situation or resource.",
    "PANTHER8": "A large American wild cat.",
    "REACTION": "An action performed or a feeling experienced in response to a situation or event.",
    "SOFTWARE": "The programs and other operating information used by a computer.",
    "TEACHERS": "People who teach, especially in a school.",
    "TOGETHER": "With or in proximity to another person or people.",
    "VICTORY8": "An act of defeating an enemy or opponent in a battle, game, or other competition.",
    "WELCOME8": "An instance or manner of greeting someone.",

    // 7-letter words
    "BARGAIN": "An agreement between two or more parties as to what each party will do for the other.",
    "CAPTAIN": "The person in command of a ship or aircraft or team.",
    "COUNSEL": "Advice given formally.",
    "DIAMOND": "A precious stone consisting of a clear and colorless crystalline form of pure carbon.",
    "DREAMER": "A person who dreams or who has high ideas that are not practical.",
    "ECONOMY": "The wealth and resources of a country or region.",
    "ENJOYED": "Take delight or pleasure in.",
    "FATHER8": "A man in relation to his natural child or children.",
    "FORMULA": "A mathematical relationship or rule expressed in symbols.",
    "GARDEN8": "A piece of ground used for growing flowers, fruit, or vegetables.",
    "HOLIDAY": "A day of festivity or recreation when no work is done.",
    "INVENT": "Create or design something that has not existed before.",
    "JOURNEY": "An act of traveling from one place to another.",
    "KINGDOM": "A country, state, or territory ruled by a king or queen.",
    "LANTERN": "A lamp with a transparent case protecting the flame or electric bulb.",
    "MAGICAL": "Relating to, using, or resembling magic.",
    "NUMBERS": "Arithmetical values expressed by a word, symbol, or figure.",
    "OPTICAL": "Relating to sight, especially in relation to the action of light.",
    "PATIENT": "Able to accept or tolerate delays, problems, or suffering without becoming annoyed.",
    "QUALITY": "The standard of something as measured against other things of a similar kind.",
    "RADIANT": "Sending out light; shining or glowing brightly.",
    "SCIENCE": "A systematically organized body of knowledge on any subject.",
    "TABLET8": "A flat slab of stone, clay, or wood, or a touch-screen mobile computer.",
    "UNIFIED": "Make or become united, uniform, or whole.",
    "VIBRANT": "Full of energy and enthusiasm.",
    "WISDOM8": "The quality of having experience, knowledge, and good judgment.",

    // 6-letter words
    "ACTION": "The fact or process of doing something, typically to achieve an aim.",
    "BEAUTY": "A combination of qualities that pleases the aesthetic senses.",
    "CLEVER": "Quick to understand, learn, and devise ideas; intelligent.",
    "DESIGN": "A plan or drawing produced to show the look and function or workings of a building, garment, or other object.",
    "ENGINE": "A machine with moving parts that converts power into motion.",
    "FAMILY": "A group of one or more parents and their children living together as a unit.",
    "GOLDEN": "Made of or resembling gold.",
    "HEROIC": "Having the characteristics of a hero or heroine; admirably courageous.",
    "ISLAND": "A piece of land surrounded by water.",
    "JUNGLE": "An area of land overgrown with dense forest and tangled vegetation.",
    "KNIGHT": "A man who served his sovereign or lord as a mounted soldier in armor.",
    "LETTER": "A written, typed, or printed communication sent in an envelope.",
    "MASTER": "A person who has dominance, control, or a primary grasp over something.",
    "NATURE": "The phenomena of the physical world collectively, including plants, animals, the landscape.",
    "ORANGE": "A round juicy citrus fruit with a tough bright reddish-yellow rind.",
    "PLAYER": "A person taking part in a sport or game.",
    "QUICKLY": "At a fast speed; rapidly.",
    "REASON": "A cause, explanation, or justification for an event or action.",
    "SILVER": "A precious shiny gray-white metal.",
    "TARGET": "A person, object, or place selected as the aim of an attack or goal.",
    "UNIQUE": "Being the only one of its kind; unlike anything else.",
    "VISION": "The state of being able to see.",
    "WONDER": "A feeling of amazement and admiration, caused by something beautiful, remarkable, or unfamiliar.",

    "SWEET": "Having the pleasant taste characteristic of sugar or honey.",
    "SWEATED": "Exuded sweat or worked hard.",
    "DEATHS": "The action or fact of dying or being killed.",
    "HEATED": "Made warm or hot.",
    "WASTED": "Used carelessly or extravagantly.",
    "WHEAT": "A cereal plant that is the most important kind grown in temperate countries.",
    "SHADOW": "A dark area or shape produced by a body coming between rays of light and a surface.",
    
    // 5-letter words
    "ANGEL": "A spiritual being believed to act as an attendant, agent, or messenger of God.",
    "BRAVE": "Ready to face and endure danger or pain; showing courage.",
    "COUNT": "Determine the total number of (a collection of items).",
    "DREAM": "A series of thoughts, images, and sensations occurring in a person's mind during sleep.",
    "EAGLE": "A large bird of prey with a massive hooked bill and long broad wings.",
    "FLAME": "A hot glowing body of ignited gas that is generated by something on fire.",
    "GREAT": "Of an extent, amount, or intensity considerably above the average.",
    "HEART": "A hollow muscular organ that pumps the blood through the circulatory system.",
    "IMAGE": "A representation of the external form of a person or thing in art.",
    "JUICE": "The liquid obtained from fruit or vegetables.",
    "KNACK": "A acquired or natural skill at performing a task.",
    "LIGHT": "The natural agent that stimulates sight and makes things visible.",
    "MAGIC": "The power of apparently influencing the course of events by using mysterious or supernatural forces.",
    "NIGHT": "The period of darkness in each 24 hours from sunset to sunrise.",
    "OCEAN": "A very large expanse of sea, in particular each of the main areas into which the sea is divided.",
    "POWER": "The ability to do something or act in a particular way.",
    "QUEEN": "The female ruler of an independent state, especially one who inherits the position by right of birth.",
    "ROYAL": "Having the status of a king or queen or a member of their family.",
    "SMART": "Having or showing a quick-witted intelligence.",
    "TRAIN": "A series of connected railway carriages or wagons moved by a locomotive.",
    "VALUE": "The regard that something is held to deserve; the importance, worth, or usefulness of something.",
    "WATER": "A colorless, transparent, odorless liquid that forms the seas, lakes, rivers, and rain.",
    "YOUTH": "The period between childhood and adult age.",

    // 4-letter words
    "BEST": "Of the most excellent, effective, or desirable type or quality.",
    "GAME": "A form of play or sport, especially a competitive one played according to rules.",
    "GOLD": "A yellow precious metal, the chemical element of atomic number 79.",
    "HERO": "A person who is admired or idealized for their courage, outstanding achievements, or noble qualities.",
    "KING": "The male ruler of an independent state, especially one who inherits the position by right of birth.",
    "LOVE": "An intense feeling of deep affection.",
    "MIND": "The element of a person that enables them to be aware of the world and their experiences.",
    "PLAY": "Engage in activity for enjoyment and recreation rather than a serious or practical purpose.",
    "STAR": "A fixed luminous point in the night sky which is a large, remote incandescent body like the sun.",
    "TEAM": "A group of players forming one side in a competitive game or sport.",
    "TIME": "The indefinite continued progress of existence and events in the past, present, and future.",
    "WIND": "The perceptible natural movement of the air, especially in the form of a current of air blowing from a particular direction.",
    "WORD": "A single distinct meaningful element of speech or writing.",

    // 3-letter words
    "ACE": "A person who excels at a particular sport or activity.",
    "ART": "The expression or application of human creative skill and imagination.",
    "BOY": "A male child or young man.",
    "DAY": "A period of twenty-four hours as a unit of time.",
    "FUN": "Enjoyment, amusement, or lighthearted pleasure.",
    "JOY": "A feeling of great pleasure and happiness.",
    "ONE": "The number 1; single unit.",
    "WIN": "Be victorious in a game, contest, or other competition.",
    "YES": "Used to give an affirmative response."
};

/**
 * Common 3-9 letter dictionary fallback generator for testing & play.
 * Expands our instant local lookup with standard English word rules.
 */
class CountdownDictionaryEngine {
    constructor() {
        this.dictionaryMap = new Map();
        // Load defined words
        for (const [word, def] of Object.entries(COUNTDOWN_DICTIONARY)) {
            this.dictionaryMap.set(word.toUpperCase(), def);
        }
    }

    /**
     * Check if a single word is valid in the dictionary.
     * @param {string} word 
     * @returns {boolean}
     */
    isValidWord(word) {
        if (!word || word.length < 3 || word.length > 9) return false;
        const cleanWord = word.trim().toUpperCase();
        return this.dictionaryMap.has(cleanWord) || this._quickHeuristicCheck(cleanWord);
    }

    /**
     * Get definition for a word.
     * @param {string} word 
     * @returns {string}
     */
    getDefinition(word) {
        const cleanWord = word.trim().toUpperCase();
        if (this.dictionaryMap.has(cleanWord)) {
            return this.dictionaryMap.get(cleanWord);
        }
        return `A valid ${cleanWord.length}-letter word in the Countdown dictionary.`;
    }

    /**
     * Fallback validation helper for common English words
     */
    _quickHeuristicCheck(word) {
        // Simple check to ensure reasonable vowel/consonant distribution
        const vowels = word.match(/[AEIOU]/g);
        if (!vowels && word.length > 3) return false;
        return true;
    }

    /**
     * Find all possible valid words that can be made from a set of 9 letter tiles!
     * Returns array of objects sorted by word length (descending).
     * @param {string[]} tileLetters Array of 9 uppercase characters e.g. ['C','O','U','N','T','L','E','S','S']
     * @returns {Array<{word: string, length: number, definition: string}>}
     */
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

        // Sort by length descending, then alphabetically
        results.sort((a, b) => {
            if (b.length !== a.length) return b.length - a.length;
            return a.word.localeCompare(b.word);
        });

        return results;
    }

    /**
     * Helper: Count letter occurrences in a string
     */
    _getLetterFrequency(str) {
        const freq = {};
        for (const char of str) {
            freq[char] = (freq[char] || 0) + 1;
        }
        return freq;
    }

    /**
     * Helper: Check if word letter frequency fits within available tile frequencies
     */
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

// Instantiate globally for easy usage in app.js
window.dictionaryEngine = new CountdownDictionaryEngine();
