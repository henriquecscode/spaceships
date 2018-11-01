//Server side

// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(5000, function () {
  console.log('Starting server on port 5000');
});


//Calculations

var w_canvas = 900;
var h_canvas = 600;
var FPS = 60;

var players = {};

turning_speed = 3 / 360 * 2 * Math.PI; //Affects the speed with which the player turns
forward_speed = 0.3;
bullet_speed = 5; //Affects the speed of the bullets
bullet_size = 2;
max_velocity = 2.5;
player_hitbox = 5;

// Add the WebSocket handlers
io.on('connection', function (socket) {

  socket.on('joining', function () {
    console.log('Connect from ' + socket.id);
    players[socket.id] = {
      player: new Player(),
      movement: [false,false,false],
    };

    socket.emit('id', socket.id); //Tells the client its id
  }
  )

  socket.on('disconnect', function(){
    console.log(socket.id + " Disconnected");
    delete players[socket.id];
  });

  socket.on('movement', function (movement) {
    //console.log('calculating');
    var player = players[socket.id] || {};
    //console.log(player.player)
    player.movement = movement;
    if (player.player) {
      //console.log(movement);
      player.player.movement(movement[0], movement[1], movement[2]);
      //console.log(player.player.state.x, player.player.state.y, player.player.state.direction);
    }
  })
});

setInterval(function () {
  //console.log('emiting');
  //console.log(players);
  for(var id in players){
    let player = players[id];
    if(player) player.player.movement(player.movement[0], player.movement[1], player.movement[2]);
  }
  io.sockets.emit('update', players);
}, 1000 / FPS);

class Player {

  constructor() {
    this.state = {
      x: w_canvas / 2,
      y: h_canvas / 2,
      direction: 0,
    }
    this.velocity = 0;
    this.velocity_direction = 0;

  }

  movement(forward, left, right) {

    var x_velocity = 0;
    var y_velocity = 0;

    if (forward) {
      let last_y_velocity = this.velocity * -Math.cos(this.velocity_direction);
      let last_x_velocity = this.velocity * Math.sin(this.velocity_direction);
      let now_y_velocity = forward_speed * -Math.cos(this.state.direction);
      let now_x_velocity = forward_speed * Math.sin(this.state.direction);
      let y_velocity = last_y_velocity + now_y_velocity;
      let x_velocity = last_x_velocity + now_x_velocity;

      //console.log(last_x_velocity, last_y_velocity, now_x_velocity, now_y_velocity, x_velocity, y_velocity);

      this.velocity = Math.sqrt(Math.pow(x_velocity, 2) + Math.pow(y_velocity, 2));

      //Gets the direction from the tan using the atan2 function
      this.velocity_direction = Math.atan2(y_velocity, x_velocity) + Math.PI / 2;

    }

    if (left) {
      this.state.direction -= turning_speed;
      if (this.state.direction < 0) {
        this.state.direction += 2 * Math.PI;
      }
    }

    if (right) {
      this.state.direction += turning_speed;
      if (this.state.direction > 2 * Math.PI) {
        this.state.direction -= 2 * Math.PI;
      }
    }

    y_velocity = this.velocity * -Math.cos(this.velocity_direction);
    x_velocity = this.velocity * Math.sin(this.velocity_direction);

    if (this.velocity > max_velocity) {
      this.velocity -= forward_speed; //Friction to prevent infinite growth
    }

    this.state.x = (this.state.x + w_canvas + x_velocity) % w_canvas;
    this.state.y = (this.state.y + h_canvas + y_velocity) % h_canvas;
  }
}