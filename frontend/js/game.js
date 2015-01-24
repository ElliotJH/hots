var floor = 0;
var wall = 1;

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

var tile_height = 20;
var tile_width = 20;

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

var myPlayer = -1;
var players = {};
var items = {};
var levelDefinitions={};
var stateDefinitions = {};

var socket;

var cursors;

function socketOpen(){};

function socketMessage(msg){
    var parsed = JSON.parse(msg.data);
    if(parsed.type == "world"){
        var world = parsed.world;

        for(var i = 0; i < world.length; i++){
            var row = world[i];
            for(var j = 0; j < row.length; j++){
                game.add.sprite(i*tile_width, j*tile_height, levelDefinitions[row[j]]);
            }
        }

    } else if(parsed.type == "tick"){
        var playerList = parsed.players;
        for(var i = 0; i < playerList.length; i++){
            var player = players[playerList[i].id];
            if(player){
                player.x = playerList[i].location[0];
                player.y = playerList[i].location[1];
            } else {
                players[playerList[i].id] = game.add.sprite(playerList[i].location[0],
                    playerList[i].location[1], 'player');
            }
        }
    }
};

function preload() {
    levelDefinitions[floor] = "floor";
    levelDefinitions[wall] = "wall";

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
    game.load.image('wall', 'resources/art/tile-wall.png', tile_width, tile_height);
    game.load.image('floor', 'resources/art/tile-metal.png', tile_width, tile_height);

    
}
var keyboard;
function create() {
    socket = new WebSocket("ws://10.7.3.119:9000");
    socket.onopen = socketOpen;
    socket.onmessage = socketMessage;
    cursors = game.input.keyboard.createCursorKeys();
    keyboard = game.input.keyboard;
    keyboard.addKeyCapture([87, 65, 83, 68]);
}

function update() {
    if (keyboard.isDown(65) && keyboard.isDown(83)){
        //  Move to the left
        var jsonText = JSON.stringify({type: "movement", direction: "upleft"});
        socket.send(jsonText);
    }else if (keyboard.isDown(68) && keyboard.isDown(83)){
        //  Move to the right
        var jsonText = JSON.stringify({type: "movement", direction: "upright"});
        socket.send(jsonText);
    } else if(keyboard.isDown(83) && keyboard.isDown(65)){
        var jsonText = JSON.stringify({type: "movement", direction: "downleft"});
        socket.send(jsonText);
    } else if(keyboard.isDown(83) && keyboard.isDown(68)){
        var jsonText = JSON.stringify({type: "movement", direction: "downright"});
        socket.send(jsonText);
    }else if (keyboard.isDown(65) ){
        //  Move to the left
        var jsonText = JSON.stringify({type: "movement", direction: "left"});
        socket.send(jsonText);
    }else if (keyboard.isDown(68)){
        //  Move to the right
        var jsonText = JSON.stringify({type: "movement", direction: "right"});
        socket.send(jsonText);
    } else if(keyboard.isDown(87)){
        var jsonText = JSON.stringify({type: "movement", direction: "up"});
        socket.send(jsonText);
    } else if(keyboard.isDown(83)){
        var jsonText = JSON.stringify({type: "movement", direction: "down"});
        socket.send(jsonText);
    }

    
}