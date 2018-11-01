//Client side

var w_canvas = 900;
var h_canvas = 600;
var FPS = 60;

var player_wingspan = 16;
var player_height = 16;

var socket = io();
var socket_id;

var context = document.querySelector("canvas").getContext('2d');
context.canvas.width = w_canvas;
context.canvas.height = h_canvas;

socket.emit('joining');
console.log()

setInterval(function () {
  //console.log('processing');
  let movement = controller.movement();
  //console.log(movement);
  socket.emit('movement', movement);
}, 1000 / FPS)


socket.on('connect', () => {
  socket_id = socket.id;
});

socket.on('update', function (players) {

  context.clearRect(0, 0, w_canvas, h_canvas);
  //Background
  context.fillStyle = "#000000";
  context.fillRect(0, 0, w_canvas, h_canvas);

  for (var id in players) {
    let player = players[id].player.state;
    //console.log(parseInt(player.x), parseInt(player.y), player.direction);
    Player_Print(parseInt(player.x), parseInt(player.y), player.direction);
  }
  //let this_player = players[this_id].player.state;
  //Player_Print(parseInt(player.x), parseInt(player.y), player.direction, '#ffffff');
});

var controller = {

  forward: false,
  left: false,
  right: false,
  shooting: false,

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
        if (shooting_state && !gameover) bullets.push(new Bullet(player.x, player.y, player.direction));
        console.log(bullets);
        break;
      case 13:
        if (gameover && !key_state) Reset();
    }
  },

  movement: function () {
    return [controller.forward, controller.left, controller.right, controller.shooting];
  }

}

function Player_Print(x, y, direction, color = "#0000ff") {

  //console.log('print', x, y, direction);

  context.fillStyle = color;

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
  context.translate(-x, -y); //Makes the coords absolute again

}

document.addEventListener("keydown", controller.keyListener);
document.addEventListener("keyup", controller.keyListener);