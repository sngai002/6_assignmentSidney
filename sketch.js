/* DN3008 Generative Art, Ashley Hi 2026
 * Week 6 - Autonomous Agents
 * Boids
 */

let flock;

function setup() {
  createCanvas(1000, 1000); // *** change artwork size here

  background(10, 10, 20); // *** change background colour here

  // Add an initial set of boids into the system.
  flock = new Flock();
  for (let i = 0; i < 100; i++) {
    let b = new Boid(random(width), random(height));
    flock.addBoid(b);
  }
}

function draw() {

  if (key !== "s" && key !== "a" && key !== "c" && keyIsPressed) {
    background(10, 10, 20);
  }

  flock.run();

  // Instructions Text
  // *** comment to remove
  fill(255, 255, 255);
  stroke(255, 255, 255);
  textSize(16);
  textStyle(NORMAL);
  text("Click and hold for lines to follow mouse.", 50, 50);
  text("Press 's' for separation.", 50, 70);
  text("Press 'a' for alignment.", 50, 90);
  text("Press 'c' for cohesion.", 50, 110);
  text("Press any other key to clear effects.", 50, 130);
}

///////////////////////////////////////////////////////////////////
// Flock Object
// Manages the array of all the boids.
///////////////////////////////////////////////////////////////////

function Flock() {
  // Initialises an array for all the boids.
  this.boids = [];
}

Flock.prototype.run = function () {
  // Passing the entire list of boids to each boid individually.
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids);
  }
};

Flock.prototype.addBoid = function (b) {
  this.boids.push(b);
};

///////////////////////////////////////////////////////////////////
// Boid Class
// Manages all methods and properties of the boids.
///////////////////////////////////////////////////////////////////

// Create main properties of boid.
function Boid(x, y) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = 4.0;
  this.maxSpeed = 3;
  this.maxForce = 0.3;
}

function keyPressed() {
  if (key !== "s" && key !== "a" && key !== "c") {
    background(10, 10, 20); // *** same colour as setup()
  }
}

// Run all other boid methods.
Boid.prototype.run = function (boids) {
  this.flock(boids);
  this.update();
  this.borders();
  this.render();
};

// Applies all forces for extra effects.
Boid.prototype.applyForce = function (force) {
  this.acceleration.add(force);
};

// Accumulates a new acceleration each time based on 4 rules.
Boid.prototype.flock = function (boids) {
  let sep = this.separate(boids); // Separation
  let ali = this.align(boids); // Alignment
  let coh = this.cohesion(boids); // Cohesion
  let fol = this.mouse(boids); // Follow Mouse

  // Arbitrarily weight these forces.
  sep.mult(1.0);
  ali.mult(1.0);
  coh.mult(1.0);
  // Specially weighted (<1) so lines subtly follow the mouse and do not immediately race to the mouse position.
  fol.mult(0.4);

  // Add the force vectors to acceleration based on conditions.
  if (key == "s") this.applyForce(sep);
  else if (key == "a") this.applyForce(ali);
  else if (key == "c") this.applyForce(coh);
  else;
  this.applyForce(fol);
};

// Update location.
Boid.prototype.update = function () {
  this.velocity.add(this.acceleration);
  this.velocity.limit(this.maxSpeed);
  this.position.add(this.velocity);

  // For aesthetic effect only. Draws extra lines when momentum changes.
  push();
  stroke(0, 255, 255); // *** change line colour here
  strokeWeight(0.3); // *** change line weight here
  line(
    this.acceleration.x * 70 + this.position.x,
    this.acceleration.y * 70 + this.position.y,
    this.position.x,
    this.position.y
  );
  pop();

  // Reset accelertion to 0 each cycle.
  this.acceleration.mult(0);
};

// Calculates and applies a steering force towards a target.
Boid.prototype.seek = function (target) {
  // A vector pointing from the location to the target.
  let desired = p5.Vector.sub(target, this.position);

  // Normalize desired and scale to maximum speed.
  desired.normalize();
  desired.mult(this.maxSpeed);

  // Steering = Desired minus Velocity.
  let steer = p5.Vector.sub(desired, this.velocity);

  // Limit to maximum steering force.
  steer.limit(this.maxForce);
  return steer;
};

// Displays boids to canvas.
Boid.prototype.render = function () {
  let theta = this.velocity.heading() + PI / 2;
  fill(255, 0, 255); // *** change boid fill colour here
  stroke(255, 0, 255); // *** change boid outline colour here
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  triangle(-this.r, this.r * 2, this.r, this.r * 2, 0, -this.r * 2);
  pop();
};

// Checks borders to exit and continue from opposite side.
Boid.prototype.borders = function () {
  if (this.position.x < -this.r) this.position.x = width + this.r;
  if (this.position.y < -this.r) this.position.y = height + this.r;
  if (this.position.x > width + this.r) this.position.x = -this.r;
  if (this.position.y > height + this.r) this.position.y = -this.r;
};

///////////////////////////////////////////////////////////////////
// Rules of Flocking
///////////////////////////////////////////////////////////////////

// Separation
// Checks for nearby boids and steers away.
Boid.prototype.separate = function (boids) {
  let desiredSeparation = 100;

  let steer = createVector(0, 0);
  let count = 0;

  // For every boid in the system, check if it's too close.
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);

    if (d > 0 && d < desiredSeparation) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      steer.add(diff);
      count++;
    }
  }

  if (count > 0) {
    stroke(255, 20, 147, 40); // *** change line colour here
    strokeWeight(0.015);
    line(
      steer.x + this.position.x,
      steer.y + this.position.y,
      this.position.x,
      this.position.y
    );
    steer.div(count);
  }

  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxSpeed);
    steer.sub(this.velocity);
    steer.limit(this.maxForce);
  }

  return steer;
};

// Alignment
// For every nearby boid in the system, calculate the average velocity.
Boid.prototype.align = function (boids) {
  let neighbordist = 50;

  let sum = createVector(0, 0);
  let count = 0;

  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if (d > 0 && d < neighbordist) {
      sum.add(boids[i].velocity);
      count++;
    }
  }

  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxSpeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxForce);
    return steer;
  } else {
    return createVector(0, 0);
  }
};

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location.
Boid.prototype.cohesion = function (boids) {
  let neighbordist = 50;

  let sum = createVector(0, 0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if (d > 0 && d < neighbordist) {
      sum.add(boids[i].position);
      count++;
    }
  }

  if (count > 0) {
    sum.div(count);
    return this.seek(sum); // Steer towards the location.
  } else {
    return createVector(0, 0);
  }
};

// Follow Mouse
// Steers all boids to mouse position when mouse is pressed.
Boid.prototype.mouse = function (boids) {
  if (mouseIsPressed) return this.seek(createVector(mouseX, mouseY));
  else return createVector(0, 0);
};