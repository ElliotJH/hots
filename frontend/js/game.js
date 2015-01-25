var wsAddress = "ws://10.7.3.119:9000";
// var wsAddress = "ws://10.7.3.103:9000";
var tile_height = 40;
var tile_width = 40;
var item_height = 100;
var item_width = 100;

var itemOneX = 100;
var itemOneY = 400;

var itemTwoX = 600;
var itemTwoY = 400;

var wantedOne = [275, 25];
var wantedTwo = [425, 25];

var itemArrayX = [itemOneX, itemTwoX];
var itemArrayY = [itemOneY, itemTwoY];

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
var held = [];
var heldIDs = [30,30];
var attackTimer;

/*
    State
*/
var levelGroup;
var socket;
var UIGroup;
var cursors;
var keyboard;
var worldInit = false;
var socketReady = false;
var playerName = window.prompt("Player name");
var lobbyElement = $('#lobby');
var winnerElement = $('#win');
var winner;

var state = 'lobby'; // {lobby, game, end}

/*
    Audio
*/
var background;
var alert;
var item_collect;
var item_throw;

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', {
    preload: preload,
    create: create,
    update: update
});

function OnItemPickup(){
    item_collect.play('');
}

function OnItemThrown(){
    item_throw.play('');
}

function socketOpen() {
    $('#status').fadeOut();
    socketReady = true;

    sendMessage({'type': 'join', 'name': playerName});
}

function socketClose() {
    $('#statustext').text("Lost socket...")
    $('#status').fadeIn();
    socketReady = false;
}

function socketMessage(msg) {
    var parsed = JSON.parse(msg.data);

    if (parsed.type == "world") {
        var world = parsed.world;

        for(var i = 0; i < world.length; i++) {
            var row = world[i];

            for(var j = 0; j < row.length; j++) {

                var ob = levelGroup.create(j*tile_width, i*tile_height, levelDefinitions[row[j]]);
                ob.pivot = new PIXI.Point(tile_width / 2, tile_height / 2);

            }
        }
        UIGroup.create(wantedOne[0], wantedOne[1], stateDefinitions[parsed.player_wanted[0]]);
        UIGroup.create(wantedTwo[0], wantedTwo[1], stateDefinitions[parsed.player_wanted[1]]);

        worldInit = true;
        myPlayer = parsed.id;
        game.camera.bounds = null;

        held[0] = UIGroup.create(itemOneX, itemOneY, 'fists');
        held[1] = UIGroup.create(itemTwoX, itemTwoY, 'fists');

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
                players[playerList[i].id].playerName = playerList[i].name;
            } else {
                players[playerList[i].id] = levelGroup.create(playerList[i].location[0],
                    playerList[i].location[1], 'player');
                players[playerList[i].id].pivot = new PIXI.Point(tile_width/2, tile_height/2);
                players[playerList[i].id].playerName = playerList[i].name;
            }
        }
        var keys = Object.keys(players);
        for(var i = 0; i < keys.length; i++) {
            if (ids.indexOf(keys[i]) == -1) {
                players[keys[i]].kill();
                delete players[keys[i]];
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
                items[itemList[i].id] = levelGroup.create(itemList[i].location[0], itemList[i].location[1], 'item-ground');
                items[itemList[i].id].pivot = new PIXI.Point(16, 16);
            }
        }
        keys = Object.keys(items);
        for(var i = 0; i < keys.length; i++) {
            if (itemIds.indexOf(keys[i]) == -1) {
                items[keys[i]].kill();
                delete items[keys[i]];
            }
        }

        for(var i = 0; i < 2; i++){
            if(heldIDs[i]  != parsed.player_items[i]){
                held[i].kill();
                held[i] = UIGroup.create(itemArrayX[i], itemArrayY[i], stateDefinitions[parsed.player_items[i]]);
                heldIDs[i] = parsed.player_items[i];
                if(heldIDs[i] == 30){
                    OnItemThrown();
                } else {
                    OnItemPickup();
                }
            }
        }
    } else if (parsed.type == 'state') {
        state = parsed.state;
    } else if (parsed.type == 'starting') {
        lobbyElement.find('#title').text("Starting...");
    } else if (parsed.type == 'winner') {
        winner = parsed.winner;
    }
};

function preload() {
    game.load.image('player','resources/art/human-2.png', tile_width, tile_height);
    game.load.image('wall', 'resources/art/tile-wall-40.png', tile_width, tile_height);
    game.load.image('floor', 'resources/art/tile-floor-40.png', tile_width, tile_height);
    game.load.image('exit', 'resources/art/tile-exit-40.png', tile_width, tile_height);

    game.load.image('anchor', 'resources/art/ship/anchor.png', item_width, item_height);
    game.load.image('raincoat', 'resources/art/ship/raincoat.png', item_width, item_height);
    game.load.image('lifeRing', 'resources/art/ship/fishing-hook.png', item_width, item_height);
    game.load.image('rope', 'resources/art/ship/octopus.png', item_width, item_height);
    game.load.image('sextant', 'resources/art/ship/sad-crab.png', item_width, item_height);

    game.load.image('passport', 'resources/art/plane/passport.png', item_width, item_height);
    game.load.image('breathingMask', 'resources/art/plane/gas-mask.png', item_width, item_height);
    game.load.image('parachute', 'resources/art/plane/parachute.png', item_width, item_height);
    game.load.image('landingGear', 'resources/art/plane/parachute_alt.png', item_width, item_height);
    game.load.image('suitcase', 'resources/art/plane/suitcase.png', item_width, item_height);

    game.load.image('phaser', 'resources/art/space/ray-gun.png', item_width, item_height);
    game.load.image('jetpack', 'resources/art/space/rocket.png', item_width, item_height);
    game.load.image('spacehelmet', 'resources/art/space/space-suit.png', item_width, item_height);
    game.load.image('alien', 'resources/art/space/satellite.png', item_width, item_height);
    game.load.image('oxygen', 'resources/art/space/chemical-tank.png', item_width, item_height);

    game.load.image('cocktail', 'resources/art/island/cocktail.png', item_width, item_height);
    game.load.image('beachball', 'resources/art/island/palm-tree.png', item_width, item_height);
    game.load.image('pineapple', 'resources/art/island/grapes.png', item_width, item_height);
    game.load.image('trunks', 'resources/art/island/tennis-ball.png', item_width, item_height);
    game.load.image('desertIslandDisc', 'resources/art/island/turtle.png', item_width, item_height);

    game.load.image('camel', 'resources/art/desert/camel.png', item_width, item_height);
    game.load.image('palmTree', 'resources/art/desert/cactus.png', item_width, item_height);
    game.load.image('bucket', 'resources/art/desert/bucket.png', item_width, item_height);
    game.load.image('waterBottle', 'resources/art/desert/water-drop.png', item_width, item_height);
    game.load.image('duneBuggy', 'resources/art/desert/scorpion.png', item_width, item_height);

    game.load.image('fists', 'resources/art/weapons/punch.png', item_width, item_height);
    game.load.image('gun', 'resources/art/weapons/revolver.png', item_width, item_height);
    game.load.image('taser', 'resources/art/weapons/tesla-coil.png', item_width, item_height);
    game.load.image('knife', 'resources/art/weapons/plain-dagger.png', item_width, item_height);
    game.load.image('spoon', 'resources/art/weapons/broken-bottle.png', item_width, item_height);

    game.load.image('item-ground', 'resources/art/item-ground.png');

    game.load.audio('background',             'resources/audio/ambient/background.mp3');
    game.load.audio('alert',                  'resources/audio/ambient/alert.mp3');
    game.load.audio('item_collect',           'resources/audio/ambient/item_collect.mp3');
    game.load.audio('item_throw',             'resources/audio/ambient/item_throw.mp3');

    game.load.audio('desert_round_start',     'resources/audio/desert/round_start.mp3');
    game.load.audio('desert_round_end',       'resources/audio/desert/round_end.mp3');

    game.load.audio('island_round_start',     'resources/audio/island/round_start.mp3');
    game.load.audio('island_round_end',       'resources/audio/island/round_end.mp3');

    game.load.audio('plane_round_start',      'resources/audio/plane/round_start.mp3');
    game.load.audio('plane_round_end',        'resources/audio/plane/round_end.mp3');

    game.load.audio('ship_sea_round_start',   'resources/audio/ship_sea/round_start.mp3');
    game.load.audio('ship_sea_round_end',     'resources/audio/ship_sea/round_end.mp3');

    game.load.audio('ship_space_round_start', 'resources/audio/ship_space/round_start.mp3');
    game.load.audio('ship_space_round_end',   'resources/audio/ship_space/round_end.mp3');

    game.load.audio('attack_bottle',          'resources/audio/weapons/attack_bottle.mp3');
    game.load.audio('attack_dagger',          'resources/audio/weapons/attack_dagger.mp3');
    game.load.audio('attack_fists',           'resources/audio/weapons/attack_fists.mp3');
    game.load.audio('attack_gun',             'resources/audio/weapons/attack_gun.mp3');
    game.load.audio('attack_tesla',           'resources/audio/weapons/attack_tesla.mp3');

    game.stage.disableVisibilityChange = true;

}

function create() {
    attackTimer = game.time.create(false);
    attackTimer.start();
    levelGroup = game.add.group();
    UIGroup = game.add.group();
    socket = new WebSocket(wsAddress);
    socket.onopen = socketOpen;
    socket.onclose = socketClose;
    socket.onmessage = socketMessage;
    cursors = game.input.keyboard.createCursorKeys();
    keyboard = game.input.keyboard;
    keyboard.addKeyCapture([87, 65, 83, 68]);

    background   = game.add.audio('background');
    alert        = game.add.audio('alert');
    item_collect = game.add.audio('item_collect');
    item_throw   = game.add.audio('item_throw');
    background.play('');

    winnerElement.hide();
}

var w = 87;
var s = 83;
var a = 65;
var d = 68;

var q = 81;
var e = 69;

var m = 77;

var hasPressedQ = false;
var hasPressedE = false;
var hasPressedM = false;

function update() {
    if (state == 'lobby') {
        updateLobby();
    } else if (state == 'game') {
        updateGame();
    } else if (state == 'end') {
        updateEnd();
    }
}

function updateLobby() {
    var playersElement = lobbyElement.find('#players');
    playersElement.html('');

    keys = Object.keys(players);
    for (var i = 0; i < keys.length; i++) {
        playersElement.append('<ul>' + players[keys[i]].playerName + '</ul>');
    }
}

var timeBetweenAttacks = 1;


function updateGame() {
    lobbyElement.hide();

    var mute = keyboard.isDown(m);

    var up = keyboard.isDown(w);
    var down = keyboard.isDown(s);
    var left = keyboard.isDown(a);
    var right = keyboard.isDown(d);

    var direction = '';

    if (up) { direction += 'up'; }
    if (down) { direction += 'down'; }
    if (left) { direction += 'left'; }
    if (right) { direction += 'right'; }

    var x = game.input.mousePointer.worldX;
    var y = game.input.mousePointer.worldY;

    var angle = 0;

    if (keyboard.isDown(q) && !hasPressedQ){
        sendMessage({type: "throw_left"});
        hasPressedQ = true;
    }else if(!keyboard.isDown(q)){
        hasPressedQ = false
    }

    if(keyboard.isDown(e) && !hasPressedE){
        sendMessage({type: "throw_right"});
        hasPressedE = true;
    } else if(!keyboard.isDown(e)){
        hasPressedE = false
    }

    if(game.input.mousePointer.isDown && attackTimer.seconds > timeBetweenAttacks){
        attackTimer.stop();
        attackTimer.start();
        console.log("attacked");
    }
    if (mute && !hasPressedM) {
        game.sound.mute = !game.sound.mute;
        hasPressedM = true;
    } else if (!mute) {
        hasPressedM = false;
    }

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

function updateEnd() {
    winnerElement.text(self.players[winner].playerName);
}

function sendMessage(message) {
    if (!socketReady) {
        return;
    }

    var jsonText = JSON.stringify(message);
    socket.send(jsonText);
}

