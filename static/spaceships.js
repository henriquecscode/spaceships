//Client side

var w_canvas = 900;
var h_canvas = 600;
var FPS = 60;

var player_wingspan = 16;
var player_height = 16;
var bullet_size = 2;
var bullet_delay = 100;

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
  controller.shooting = false;
  //console.log(movement);
  console.log(movement);
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

    let player = players[id].player;
    console.log(player);
    //console.log(parseInt(player.x), parseInt(player.y), player.direction);
    var color = "#0000ff";
    if (id === socket_id) color = "#ffffff";
    Player_Print(parseInt(player.state.x), parseInt(player.state.y), player.state.direction, color);
    Bullet_Print(player)
  }

});

var controller = {

  forward: false,
  left: false,
  right: false,
  is_shooting: false,
  hold_shooting: false,

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

        if (key_state){
          controller.is_shooting = true;
          controller.hold_shooting = controller.is_shooting && key_state; //Is hold shooting if was shooting and shot again
        }

        if(controller.hold_shooting){
          controller.is_shooting = false; //If is holding cannot shout
          hold = setTimeout(function(){
            controller.is_shooting= true;
          }, bullet_delay) //Can shot after the delay
        }

        if(shooting_state){
          clearTimeout(hold)
        }


        break;
      case 13:
        if (gameover && !key_state) Reset();
        break;
    }
  },

  movement: function () {
    return [controller.forward, controller.left, controller.right, controller.is_shooting];
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

document.addEventListener("keydown", controller.keyListener);
document.addEventListener("keyup", controller.keyListener);