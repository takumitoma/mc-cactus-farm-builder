const CactusBot = require("./CactusBot");
const SecondaryCactusBot = require("./SecondaryCactusBot");
const config = require("../config.json");

const BOTS_COUNT = parseInt(config.settings.numberOfBots);
const NUM_OF_TICKS_BOT_SPAWN = 60; 

class PrimaryCactusBot extends CactusBot {
    constructor(botID) {
        super(botID);
        this.secondaryBots = []
    }

    async onSpawn() {
        super.onSpawn();
        for (var i = 2;  i <= BOTS_COUNT; ++i) {
            let newBot = new SecondaryCactusBot(i);
            this.secondaryBots.push(newBot);
            await this.bot.waitForTicks(NUM_OF_TICKS_BOT_SPAWN);
        }
    }

    async onGoto(tokens) {
        if (!this.gotoIsValid) return;
        await this.gotoGoalBlock(tokens[1], tokens[2], tokens[3]);
    }

    gotoIsValid(tokens) {
        if (!tokens.length != 4) {
            console.log("goto command failed, invalid argument length");
            return false;
        }
        let isNum = (num) => /^\d+\.\d+$/.test(num);
        if ((isNum(tokens[1])) && (isNum(tokens[2])) && (isNum(tokens[3]))) {
            return true;
        }
        else {
            console.log("goto command failed, invalid arguments for coordinates");
            return false;
        }
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