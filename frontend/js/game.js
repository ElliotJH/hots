var wsAddress = "ws://10.7.3.119:9000";

var floor = 0;
var wall = 1;
var exit = 2;
var start_tile = 3;

var ship = 36;
var spaceship = 37;
var plane = 38;
var tropicalIsland = 39;
var arctic = 40;
var desert = 41;

var lifeRing = 0;
var rope = 1;
var raincoat = 2;
var sextant = 3;
var anchor = 4;

var spacehelmet = 5;
var oxygen = 6;
var jetpack = 7;
var alien = 8;
var phaser = 9;

var parachute = 10;
var landingGear = 11;
var breathingMask = 12;
var suitcase = 13;
var passport = 14;

var cocktail = 15;
var beachball = 16;
var trunks = 17;
var desertIslandDisc = 18;
var pineapple = 19;

var penguin = 20;
var snowman = 21;
var pole = 22;
var santa = 23;
var scarf = 24;

var palmTree = 25;
var camel = 26;
var waterBottle = 27;
var bucket = 28;
var duneBuggy = 29;

var fists = 30;
var spoon = 31;
var gun = 32;
var knife = 33;
var nailBoard = 34;
var taser = 35;

var tile_height = 40;
var tile_width = 40;

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

var myPlayer = -1;
var players = {};
var items = {};
var levelDefinitions={};
var stateDefinitions = {};
var keyboard;
var socket;
var socketReady = false;
var worldInit = false;
var cursors;

function socketOpen(){
    socketReady = true;
}

function socketClose(){
    socketReady = false;
}

function socketMessage(msg){
    var parsed = JSON.parse(msg.data);

    if(parsed.type == "world"){
        var world = parsed.world;
        for(var i = 0; i < world.length; i++){
            var row = world[i];
            for(var j = 0; j < row.length; j++){
                game.add.sprite(j*tile_width, i*tile_height, levelDefinitions[row[j]]);
            }
        }
        worldInit = true;
        myPlayer = parsed.id;
        game.camera.bounds = null;
    } else if(parsed.type == "tick" && worldInit){
        var playerList = parsed.players;
        var ids = [];
        for(var i = 0; i < playerList.length; i++){
            var player = players[playerList[i].id];
            ids.push(playerList[i].id.toString());
            if(player){
                player.x = playerList[i].location[0];
                player.y = playerList[i].location[1];
            } else {
                players[playerList[i].id] = game.add.sprite(playerList[i].location[0],
                    playerList[i].location[1], 'player');
            }
        }
        var keys = Object.keys(players);
        for(var i = 0; i < keys.length; i++){
            if(ids.indexOf(keys[i]) == -1){
                players[keys[i]].kill();
            }
        }
    }
};

function preload() {
    levelDefinitions[floor] = "floor";
    levelDefinitions[wall] = "wall";
    levelDefinitions[exit] = "exit";
    levelDefinitions[start_tile] = "floor";

    stateDefinitions[fists] = "fists";
    stateDefinitions[spoon] = "spoon";
    stateDefinitions[gun] = "gun";
    stateDefinitions[knife] = "knife";
    stateDefinitions[nailBoard] = "nailBoard";

    stateDefinitions[penguin] = "penguin";
    stateDefinitions[snowman] = "snowman";
    stateDefinitions[pole] = "pole";
    stateDefinitions[santa] = "santa";
    stateDefinitions[scarf] = "scarf";

    stateDefinitions[palmTree] = "palmTree";
    stateDefinitions[camel] = "camel";
    stateDefinitions[waterBottle] = "waterBottle";
    stateDefinitions[bucket] = "bucket";
    stateDefinitions[duneBuggy] = "duneBuggy";

    stateDefinitions[cocktail] = "cocktail";
    stateDefinitions[beachball] = "beachball";
    stateDefinitions[trunks] = "trunks";
    stateDefinitions[desertIslandDisc] = "desertIslandDisc";
    stateDefinitions[pineapple] = "pineapple";

    stateDefinitions[taser] = "parachute";
    stateDefinitions[taser] = "landingGear";
    stateDefinitions[taser] = "breathingMask";
    stateDefinitions[taser] = "suitcase";
    stateDefinitions[taser] = "passport";

    stateDefinitions[spacehelmet] = "spacehelmet";
    stateDefinitions[oxygen] = "oxygen";
    stateDefinitions[jetpack] = "jetpack";
    stateDefinitions[alien] = "alien";
    stateDefinitions[phaser] = "phaser";

    stateDefinitions[lifeRing] = "lifeRing";
    stateDefinitions[rope] = "rope";
    stateDefinitions[raincoat] = "raincoat";
    stateDefinitions[sextant] = "sextant";
    stateDefinitions[anchor] = "anchor";


    game.load.image('player','resources/art/human.png', tile_width, tile_height);
    game.load.image('wall', 'resources/art/tile-wall-40.png', tile_width, tile_height);
    game.load.image('floor', 'resources/art/tile-floor-40.png', tile_width, tile_height);
    game.load.image('exit', 'resources/art/tile-exit-40.png', tile_width, tile_height);
}

function create() {
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

    if(myPlayer >= 0){
        var changeX  = x - players[myPlayer].x;
        var changeY = y - players[myPlayer].y;

        var toTan = changeY / changeX;

        angle = Math.atan(toTan);

        game.camera.x = players[myPlayer].x - 400;
        game.camera.y = players[myPlayer].y - 300;
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