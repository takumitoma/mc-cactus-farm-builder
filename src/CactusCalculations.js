const NUM_OF_BLOCKS_PER_LAYER = {
    cactus: 4,
    sand: 4,
    foundation: 13,
    cactusBreak: 2
};

const CactusCalculations = {
    computeNumOfLayersToBuild: function (startElevation, endElevation) {
        return Math.floor((endElevation - startElevation - 1) / 4);
    },

    computeNumOfBlocksNeeded: function (numOfLayersToBuild) {
        let numOfBlocks = {
            cactus: 0,
            sand: 0,
            foundation: 0,
            cactusBreak: 0
        };

        for (let block in NUM_OF_BLOCKS_PER_LAYER) {
            let blocksNeeded = numOfLayersToBuild * NUM_OF_BLOCKS_PER_LAYER[block];
            if (block == "foundation") {
                blocksNeeded += 5;
            }
            numOfBlocks[block] = blocksNeeded;
        }

        return numOfBlocks;
    },

    computeNumOfBlocksInInventory: function (botItems, foundationName, cactusBreakName) {
        let numOfBlocks = {
            cactus: 0,
            sand: 0,
            foundation: 0,
            cactusBreak: 0
        };

        for (let item of botItems) {
            switch (item.name) {
                case "cactus":
                    numOfBlocks["cactus"] += item.count;
                    break;
                case "sand":
                    numOfBlocks["sand"] += item.count;
                    break;
                case foundationName:
                    numOfBlocks["foundation"] += item.count;
                    break;
                case cactusBreakName:
                    numOfBlocks["cactusBreak"] += item.count;
                    break;
            }
        }

        return numOfBlocks;
    },

    // return null if there aren't any missing blocks
    computeNumOfBlocksMissing: function (numOfBlocksNeeded, numOfBlocksInInventory) {
        let numOfBlocksMissing = {
            cactus: 0,
            sand: 0,
            foundation: 0,
            cactusBreak: 0
        };
        let hasEnoughMaterials = true;

        for (let block in numOfBlocksNeeded) {
            if (numOfBlocksInInventory[block] < numOfBlocksNeeded[block]) {
                numOfBlocksMissing[block] = 
                    numOfBlocksNeeded[block] - numOfBlocksInInventory[block];
                hasEnoughMaterials = false;
            }
        }

        return (hasEnoughMaterials) ? null : numOfBlocksMissing;
    }
}

module.exports = CactusCalculations;