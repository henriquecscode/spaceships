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
var h_canvas = 580;
var FPS = 60;

var players = {};

var turning_speed = 5 / 360 * 2 * Math.PI; //Affects the speed with which the player turns
var forward_speed = 0.3;
var bullet_speed = 5; //Affects the speed of the bullets
var bullet_size = 2;
var max_velocity = 3;
var player_hitbox = 5;

// Add the WebSocket handlers
io.on('connection', function (socket) {

  //When a new player joins
  socket.on('joining', function (name) {
    console.log('Connect from ' + socket.id + " as " + name);
    players[socket.id] = {
      name: name,
      player: new Player(),
      movement: [],
      shooting: false,
    };

    socket.emit('id', socket.id); //Tells the client its id
  }
  )

  //When a player leaves
  socket.on('disconnect', function () {
    console.log(socket.id + " Disconnected");
    delete players[socket.id];
  });

  //When a player sends an update of its inputs
  socket.on('movement', function (movement) {
    var player = players[socket.id] || {};
    player.movement = movement;
  });

  //When a players says that it is shooting
  socket.on('shooting', function () {
    players[socket.id].shooting = true;
  });

  //When a player is dead and wants to respawn
  socket.on('respawn', function () {
    var player = players[socket.id] || {};
    if (player) {
      if (player.player.state.gameover) { //If the player is dead and wants to respawn
        players[socket.id] = {
          player: new Player(),
          movement: [],
          shooting: false,
        };
      }
    }
  });
});

//Perfrom the update on everyone's positions
setInterval(function () {
  for (var id in players) { //For each player
    let player = players[id];

    if (player && !player.player.state.gameover) { //If found a player and he is not dead
      player.player.movement(player.movement[0], player.movement[1], player.movement[2], player.shooting); //Move the player according to his input
      if (player.shooting) player.shooting = false; //Already shot so cancel the next shooting
      player.player.shooting(); //Move the bullets

      for (var id_bullet in players) { //Go through all the players
        if (id_bullet !== id) { //It is not the player
          let player_bullet = players[id_bullet]; //Get the "enemy" with that id
          if (player_bullet) { //If found an enemy
            let bullets = player_bullet.player.bullets; //Get the bullets of that enemy
            for (var bullet of bullets) { //For each bullet that he has shot
              let was_shot = player.player.shot(bullet[0], bullet[1]); //See if the player was shot
              if (was_shot) {
                player.player.state.gameover = true;
                player.player.bullets = [[-1, -1, 0, 0]]; //Resets the bullets of the player that died

                //Deletes the bullet that shot us
                let idx = bullets.indexOf(bullet);
                if (idx !== -1) {
                  bullets.splice(idx, 1);
                  //console.log(bullets);
                }
              }
            }
          }
        }
      }
    }
    io.sockets.emit('update', players); //Send the info about all the players
  }
}, 1000 / FPS);


class Player {

  constructor() {
    this.state = {
      x: w_canvas / 2,
      y: h_canvas / 2,
      direction: 0,
      gameover: false,
    }
    this.velocity = 0;
    this.velocity_direction = 0;

    this.bullets = [[-1, -1, 0, 0]];
  }

  movement(forward, left, right, shooting) { //Depending on the player input calculate the new position and create or not a bullet

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

    //console.log("shooting is", shooting);
    if (shooting) {
      //console.log("wtf");
      var bullet_x = this.state.x
      var bullet_y = this.state.y
      var bullet_x_velocity = bullet_speed * Math.sin(this.state.direction) + x_velocity;
      var bullet_y_velocity = bullet_speed * -Math.cos(this.state.direction) + y_velocity;

      this.bullets.push([bullet_x, bullet_y, bullet_x_velocity, bullet_y_velocity]);
    }

    this.state.x = (this.state.x + w_canvas + x_velocity) % w_canvas;
    this.state.y = (this.state.y + h_canvas + y_velocity) % h_canvas;
  }

  shooting() { //Update all of the players bullets
    //console.log('shooting', this.bullets.length);
    if (this.bullets.length > 1) {
      for (var bullet of this.bullets) {
        bullet[0] += bullet[2];
        bullet[1] += bullet[3];

        let outofbonds = this.outofbondaries(bullet);
        if (outofbonds) {
          {
            //Deletes the bullet that got out of the screens
            let idx = this.bullets.indexOf(bullet);
            if (idx !== -1) {
              this.bullets.splice(idx, 1);
              //console.log(bullets);
            }
          }
        }
      }
    }
  }

  outofbondaries(bullet) { //Check if the bullet left the screen
    if (bullet[2] > 0 && bullet[0] > w_canvas) return true;
    if (bullet[2] < 0 && bullet[0] < 0) return true;
    if (bullet[3] < 0 && bullet[1] < 0) return true;
    if (bullet[3] > 0 && bullet[1] > h_canvas) return true;
  }

  shot(bullet_x, bullet_y) { //Check if a bullet collided with the player
    let x = this.state.x - bullet_x;
    let y = this.state.y - bullet_y;


    let distance = Math.sqrt(x * x + y * y);
    if (distance < player_hitbox + bullet_size) { //There as a collision
      return true;
    }
  }
}