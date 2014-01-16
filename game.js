
var planetData = {};

function nextFrame() {
    requestAnimationFrame(nextFrame);
}

function startGame() {
    var gameCanvas = $("#gameCanvas"),
        world = Physics(),
        newtonianBehaviour = Physics.behaviour('newtonian');
    world.add(newtonianBehaviour);
    requestAnimationFrame(nextFrame);
}
