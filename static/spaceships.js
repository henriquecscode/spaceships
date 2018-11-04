//Client side

var context;

var w_canvas = 900;
var h_canvas = 580;
var FPS = 60;

var player_wingspan = 16;
var player_height = 16;
var bullet_size = 2;
var bullet_delay = 100;
var name;

var socket = io();
var socket_id;

var gameover = false;
var gameover_text;
var gameover_text_width;

function Name() {
  console.log("running");
  name = document.getElementById("name").value;
  if (name) {
    console.log("Initializing");
    Initialize();
  }
}

function Initialize() {

  context = document.querySelector("canvas").getContext('2d');
  context.canvas.width = w_canvas;
  context.canvas.height = h_canvas;

  gameover_text = "Press ENTER to restart";
  context.font = "25px Arial";
  gameover_text_width = context.measureText(gameover_text).width;
  socket.emit('joining', name); //Say that we joined

  document.addEventListener("keydown", controller.keyListener);
  document.addEventListener("keyup", controller.keyListener);//Client side

  setInterval(function () { //Send to the server our inputs
    //console.log('processing');
    let movement = controller.movement();
    controller.shooting = false;
    //console.log(movement);
    //console.log(movement);
    socket.emit('movement', movement);
  }, 1000 / FPS)
}


socket.on('connect', () => { //When the server gets our answer it tells us the id
  socket_id = socket.id;
});

socket.on('update', function (players) { //When the server tells us the statee of the game

  context.clearRect(0, 0, w_canvas, h_canvas);
  //Background
  context.fillStyle = "#000000";
  context.fillRect(0, 0, w_canvas, h_canvas);

  for (var id in players) { //Go through all the players

    let player = players[id].player;
    let name = players[id].name;
    var color = "#0000ff";
    if (id === socket_id) color = "#ffffff";
    if (!player.state.gameover) Player_Print(parseInt(player.state.x), parseInt(player.state.y), player.state.direction, color, name); //Print the player
    Bullet_Print(player); //Print the bullets of that player
    if (id === socket_id && player.state.gameover) { //We were killed

      //console.log("we were destroyed");
      context.fillStyle = "#ffffff";
      context.font = "25px Arial";
      //context.fillText(total_score, w_canvas / 2 - total_score_width / 2, h_canvas / 2);
      context.fillText(gameover_text, w_canvas / 2 - gameover_text_width / 2, h_canvas / 2 + 30); //Gameover message
    }
  }

});

var controller = {

  forward: false,
  left: false,
  right: false,

  keyListener: function (event) {
    var key_state = event.type == "keydown" ? true : false;
    var shooting_state = event.type == "keyup" ? true : false;

    switch (event.keyCode) {
      case 65: //a key
        controller.left = key_state;
        break;
      case 87: //w key
        controller.forward = key_state;
        break;
      case 68: //d key
        controller.right = key_state;
        break;
      case 32: //Space key
        if (shooting_state) {
          socket.emit('shooting');
        }
        break;
      case 13:
        socket.emit('respawn');
        break;
    }
  },

  movement: function () {
    return [controller.forward, controller.left, controller.right];
  }

}

function Player_Print(x, y, direction, color = "#0000ff", name) {
  console.log(name);

  //console.log('print', x, y, direction);

  context.fillStyle = color;
  context.font = "10px Arial";
  name_width = context.measureText(name).width;

  //Draws the player
  context.translate(x, y); //Makes the coords relative to the center of the player
  context.rotate(direction); //Rotates the path that is going to be made
  context.beginPath();
  context.lineTo(-player_wingspan / 2, player_height / 2);
  context.lineTo(0, -player_height / 2);
  context.lineTo(player_wingspan / 2, player_height / 2);
  context.lineTo(0, player_height / 4);
  context.lineTo(-player_wingspan / 2, player_height / 2);
  context.fill();
  context.rotate(-direction); //Cancels the rotation

  //Draw the name
  context.fillStyle = "#ffffff";
  context.fillText(name, -name_width / 2, player_height, 40);

  context.translate(-x, -y); //Makes the coords absolute again

}

function Bullet_Print(player) {
  let bullets = player.bullets
  if (!bullets) return
  for (var bullet of bullets) {
    context.fillStyle = "#ff0000";
    context.beginPath();
    context.arc(bullet[0], bullet[1], bullet_size, 0, 2 * Math.PI);
    context.fill();
  }
}