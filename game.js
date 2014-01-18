/*jslint node: true */
'use strict';

var planetData = {},
    world,
    newtonianBehaviour = Physics.behaviour('newtonian'),
    fieldWidth = 900,
    fieldHeight = 600,
    renderer = Physics.renderer('canvas', {
        el: 'gameCanvas',
        width: fieldWidth,
        height: fieldHeight,
        meta: false
    }),
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
    turn = 1,
    planetCollection = [];

Physics.util.ticker.subscribe(
    function (time, dt) {
        world.step(time);
        world.render();
    }
);


function generatePlayers() {
    var yPos1 = Math.floor((Math.random() * (fieldHeight - playerHeight - 2 * playerMargin))) + playerMargin,
        yPos2 = Math.floor((Math.random() * (fieldHeight - playerHeight - 2 * playerMargin))) + playerMargin,
        player1,
        player2;
    player1 = Physics.body('convex-polygon', {
        x: player1xPos + (playerWidth / 2),
        y: yPos1 + (playerHeight / 2),
        fixed: true,
        vertices : [
            { x: player1xPos, y: yPos1 },
            { x: player1xPos, y: yPos1 + playerHeight },
            { x: player1xPos  + playerWidth, y: yPos1 + playerHeight },
            { x:  player1xPos + playerWidth, y: yPos1 }
        ]
    });
    player2 = Physics.body('convex-polygon', {
        x: player2xPos + (playerWidth / 2),
        y: yPos2 + (playerHeight / 2),
        fixed: true,
        angle: -Math.PI,
        vertices : [
            { x: player2xPos, y: yPos2 },
            { x: player2xPos, y: yPos2 + playerHeight },
            { x: player2xPos  + playerWidth, y: yPos2 + playerHeight },
            { x:  player2xPos + playerWidth, y: yPos2 }
        ]
    });
    world.add(player1);
    world.add(player2);
}

function collision(xp, yp, rad) {
    var i,
        maxRadius,
        distance,
        curPlanet;
    for (i = 0; i < planetCollection.length; i++) {
        curPlanet = planetCollection[i];
        maxRadius = Math.max(curPlanet.rad, rad);
        distance = Math.sqrt(Math.pow((curPlanet.xp - xp), 2) + Math.pow((curPlanet.yp - yp), 2));
        if (distance <= maxRadius) { return true; }
    }
    return false;
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
            
        // TODO detect collision with existing planets
        } while (collision(newPlanetXPos, newPlanetYPos, newPlanetRadius));
        planetCollection.push({xp: newPlanetXPos, yp: newPlanetYPos, rad: newPlanetRadius});
        newPlanet = Physics.body('circle', {
            x: newPlanetXPos,
            y: newPlanetYPos,
            radius: newPlanetRadius,
            fixed: true,
            mass: newPlanetRadius * 2
        });
        world.add(newPlanet);
    }
}

function restartGame() {
    Physics.util.ticker.stop();
    if (world) {
        world.destroy();
    }
    world = Physics();
    world.add(newtonianBehaviour);
    world.add(renderer);
    world.add(Physics.behavior('edge-collision-detection', {
        aabb: viewportBounds,
        restitution: 0.5,
        styles: {
                
        }
    }));
    generatePlayers();
    generatePlanets();
    Physics.util.ticker.start();
}

restartGame();