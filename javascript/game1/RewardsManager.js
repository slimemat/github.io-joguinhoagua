// javascript/game1/RewardsManager.js

export default class RewardsManager {
    constructor() {
        this.allRewards = [];
    }

    /**
     * Loads the reward data from the JSON file.
     */
    async loadRewards() {
        if (this.allRewards.length > 0) return; // Don't load twice

        try {
            const response = await fetch('./rewards.json');
            const data = await response.json();
            this.allRewards = data.rewards;
        } catch (error) {
            console.error("Failed to load rewards.json:", error);
        }
    }

    /**
     * Gets a specified number of unique, random rewards from the list.
     * @param {number} count - The number of rewards to get.
     * @returns {Array<object>} An array of reward objects.
     */
    getRandomRewards(count) {
        if (count > this.allRewards.length) {
            console.warn(`Requested ${count} rewards, but only ${this.allRewards.length} are available.`);
            return [...this.allRewards];
        }

        // Shuffle the array and take the first 'count' items
        const shuffled = [...this.allRewards].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}