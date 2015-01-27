//var wsAddress = "ws://10.7.3.119:9000";
//var wsAddress = "ws://10.7.3.103:9000";
//var wsAddress = "ws://10.7.3.101:9000";
//var wsAddress = "ws://192.168.54.51:9000";
var wsAddress = "ws://127.0.0.1:9000";

var tile_height = 40;
var tile_width = 40;
var item_height = 100;
var item_width = 100;

var itemOneX = 50;
var itemOneY = 450;

var itemTwoX = 650;
var itemTwoY = 450;

var wantedOne = [275, 25];
var wantedTwo = [425, 25];

var itemArrayX = [itemOneX, itemTwoX];
var itemArrayY = [itemOneY, itemTwoY];

var scenarioTypes = {
    'ship': 36,
    'spaceship': 37,
    'plane': 38,
    'tropical_island': 39,
    'desert': 41
}

var scenarioToIndex = {
    36: 0,
    37: 1,
    38: 2,
    39: 3,
    41: 4
}

var levelDefinitions = [{
        0: "floorShip",
        1: "wallShip",
        2: "exit",
        3: "floorShip"
    },
    {
        0: "floorSpace",
        1: "wallSpace",
        2: "exit",
        3: "floorSpace"
    },
    {
        0: "floor",
        1: "wall",
        2: "exit",
        3: "floor"
    },
    {
        0: "floorTropical",
        1: "wallTropical",
        2: "exit",
        3: "floorTropical"
    },
    {
        0: "floorDesert",
        1: "wallDesert",
        2: "exit",
        3: "floorDesert"
    }
];

var scenario;

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
    31: "bottle",
    32: "gun",
    33: "knife",
    34: "tesla"
};

var audio = [
    'background',
    'alert',
    'item_collect',
    'item_throw',
    'desert_round_start',
    'desert_round_end',
    'island_round_start',
    'island_round_end',
    'plane_round_start',
    'plane_round_end',
    'ship_sea_round_start',
    'ship_sea_round_end',
    'ship_space_round_start',
    'ship_space_round_end',
    'attack_bottle',
    'attack_dagger',
    'attack_fists',
    'attack_gun',
    'attack_tesla'
];

/*
    Game
*/
var myPlayer;
var players = {};
var timeoutTexts = {};
var items = {};
var held = [];
var heldIDs = [30,30];

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
var backgroundStarted = false;
var backgroundStopped = false;
var startTick = 0;
var currentTick = 0;
var tickRate = 0.030; //30ms between ticks
var timeInSeconds = 0;
var minuteWarningPlayed = false;
var timerText;
var timeLimit = 120; //2 minutes
var audioDecoded = false;

var state = 'lobby'; // {lobby, game, end}

var lineCanvas;
var lines= [];
/*
    Audio
*/
var background;
var alert;
var item_collect;
var item_throw;

var startSound = [];
var endSound = [];
var attackSound = [];

/*
    Game
*/
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

function minuteWarning() {
    alert.play('');
}

// Call this passing stateDefinitions[weaponID]
function onAttack(weapon) {
    attackSound[weapon].play('');
}

// Call this passing scenarioTypes.<scenarioName>
function playStart(scenario) {
    startSound[scenario].play('');
}

// Call this passing scenarioTypes.<scenarioName>
function playEnd(scenario) {
    endSound[scenario].play('');
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
        console.log(parsed);
        var world = parsed.world;

        scenario = parsed.world_id;

        var defs = levelDefinitions[scenarioToIndex[scenario]];

        for(var i = 0; i < world.length; i++) {
            var row = world[i];

            for(var j = 0; j < row.length; j++) {

                var ob = levelGroup.create(j*tile_width, i*tile_height, defs[row[j]]);
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
        currentTick = parsed.tick;
        var tickDiff = currentTick - startTick;
        timeInSeconds = Math.floor(tickDiff * tickRate);
        if (timeInSeconds % 60 == 0 && timeInSeconds > 0 && !minuteWarningPlayed && state == 'game' && timeLimit - timeInSeconds >= 0) {
            minuteWarning();
            minuteWarningPlayed = true;
        } else if (timeInSeconds % 60 != 0) {
            minuteWarningPlayed = false;
        }
        if (timerText) {
            updateTimer();
        }
        if (timeLimit - timeInSeconds == 0 && !backgroundStopped) {
            background.stop();
            playEnd(scenario);
            backgroundStopped = true;

            for(var p in players){
              p.tint = 0X222222;
            }

        }

        var playerList = parsed.players;
        var ids = [];
        for(var i = 0; i < playerList.length; i++) {
            var player = players[playerList[i].id];
            ids.push(playerList[i].id.toString());
            if (player) {
                player.x = playerList[i].location[0];
                player.y = playerList[i].location[1];
                player.p.rotation = playerList[i].location[2];
                players[playerList[i].id].playerName = playerList[i].name;

                if(playerList[i].timeout > 0){
                  timeoutTexts[playerList[i].id].visible = true;
                  timeoutTexts[playerList[i].id].setText(Math.round(playerList[i].timeout));
                } else {
                  timeoutTexts[playerList[i].id].visible = false;
                }

            } else {
                players[playerList[i].id] = game.add.group();
                players[playerList[i].id].x = playerList[i].location[0];
                players[playerList[i].id].y = playerList[i].location[1];
                var p = players[playerList[i].id].create(0, 0, 'player');
                p.pivot = new PIXI.Point(tile_width/2, tile_height/2);
                players[playerList[i].id].playerName = playerList[i].name;
                players[playerList[i].id].p = p;
                var fontStyle = { fontSize: '2px', fill: '#FFFFFF' };
                var text = new Phaser.Text(game, -20, -40, '', fontStyle);
                text.font = 'Fira Mono';
                text.visible = false;

                var textName = new Phaser.Text(game, -10, -60, playerList[i].name, fontStyle);
                textName.font = 'Fira Mono';

                timeoutTexts[playerList[i].id] = text;
                players[playerList[i].id].add(text);
                players[playerList[i].id].add(textName);
            }
        }
        var keys = Object.keys(players);
        for(var i = 0; i < keys.length; i++) {
            if (ids.indexOf(keys[i]) == -1) {
                players[keys[i]].removeAll(true);
                delete players[keys[i]];
            }
        }

        if(typeof parsed.items != 'undefined') {
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
        } else if (typeof parsed.item_diff != 'undefined') {
            var itemList = parsed.item_diff;
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

            var deleted_items = parsed.deleted_items
            for(var i = 0; i < deleted_items.length; i++) {
                items[deleted_items[i].id].kill();
                delete items[deleted_items[i].id];
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
        if (state == 'game' && parsed.tick && startTick == 0) {
            startTick = parsed.tick;
        } else if (state == 'end'){
            levelGroup.removeAll(true);
            held[0].kill();
            held[1].kill();
            UIGroup.removeAll(true);
            levelGroup.removeAll(true);
            players = [];
            items = [];

            var fontStyle = { fontSize: '32px', fill: '#FFFFFF' };
            var timerFontStyle = { fontSize: '28px', fill: '#FF0000' };

            var itemText = new Phaser.Text(game, 325, 2, 'OBJECTIVES', fontStyle);
            timerText = new Phaser.Text(game, 640, 2, '00:00:00', timerFontStyle);

            itemText.font = 'Fira Mono';
            timerText.font = 'Fira Mono';

            UIGroup.add(itemText);
            UIGroup.add(timerText);
            UIGroup.create(itemOneX - 10, itemOneY - 5, 'pocket');
            UIGroup.create(itemTwoX - 10, itemTwoY - 5, 'pocket');
        }
    } else if (parsed.type == 'starting') {
        lobbyElement.find('#title').text("Starting...");
    } else if (parsed.type == 'winner') {
        winner = parsed.winner;
        console.log(winner);
    } else if(parsed.type == 'attack'){
        lines.push({player: players[parsed.player], angle: parsed.angle, range: parsed.range});
    }
};

function attack(startX, startY, angle, range){

    var x = startX - UIGroup.x;
    var y = startY - UIGroup.y;

    var anglePolar = angle - (Math.PI / 2);


    lineCanvas.ctx.moveTo(x, y);

    lineCanvas.ctx.lineTo(x + (range * Math.cos(anglePolar)), y + (range * Math.sin(anglePolar)));

    console.log("drawing attack");

}

function preload() {
    game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

    game.load.image('player','resources/art/human-2.png', tile_width, tile_height);
    game.load.image('wall', 'resources/art/wall_tiles/tile-wall-40.png', tile_width, tile_height);
    game.load.image('floor', 'resources/art/floor_tiles/tile-floor-40.png', tile_width, tile_height);
    game.load.image('exit', 'resources/art/floor_tiles/tile-exit-40.png', tile_width, tile_height);
    game.load.image('floorShip', 'resources/art/floor_tiles/wood_light.png', tile_width, tile_height);
    game.load.image('floorDesert', 'resources/art/floor_tiles/sand2.png', tile_width, tile_height);
    game.load.image('floorSpace', 'resources/art/floor_tiles/space.png', tile_width, tile_height);
    game.load.image('floorTropical', 'resources/art/floor_tiles/grass1.png', tile_width, tile_height);
    game.load.image('wallDesert', 'resources/art/wall_tiles/desert_wall.png');
    game.load.image('wallTropical', 'resources/art/floor_tiles/water.png');
    game.load.image('wallShip', 'resources/art/wall_tiles/ship_wall.png');
    game.load.image('wallSpace', 'resources/art/wall_tiles/space_wall.png');

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
    game.load.image('oxygen', 'resources/art/space/labeledcondom.png', item_width, item_height);

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
    game.load.image('tesla', 'resources/art/weapons/tesla-coil.png', item_width, item_height);
    game.load.image('knife', 'resources/art/weapons/plain-dagger.png', item_width, item_height);
    game.load.image('bottle', 'resources/art/weapons/broken-bottle.png', item_width, item_height);

    game.load.image('item-ground', 'resources/art/item-ground.png');
    game.load.image('pocket', 'resources/art/pocket.png');

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
    checkLoaded();
}

function checkLoaded() {
    audioDecoded = true;
    for (var i = audio.length - 1; i >= 0; i--) {
        if (!game.cache.isSoundDecoded(audio[i])) {
            audioDecoded = false;
        }
    };
    if (!audioDecoded) {
        setTimeout(checkLoaded, 1000);
    } else {
        console.log("Audio loaded");
    }
}

function create() {
    if (!audioDecoded) {
        setTimeout(create, 1000);
        return;
    }

    levelGroup = game.add.group();
    UIGroup = game.add.group();

    lineCanvas = game.add.bitmapData(800,600);
    UIGroup.create(0,0,lineCanvas);


    var fontStyle = { fontSize: '32px', fill: '#FFFFFF' };
    var timerFontStyle = { fontSize: '28px', fill: '#FF0000' };

    var itemText = new Phaser.Text(game, 325, 2, 'OBJECTIVES', fontStyle);
    timerText = new Phaser.Text(game, 640, 2, '00:00:00', timerFontStyle);

    itemText.font = 'Fira Mono';
    timerText.font = 'Fira Mono';

    UIGroup.add(itemText);
    UIGroup.add(timerText);
    UIGroup.create(itemOneX - 10, itemOneY - 5, 'pocket');
    UIGroup.create(itemTwoX - 10, itemTwoY - 5, 'pocket');

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

    startSound[scenarioTypes.desert]          = game.add.audio('desert_round_start');
    startSound[scenarioTypes.tropical_island] = game.add.audio('island_round_start');
    startSound[scenarioTypes.plane]           = game.add.audio('plane_round_start');
    startSound[scenarioTypes.ship]            = game.add.audio('ship_sea_round_start');
    startSound[scenarioTypes.spaceship]       = game.add.audio('ship_space_round_start');

    endSound[scenarioTypes.desert]          = game.add.audio('desert_round_end');
    endSound[scenarioTypes.tropical_island] = game.add.audio('island_round_end');
    endSound[scenarioTypes.plane]           = game.add.audio('plane_round_end');
    endSound[scenarioTypes.ship]            = game.add.audio('ship_sea_round_end');
    endSound[scenarioTypes.spaceship]       = game.add.audio('ship_space_round_end');

    attackSound[stateDefinitions[30]] = game.add.audio('attack_fists');
    attackSound[stateDefinitions[31]] = game.add.audio('attack_bottle');
    attackSound[stateDefinitions[32]] = game.add.audio('attack_gun');
    attackSound[stateDefinitions[33]] = game.add.audio('attack_dagger');
    attackSound[stateDefinitions[34]] = game.add.audio('attack_tesla');

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
var line;
var clickedLastFrame = false;
function updateGame() {
    lobbyElement.hide();

    if (!backgroundStarted) {
        playStart(scenario);
        background.play('');
        backgroundStarted = true;
    }

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

    if(game.input.mousePointer.isDown && !clickedLastFrame){

        sendMessage({type: 'attack'});

    }

    clickedLastFrame = game.input.mousePointer.isDown;

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

        players[myPlayer].p.rotation = angle;

    }

    lineCanvas.ctx.beginPath();
    lineCanvas.ctx.strokeStyle = "red";
    lineCanvas.ctx.clearRect(0,0,800,600);
    lineCanvas.ctx.stroke();

    lineCanvas.ctx.beginPath();
    lineCanvas.ctx.strokeStyle = "red";

    var toKeep = [];
    for(var i = 0; i < lines.length; i++){

        lines[i].ttl -= game.time.elapsed;

        if(lines[i].ttl > 0){
            attack(lines[i].player.x, lines[i].player.y, lines[i].angle, lines[i].range);
            toKeep.push(lines[i]);
        }

    }
    lineCanvas.ctx.lineWidth = 2;
    lineCanvas.ctx.stroke();
    lineCanvas.dirty = true;
    lines = toKeep;

    sendMessage({type: "movement", direction: direction, angle: angle});

}

function updateEnd() {
    winnerElement.text(winner);
}

function sendMessage(message) {
    if (!socketReady) {
        return;
    }

    var jsonText = JSON.stringify(message);
    //console.log(jsonText);
    socket.send(jsonText);
}

function updateTimer() {
    var minutes = Math.max(Math.floor((timeLimit - timeInSeconds) / 60) % 60, 0);
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    var seconds = Math.max((timeLimit - timeInSeconds) % 60, 0);
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    timerText.setText("00:"+minutes+":"+seconds);
}

WebFontConfig = {

    //  The Google Fonts we want to load
    google: {
      families: ['Fira Mono']
    }

};
