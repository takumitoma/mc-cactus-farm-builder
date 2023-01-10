const CactusBot = require("./CactusBot");
const config = require("../config.json");
const CactusCalculations = require("./CactusCalculations");
let mcData; // loaded after bot spawns in minecraft server

const BOTS_COUNT = parseInt(config.settings.numberOfBots);
const NUM_OF_TICKS_BOT_SPAWN = 20; 
const TOOL_NAME = config.settings.tool;
const FOUNDATION_BLOCK_NAME = config.settings.foundationBlock;
const CACTUS_BREAK_BLOCK_NAME = config.settings.cactusBreakBlock;
const offsets = [
    [4, 0],
    [4, 4],
    [0, 4],
    [-4, 4],
    [-4, 0],
    [-4, -4],
    [0, -4],
    [4, -4]
]

class PrimaryCactusBot extends CactusBot {
    constructor(botId) {
        super(botId);
        this.secondaryBots = [];
        this.initCommandListener();
    }

    async initCommandListener() {
        this.bot.on("chat", async (username, message) => {
            if ((username == this.bot.username) || !message.startsWith("cactus")) return;

            let tokens = message.split(" ").slice(1);

            switch(tokens[0]) {
                case "build":
                    await this.onBuild(tokens);
                    break;
                case "goto":
                    await this.onGoto(tokens);
                    break;
            }
        });
    }

    loadBlockIds() {
        this.blockIds.cactus = this.getBlockID("cactus");
        this.blockIds.sand = this.getBlockID("sand");
        this.blockIds.foundation = this.getBlockID(FOUNDATION_BLOCK_NAME);
        this.blockIds.cactusBreak = this.getBlockID(CACTUS_BREAK_BLOCK_NAME);
    }

    loadToolId() {
        let toolName = TOOL_NAME;
        if (toolName != "") this.toolId = mcData.itemsByName[toolName].id;
    }

    async onSpawn() {
        super.onSpawn();
        mcData = require('minecraft-data')(this.bot.version);
        this.loadPathFinder(mcData);
        this.loadBlockIds();
        this.loadToolId();
        await this.spawnSecondaryBots();
    }

    async spawnSecondaryBots() {
        for (let i = 2;  i <= BOTS_COUNT; ++i) {
            let newBot = new CactusBot(i);
            Object.assign(newBot.blockIds, this.blockIds);
            newBot.toolId = this.toolId;
            this.secondaryBots.push(newBot);
            await this.bot.waitForTicks(NUM_OF_TICKS_BOT_SPAWN);
            newBot.loadPathFinder(mcData);
        }
    }

    gotoIsValid(tokens) {
        if (tokens.length != 4) {
            console.log("goto command failed, invalid argument length");
            return false;
        }
        if (!isNaN(tokens[1]) && !isNaN(tokens[2]) && !isNaN(tokens[3])) {
            return true;
        }
        else {
            console.log("goto command failed, invalid arguments for coordinates");
            return false;
        }
    }

    buildIsValid(tokens) {
        if (tokens.length != 2) {
            console.log("build command failed, invalid argument length");
            return false;
        }
        if (isNaN(tokens[1])) {
            console.log("build command failed, invalid arguments for coordinates");
            return false;
        }
        return true;
    }

    // --- Give name of a block as a string returns the mcData blocks id
    getBlockID(blockName) {
        try {
            return mcData.itemsByName[blockName].id;
        } catch(e) {
            this.bot.chat(`Failed, specified block does not exist: ${blockName}`);
            console.log(`getBlock() failed, specified block does not exist: ${blockName}`);
            return -1;
        }
    }

    getNumOfBlocksNeeded(numOfLayersToBuild) {
        let numOfBlocksNeeded = CactusCalculations.computeNumOfBlocksNeeded(numOfLayersToBuild);
        console.log("numOfBlocksNeeded: ", numOfBlocksNeeded);
        return numOfBlocksNeeded;
    }

    async onGoto(tokens) {
        if (!this.gotoIsValid(tokens)) return;
        let x = parseFloat(tokens[1]);
        let y = parseFloat(tokens[2]);
        let z = parseFloat(tokens[3]);
        let self = this;
        let operations = [new Promise(async function() { await self.gotoGoalBlock(x, y, z) })];
        let i = 0;
        for (let cactusBot of this.secondaryBots) {
            let newX = x + offsets[i][0];
            let newZ = z + offsets[i][1];
            operations.push(new Promise(async function() { 
                await cactusBot.gotoGoalBlock(newX, y, newZ);
            }));
            ++i;
        }
        Promise.all(operations);
    }

    async onBuild(tokens) {
        if (!this.buildIsValid(tokens)) return;
        let startElevation = this.bot.entity.position.y;
        let endElevation = tokens[1];
        let numOfLayersToBuild = 
            CactusCalculations.computeNumOfLayersToBuild(startElevation, endElevation);
        let numOfBlocksNeeded = this.getNumOfBlocksNeeded(numOfLayersToBuild);
        if (!this.allBotsHaveEnoughMaterials(numOfBlocksNeeded)) return;
        await this.allBotsBuild(numOfLayersToBuild, startElevation);
    }

    allBotsHaveEnoughMaterials(numOfBlocksNeeded) {
        let conditionSatisfied = true;
        let botItems = this.bot.inventory.items();
        if (!this.hasEnoughMaterials(numOfBlocksNeeded, botItems)) conditionSatisfied = false;
        for (let cactusBot of this.secondaryBots) {
            let cactusBotItems = cactusBot.bot.inventory.items();
            if (!cactusBot.hasEnoughMaterials(numOfBlocksNeeded, cactusBotItems)) {
                conditionSatisfied = false;
            }
        }
        return conditionSatisfied;
    }

    async allBotsBuild(numOfLayersToBuild, startElevation) {
        let self = this;
        let operations = [new Promise(async function() { 
            await self.build(numOfLayersToBuild, startElevation) 
        })];
        let i = 0;
        for (let cactusBot of this.secondaryBots) {
            operations.push(new Promise(async function() { 
                await cactusBot.build(numOfLayersToBuild, startElevation);
            }));
            ++i;
        }
        Promise.all(operations);
    }

}

class Singleton {
    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new PrimaryCactusBot(1);
        }
        return Singleton.instance
    }
}

module.exports = Singleton;