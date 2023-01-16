const CactusCalculations = require("./CactusCalculations");
const config = require("../config.json");
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalBlock = goals.GoalBlock;
const vec3 = require("vec3");

const FOUNDATION_BLOCK_NAME = config.settings.foundationBlock;
const CACTUS_BREAK_BLOCK_NAME = config.settings.cactusBreakBlock;
const NUM_OF_TICKS_JUMP = 15;
const TOP_FACE = vec3(0, 1, 0);

class CactusBot {
    constructor(botId) {
        const username = config.settings.username + botId.toString();

        this.bot = mineflayer.createBot({
            host: "localhost",
            port: config.settings.portNumber,
            username: username,
            version: config.settings.version
        });
        this.blockIds = {
            cactus: -1,
            sand: -1,
            foundation: -1,
            cactusBreak: -1
        };
        this.toolId = -1;

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
    }

    loadPathFinder(mcData) {
        this.bot.loadPlugin(pathfinder);
        const movements = new Movements(this.bot, mcData);
        this.bot.pathfinder.setMovements(movements);
        movements.canDig = false;
    }   

    async gotoGoalBlock(x, y, z) {
        const goal = new GoalBlock(x, y, z);
        await this.bot.pathfinder.goto(goal, true);
    }

    async build(numOfLayersToBuild, startElevation) {
        console.log(`${this.bot.username} building ${numOfLayersToBuild} layer(s)`,
            `starting at ${startElevation}`);

        await this.buildFoundationLayer();
        for (let i = 0; i < numOfLayersToBuild; ++i) {
            await this.buildFoundationLayer();
            await this.digFoundationLayer();
            await this.buildSandLayer();
            await this.buildCactusLayer();
            await this.buildCactusBreakLayer();
        }
        await this.digCorners();
        await this.digDown(startElevation);

        console.log(`${this.bot.username} finished building`);
    }

    // this function is largely copied from 
    // https://github.com/PrismarineJS/mineflayer/blob/master/examples/digger.js
    async buildUp() {
        await this.bot.equip(this.blockIds.foundation, "hand");
        const referenceBlock = this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0));
        const goalElevation = Math.floor(this.bot.entity.position.y) + 1.0;
        this.bot.setControlState("jump", true);
        this.bot.on("move", placeIfHighEnough);

        let tryCount = 0;
        const self = this;
        async function placeIfHighEnough () {
            if (self.bot.entity.position.y > goalElevation) {
                try {
                    await self.bot.placeBlock(referenceBlock, TOP_FACE);
                    self.bot.setControlState("jump", false);
                    self.bot.removeListener("move", placeIfHighEnough);
                } catch (err) {
                    ++tryCount;
                    if (tryCount > 10) {
                        self.bot.chat(err.message);
                        self.bot.setControlState("jump", false);
                        self.bot.removeListener("move", placeIfHighEnough);
                    }
                }
            }
        }

        await this.bot.waitForTicks(NUM_OF_TICKS_JUMP);
    }

    async buildCorners(blockID) {
        const botPosition = this.bot.entity.position;
        await this.bot.equip(blockID, "hand");
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(1, -1, -1)), TOP_FACE);
        await this.bot.equip(blockID, "hand");
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(1, -1, 1)), TOP_FACE);
        await this.bot.equip(blockID, "hand");
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(-1, -1, 1)), TOP_FACE);
        await this.bot.equip(blockID, "hand");
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(-1, -1, -1)), TOP_FACE);
    }

    async buildFoundationLayer() {
        await this.buildCorners(this.blockIds.foundation);
        await this.buildUp();
    }

    async buildSandLayer() {
        await this.buildCorners(this.blockIds.sand);
        await this.buildUp();
    }

    async buildCactusLayer() {
        await this.buildCorners(this.blockIds.cactus);
        await this.buildUp();
    }

    async digFoundationLayer() {
        const botPosition = this.bot.entity.position;
        if (this.toolId >= 0) this.bot.equip(this.toolId, "hand");
        await this.bot.dig(this.bot.blockAt(botPosition.offset(1, -2, -1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(1, -2, 1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(-1, -2, 1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(-1, -2, -1)), false);
    }

    async buildCactusBreakLayer() {
        await this.buildCorners(this.blockIds.foundation);
        const botPosition = this.bot.entity.position;
        await this.bot.equip(this.blockIds.cactusBreak, "hand");
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(1, 0, -1)), vec3(0, 0, 1));
        await this.bot.equip(this.blockIds.cactusBreak, "hand");
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(-1, 0, 1)), vec3(0, 0, -1));
        await this.buildUp();
    }

    async digDown(startElevation) {
        if (this.toolId >= 0) this.bot.equip(this.toolId, "hand");
        await this.bot.lookAt(this.bot.entity.position.offset(0, -1, 0));
        while (Math.floor(this.bot.entity.position.y) > startElevation) {
            await this.bot.dig(this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0)), true);
        }
    }

    async digCorners(blockID) {
        if (this.toolId >= 0) this.bot.equip(this.toolId, "hand");
        const botPosition = this.bot.entity.position;
        await this.bot.dig(this.bot.blockAt(botPosition.offset(1, -1, -1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(1, -1, 1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(-1, -1, 1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(-1, -1, -1)), false);
    }

    hasEnoughMaterials(numOfBlocksNeeded, botItems) {
        const numOfBlocksInInventory = CactusCalculations.computeNumOfBlocksInInventory
            (botItems, FOUNDATION_BLOCK_NAME, CACTUS_BREAK_BLOCK_NAME);
        console.log(`${this.bot.username} numOfBlocksInInventory`, numOfBlocksInInventory);

        const numOfBlocksMissing = 
            CactusCalculations.computeNumOfBlocksMissing(numOfBlocksNeeded, numOfBlocksInInventory);
        if (!numOfBlocksMissing) return true;

        let errMsg = ""
        for (let block in numOfBlocksMissing) {
            errMsg += `${block}: ${numOfBlocksMissing[block]} `;
        }
        this.bot.chat(`Failed to build, I am missing ${errMsg}`);
        console.log(`${this.bot.username} failed to build. Missing ${errMsg}`);
        return false;
    }

}

module.exports = CactusBot;