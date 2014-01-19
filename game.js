/*jslint node: true */
'use strict';

var planetData = {},
    world,
    fieldWidth = 900,
    fieldHeight = 600,
    renderer = Physics.renderer('canvas', {
        el: 'gameCanvas',
        width: fieldWidth,
        height: fieldHeight,
        meta: false
    }),
    planetClearance = 5,
    viewportBounds = Physics.aabb(0, 0, 900, 600),
    playerWidth = 80,
    playerMargin = 10,
    player1xPos = playerMargin,
    player2xPos = fieldWidth - playerWidth - 2 * playerMargin,
    playerHeight = 30,
    numberOfPlanets = 4,
    minPlanSize = 30,
    maxPlanSize = 100,
    minPlanXPos = playerWidth + 2 * playerMargin,
    maxPlanXPos = fieldWidth - minPlanXPos,
    planPossibleFieldWidth = maxPlanXPos - minPlanXPos,
    turn = 0,
    planetCollection = [],
    yPos = [1, 1];

// extend the circle body
Physics.body('shot', 'circle', function (parent) {
    return {
        init: function (options) {
            var pThis = this;
            parent.init.call(this, options);
            this.gameType = 'shot';
            return this;
        },
        destroy: function () {
            world.removeBody(this);
        }
    };
});

Physics.body('player', 'convex-polygon', function (parent) {
    return {
        init: function (options) {
            var pThis = this;
            parent.init.call(this, options);
            this.gameType = 'player';
            
            return this;
        },
        destroy: function () {
            world.removeBody(this);
        }
    };
});

// This should be a behaviour that checks all shots, instead of a behaviour for each
// and every shot. But what can I do for now!
Physics.behavior('shot-behaviour', function (parent) {
    return {
        init: function (options) {
            var self = this,
                shot = self.shot = options.shot;
            // the shot will be passed in via the config options
            // so we need to store the shot
            parent.init.call(this, options);
            setTimeout(function () {
                self.destroy();
            }, 3000);
        },
        destroy: function () {
            this.shot.destroy();
            world.removeBehavior(this);
        },
        connect: function (world) {
            // we want to subscribe to world events
            world.subscribe('collisions:detected', this.checkShotCollision, this);
            world.subscribe('integrate:positions', this.behave, this);
        },
        disconnect: function (world) {
            // we want to unsubscribe from world events
            world.unsubscribe('collisions:detected', this.checkPlayerCollision);
            world.unsubscribe('integrate:positions', this.behave);
        },
        checkShotCollision: function (data) {
            var self = this,
                world = self._world,
                collisions = data.collisions,
                col,
                i,
                l,
                player = this.player;

            for (i = 0, l = collisions.length; i < l; i += 1) {
                col = collisions[i];

                // if one of these bodies is our shoot...
                if (col.bodyA === self.shot || col.bodyB === self.shot) {
                    if (col.bodyA.gameType === "player") {
                        col.bodyA.destroy();
                    }
                    if (col.bodyB.gameType === "player") {
                        col.bodyB.destroy();
                    }
                    self.shot.destroy();
                    world.removeBehavior(this);
                    
                    return;
                }
            }
        },
        behave: function (data) {
            
        }
    };
});

// Converts from degrees to radians.
Math.radians = function (degrees) {
    return degrees * Math.PI / 180;
};
 
// Converts from radians to degrees.
Math.degrees = function (radians) {
    return radians * 180 / Math.PI;
};


Physics.util.ticker.subscribe(
    function (time, dt) {
        world.step(time);
    }
);


function generatePlayers() {
    var player1,
        player2,
        i;
    for (i = 0; i < yPos.length; i += 1) {
        yPos[i] = Math.floor((Math.random() * (fieldHeight - playerHeight - 2 * playerMargin))) + playerMargin;
    }
    player1 = Physics.body('player', {
        x: player1xPos + (playerWidth / 2),
        y: yPos[0] + (playerHeight / 2),
        mass: 0.1,
        fixed: true,
        vertices : [
            { x: player1xPos, y: yPos[0] },
            { x: player1xPos, y: yPos[0] + playerHeight },
            { x: player1xPos  + playerWidth, y: yPos[0] + playerHeight },
            { x:  player1xPos + playerWidth, y: yPos[0] }
        ]
    });
    player2 = Physics.body('player', {
        x: player2xPos + (playerWidth / 2),
        y: yPos[1] + (playerHeight / 2),
        fixed: true,
        angle: -Math.PI,
        mass: 0.1,
        vertices : [
            { x: player2xPos, y: yPos[1] },
            { x: player2xPos, y: yPos[1] + playerHeight },
            { x: player2xPos  + playerWidth, y: yPos[1] + playerHeight },
            { x:  player2xPos + playerWidth, y: yPos[1] }
        ]
    });
    world.add(player1);
    world.add(player2);
}

function collision(xp, yp, rad) {
    var i,
        maxRadius,
        distance,
        curPlanet,
        returnValue = false;
    for (i = 0; i < planetCollection.length; i += 1) {
        curPlanet = planetCollection[i];
        maxRadius = curPlanet.rad + rad + planetClearance;
        distance = Math.sqrt(Math.pow((curPlanet.xp - xp), 2) + Math.pow((curPlanet.yp - yp), 2));
        if (distance <= maxRadius) {
            returnValue = true;
        }
    }
    return returnValue;
}

function generatePlanets() {
    var i = 0,
        newPlanetXPos,
        newPlanetYPos,
        newPlanetRadius,
        newPlanet;
    for (i = 0; i < numberOfPlanets; i += 1) {
        do {
            newPlanetRadius = Math.floor(Math.random() * (maxPlanSize - minPlanSize)) + minPlanSize;
            newPlanetXPos = Math.floor(Math.random() * (planPossibleFieldWidth - newPlanetRadius * 2)) + minPlanXPos + newPlanetRadius;
            newPlanetYPos = Math.floor(Math.random() * (fieldHeight - newPlanetRadius * 2)) + newPlanetRadius;
        } while (collision(newPlanetXPos, newPlanetYPos, newPlanetRadius));
        
        planetCollection.push({xp: newPlanetXPos, yp: newPlanetYPos, rad: newPlanetRadius});
        newPlanet = Physics.body('circle', {
            x: newPlanetXPos,
            y: newPlanetYPos,
            radius: newPlanetRadius,
            fixed: true,
            mass: newPlanetRadius / 15
        });
        newPlanet.gameType = "planet";
        world.add(newPlanet);
    }
}


function shoot(power, angle) {
    var newShoot, shootBehaviour;
    $("#shootButton").off('click');
    newShoot = Physics.body('shot', {
        x: ((playerMargin * 2) + playerWidth) + (turn * (fieldWidth - ((2 * playerWidth) + (5 * playerMargin)))),
        y: yPos[turn],
        radius: 4,
        mass: 2,
        vx: power * Math.cos(angle) * (1 - turn * 2),
        vy: power * Math.sin(angle)
    });
    shootBehaviour = Physics.behavior('shot-behaviour', {shot: newShoot});
    world.add([newShoot, shootBehaviour]);
    
    turn = (turn + 1) % 2;
    $("#shootButton").on('click', processShootClick);
}

function processShootClick() {
    var shootPower = parseInt($("#power").val(), 10) / 75,
        shootAngle = -Math.radians(parseInt($("#angle").val(), 10));
    shoot(shootPower, shootAngle);
}

function restartGame() {
    Physics.util.ticker.stop();
    $("#shootButton").off('click');
    if (world) {
        world.destroy();
    }
    world = Physics();
    world.add(Physics.behaviour('newtonian'));
    world.add(Physics.behaviour('sweep-prune'));
    world.add(Physics.behaviour('body-collision-detection'));
    world.add(Physics.behaviour('body-impulse-response'));
    world.add(renderer);
    world.add(Physics.behaviour('edge-collision-detection', {
        aabb: viewportBounds,
        restitution: 0.5,
        styles: {
                
        }
    }));
    generatePlayers();
    generatePlanets();
    Physics.util.ticker.start();
    $("#shootButton").on('click', processShootClick);
}



function redrawGame() {
    world.render();
    requestAnimationFrame(redrawGame);
}

requestAnimationFrame(redrawGame);

restartGame();