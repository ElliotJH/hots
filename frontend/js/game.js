/*
    Constants
*/
var wsAddress = "ws://10.7.3.119:9000";
var tile_height = 40;
var tile_width = 40;
var item_height = 100;
var item_width = 100;
var levelDefinitions = {
    0: "floor",
    1: "wall",
    2: "exit",
    3: "floor"
};
var stateDefinitions = {
    0: "lifeRing",
    1: "rope",
    2: "raincoat",
    3: "sextant",
    4: "anchor",
    5: "spacehelmet",
    6: "oxygen",
    7: "jetpack",
    8: "alien",
    9: "phaser",
    10: "parachute",
    11: "landingGear",
    12: "breathingMask",
    13: "suitcase",
    14: "passport",
    15: "cocktail",
    16: "beachball",
    17: "trunks",
    18: "desertIslandDisc",
    19: "pineapple",
    20: "penguin",
    21: "snowman",
    22: "pole",
    23: "santa",
    24: "scarf",
    25: "palmTree",
    26: "camel",
    27: "waterBottle",
    28: "bucket",
    29: "duneBuggy",
    30: "fists",
    31: "spoon",
    32: "gun",
    33: "knife",
    34: "nailBoard",
    35: "taser"
};

/*
    Game
*/
var myPlayer;
var players = {};
var items = {};

/*
    State
*/
var socket;
var UIGroup;
var cursors;
var keyboard;
var worldInit = false;
var socketReady = false;

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', {
    preload: preload,
    create: create,
    update: update
});

function socketOpen() {
    socketReady = true;
}

function socketClose() {
    socketReady = false;
}

function socketMessage(msg) {
    var parsed = JSON.parse(msg.data);

    if (parsed.type == "world") {
        var world = parsed.world;

        for(var i = 0; i < world.length; i++) {
            var row = world[i];

            for(var j = 0; j < row.length; j++) {

                var ob = game.add.sprite(j*tile_width, i*tile_height, levelDefinitions[row[j]]);
                ob.pivot = new PIXI.Point(tile_width / 2, tile_height / 2);

            }
        }

        worldInit = true;
        myPlayer = parsed.id;
        game.camera.bounds = null;

    } else if (parsed.type == "tick" && worldInit) {
        var playerList = parsed.players;
        var ids = [];
        for(var i = 0; i < playerList.length; i++) {
            var player = players[playerList[i].id];
            ids.push(playerList[i].id.toString());
            if (player) {
                player.x = playerList[i].location[0];
                player.y = playerList[i].location[1];
                player.rotation = playerList[i].location[2];
            } else {
                players[playerList[i].id] = game.add.sprite(playerList[i].location[0],
                    playerList[i].location[1], 'player');
                players[playerList[i].id].pivot = new PIXI.Point(tile_width/2, tile_height/2);
            }
        }
        var keys = Object.keys(players);
        for(var i = 0; i < keys.length; i++) {
            if (ids.indexOf(keys[i]) == -1) {
                players[keys[i]].kill();
            }
        }
        var itemList = parsed.items;
        var itemIds = [];
        for(var i = 0; i < itemList.length; i++) {
            var item = items[itemList[i].id];
            itemIds.push(itemList[i].id.toString());
            if (item) {
                item.x = itemList[i].location[0];
                item.y = itemList[i].location[1];
            } else {
                items[itemList[i].id] = game.add.sprite(itemList[i].location[0], itemList[i].location[1], 'item-ground');
                items[itemList[i].id].pivot = new PIXI.Point(16, 16);
            }
        }
        keys = Object.keys(items);
        for(var i = 0; i < keys.length; i++) {
            if (itemIds.indexOf(keys[i]) == -1) {
                items[keys[i]].kill();
            }
        }
    }
};

function preload() {
    game.load.image('player','resources/art/human.png', tile_width, tile_height);
    game.load.image('wall', 'resources/art/tile-wall-40.png', tile_width, tile_height);
    game.load.image('floor', 'resources/art/tile-floor-40.png', tile_width, tile_height);
    game.load.image('exit', 'resources/art/tile-exit-40.png', tile_width, tile_height);

    game.load.image('anchor', 'resources/art/ship/anchor.png', item_width, item_height);
    game.load.image('raincoat', 'resources/art/ship/raincoat.png', item_width, item_height);
    game.load.image('lifeRing', 'resources/art/ship/fishing-hook.png', item_width, item_height);
    game.load.image('rope', 'resources/art/ship/octopus.png', item_width, item_height);
    game.load.image('sextant', 'resources/art/ship/sad-crab.png', item_width, item_height);

    game.load.image('passport', 'resources/art/plane/folded-paper.png', item_width, item_height);
    game.load.image('breathingMask', 'resources/art/plane/gas-mask.png', item_width, item_height);
    game.load.image('parachute', 'resources/art/plane/parachute.png', item_width, item_height);

    game.load.image('phaser', 'resources/art/space/ray-gun.png', item_width, item_height);
    game.load.image('jetpack', 'resources/art/space/rocket.png', item_width, item_height);
    game.load.image('spacehelmet', 'resources/art/space/space-suit.png', item_width, item_height);
    game.load.image('alien', 'resources/art/space/satellite.png', item_width, item_height);
    game.load.image('oxygen', 'resources/art/space/chemical-tank.png', item_width, item_height);

    game.load.image('fists', 'resources/art/weapons/punch.png', item_width, item_height);
    game.load.image('gun', 'resources/art/weapons/revolver.png', item_width, item_height);
    game.load.image('taser', 'resources/art/weapons/tesla-coil.png', item_width, item_height);
    game.load.image('knife', 'resources/art/weapons/plain-dagger.png', item_width, item_height);
    game.load.image('spoon', 'resources/art/weapons/broken-bottle.png', item_width, item_height);

    game.load.image('item-ground', 'resources/art/item-ground.png');

    game.load.audio('background', 'resources/audio/ambient/background.mp3');

    background = game.add.audio('background');
    background.play('');

    game.stage.disableVisibilityChange = true;

}

function create() {
    UIGroup = game.add.group();
    socket = new WebSocket(wsAddress);
    socket.onopen = socketOpen;
    socket.onclose = socketClose;
    socket.onmessage = socketMessage;
    cursors = game.input.keyboard.createCursorKeys();
    keyboard = game.input.keyboard;
    keyboard.addKeyCapture([87, 65, 83, 68]);
}

function update() {
    var up = keyboard.isDown(87);
    var down = keyboard.isDown(83);
    var left = keyboard.isDown(65);
    var right = keyboard.isDown(68);

    var direction = '';

    if (up) { direction += 'up'; }
    if (down) { direction += 'down'; }
    if (left) { direction += 'left'; }
    if (right) { direction += 'right'; }

    var x = game.input.mousePointer.worldX;
    var y = game.input.mousePointer.worldY;

    var angle = 0;

    if (myPlayer && Object.keys(players).length) {
        var changeX  = x - players[myPlayer].x;
        var changeY = y - players[myPlayer].y;

        var toTan = changeY / changeX;

        angle = Math.atan(toTan);
        angle += Math.PI/2;

        if(changeX < 0){
            angle -= Math.PI;
        }

        game.camera.x = players[myPlayer].x - 400;
        game.camera.y = players[myPlayer].y - 300;

        UIGroup.x = game.camera.x;
        UIGroup.y = game.camera.y;

        players[myPlayer].rotation = angle;

    }

    sendMessage({type: "movement", direction: direction, angle: angle});

}

function sendMessage(message) {
    if (!socketReady) {
        return;
    }

    var jsonText = JSON.stringify(message);
    socket.send(jsonText);
}