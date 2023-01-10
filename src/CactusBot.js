const CactusCalculations = require("./Calculations");
const mineflayer = require("mineflayer");
const config = require("../config.json");
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalBlock = goals.GoalBlock;
let mcData;
const vec3 = require("vec3");

const NUM_OF_TICKS_JUMP = 12;
const TOP_FACE = vec3(0, 1, 0);

class CactusBot {
    constructor(botId) {
        let username = config.settings.username + botId.toString();
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

    async build(numOfLayersToBuild, startElevation) {
        console.log(`${this.bot.username} building ${numOfLayersToBuild} layers`,
            `starting at ${startElevation}`);
        await this.buildFoundationLayer();
        for (var i = 0; i < numOfLayersToBuild; ++i) {
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

    async buildUp() {
        await this.bot.equip(this.blockIds.foundation, "hand");
        let sourceBlockPosition = this.bot.entity.position.offset(0, -1, 0);
        let sourceBlock = this.bot.blockAt(sourceBlockPosition);
        let goalElevation = Math.floor(this.bot.entity.position.y) + 1;
        await this.bot.lookAt(sourceBlockPosition);
        let tryCount = 0

        while (tryCount < 10) {
            try {
                this.bot.setControlState("jump", true);
                this.bot.setControlState("jump", false);
                while (true) {
                    if (this.bot.entity.position.y >= goalElevation) {
                        await this.bot.placeBlock(sourceBlock, TOP_FACE);
                        break;
                    }
                    await this.bot.waitForTicks(1);
                }
                break;
            } catch(e) {
                await this.bot.waitForTicks(NUM_OF_TICKS_JUMP);
                tryCount += 1;
                if (tryCount == 10) console.log(e);
            }
        }
    }

    async buildCorners(blockID) {
        await this.bot.equip(blockID, "hand");
        let botPosition = this.bot.entity.position;
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(1, -0.5, -1)), TOP_FACE);
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(1, -0.5, 1)), TOP_FACE);
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(-1, -0.5, 1)), TOP_FACE);
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(-1, -0.5, -1)), TOP_FACE);
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
        let botPosition = this.bot.entity.position;
        if (this.toolId >= 0) this.bot.equip(this.toolId, "hand");
        await this.bot.dig(this.bot.blockAt(botPosition.offset(1, -1.5, -1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(1, -1.5, 1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(-1, -1.5, 1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(-1, -1.5, -1)), false);
    }

    async buildCactusBreakLayer() {
        await this.buildCorners(this.blockIds.foundation);
        await this.bot.equip(this.blockIds.cactusBreak, "hand");
        let botPosition = this.bot.entity.position;
        await this.bot.placeBlock(this.bot.blockAt(botPosition.offset(1, 0, -1)), vec3(0, 0, 1));
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
        let botPosition = this.bot.entity.position;
        await this.bot.dig(this.bot.blockAt(botPosition.offset(1, -0.5, -1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(1, -0.5, 1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(-1, -0.5, 1)), false);
        await this.bot.dig(this.bot.blockAt(botPosition.offset(-1, -0.5, -1)), false);
    }

}

module.exports = CactusBot;