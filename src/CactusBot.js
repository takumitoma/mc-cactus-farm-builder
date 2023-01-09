const mineflayer = require("mineflayer");
const config = require("../config.json");
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalBlock = goals.GoalBlock;
var mcData;

class CactusBot {
    constructor(botId) {
        let username = config.settings.username + botId.toString();
        this.bot = mineflayer.createBot({
            host: "localhost",
            port: config.settings.portNumber,
            username: username,
            version: config.settings.version
        });
        this.initBasicEventListeners();
    }

    // --- Initializes basic event listeners
    initBasicEventListeners() {
        this.bot.on("death", () => {
            console.log(`${this.bot.username} died`);
        });

        this.bot.on("kicked", (reason, loggedIn) => {
            console.log(`${this.bot.username} kicked`);
            console.log(reason, loggedIn);
        });

        this.bot.on("error", err => {
            console.log(`${this.bot.username} error`);
            console.log(err);
        });

        this.bot.once("spawn", async () => await this.onSpawn());
    }

    async onSpawn() {
        console.log(`${this.bot.username} spawned`);
        mcData = require('minecraft-data')(this.bot.version);
        this.bot.loadPlugin(pathfinder);
        let movements = new Movements(this.bot, mcData);
        this.bot.pathfinder.setMovements(movements);
        movements.canDig = false;
    }

    async gotoGoalBlock(x, y, z) {
        let goal = new GoalBlock(x, y, z);
        await this.bot.pathfinder.goto(goal, true);
    }

}

module.exports = CactusBot;