export class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  getLength() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  add(vec2: Vector2) {
    this.x += vec2.x;
    this.y += vec2.y;

    return this;
  }

  multiply(value: number) {
    this.x *= value;
    this.y *= value;

    return this;
  }

  subtract(vec2: Vector2) {
    this.x -= vec2.x;
    this.y -= vec2.y;

    return this;
  }

  normalize() {
    const x = this.x / this.getLength();
    const y = this.y / this.getLength();

    this.x = x;
    this.y = y;

    return this;
  }

  static subtract(vec1: Vector2, vec2: Vector2) {
    return new Vector2(vec1.x, vec1.y).subtract(vec2);
  }

  static normalize(vec: Vector2) {
    const x = vec.x / vec.getLength();
    const y = vec.y / vec.getLength();

    return new Vector2(x, y);
  }
}

export class Particle {
  position: Vector2;
  velocity: Vector2;
  prevPoisitons: Vector2[];
  friction: number;

  constructor(position: Vector2) {
    this.position = position;
    this.velocity = new Vector2(0, 0);
    this.prevPoisitons = [];
    this.friction = 1.001;
  }

  addForce(x: number, y: number) {
    this.velocity.x += x;
    this.velocity.y += y;
  }

  move() {
    this.position.add(this.velocity.multiply(1 / this.friction));
  }
}
