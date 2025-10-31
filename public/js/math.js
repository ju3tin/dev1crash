
Vector = function (x,y) {
    this.x = x;
    this.y = y;
}
Vector.Zero = new Vector(0,0);
Vector.prototype.Versor = function () {
     var module = Math.sqrt((this.x**2) + (this.y**2));
     return new Vector(this.x / module,this.y / module);
}
Vector.prototype.ByScalar = function (scalar) {
    return new Vector(this.x * scalar,this.y * scalar);
}
Vector.prototype.Plus = function (another) {
    return new Vector(this.x + another.x,this.y + another.y);
}
Vector.prototype.Minus = function (another) {
    return new Vector(this.x - another.x,this.y - another.y);
}

Vector.prototype.Near = function (another,tolerance) {
    return Math.sqrt((another.x - this.x)**2 + (another.y - this.y)**2) < tolerance;
}

Vector.prototype.Dot = function (another) {
    return (this.x * another.x) + (this.y * another.y);
}
Vector.prototype.ZCross = function(another) {
    /*
    this            other
                                      [  i   j  k ]
    [ u1 u2 0 ]   x   [v1 v2 0 ]   =  [ u1  u2  0 ]
                                      [ v1  v2  0 ]
    */

    return this.x * another.y - another.x * this.y;
};

Vector.prototype.setTo = function(anotherVector) {
    this.x = anotherVector.x;
    this.y = anotherVector.y;
}

Vector.prototype.render = function(color)
{
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI, true);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, 2 * Math.PI, true);
    ctx.fill();
};


Line = function(from,to,color)
{
    this.from = from;
    this.to = to;
    this.color = color;
}

Line.prototype.update = function() {
    
} 

Line.prototype.render = function()
{
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.from.x, this.from.y);
    ctx.lineTo(this.to.x, this.to.y);
    ctx.stroke();

    this.from.render(this.color);
    this.to.render(this.color);
};


Matrix = function(a,b,c,d,e,f){
/*
    void ctx.transform(a, b, c, d, e, f);
    The transformation matrix is described by: [a  c  e   
                                                b  d  f
                                                0  0  1]
*/
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
};
Matrix.Identity = new Matrix(1,0,0,1,0,0);

Matrix.Translation = function (x,y) {
    return new Matrix(1,0,0,1, x, y);
}

Matrix.Rotation = function (radians) {

    var sin = Math.sin(radians);
    var cos = Math.cos(radians);
    return new Matrix(cos,sin,-sin,cos,0,0);
}


Matrix.prototype.By = function (other) {
    /*
    this            other
    [ a c e ]       [a1 c1 e1]     [ m11  m12  m13 ]
    [ b d f ]   x   [b1 d1 f1]  =  [ m21  m22  m23 ]
    [ 0 0 1 ]       [ 0  0  1]     [   0    0    1 ]
    */

    var m11,m12,m13,
        m21,m22,m23,
        m31,m32,m33 = 0;

    m11 = (this.a * other.a) + (this.c * other.b);
    m12 = (this.a * other.c) + (this.c * other.d);
    m13 = (this.a * other.e) + (this.c * other.f) + this.e;

    m21 = (this.b * other.a) + (this.d * other.b);
    m22 = (this.b * other.c) + (this.d * other.d);
    m23 = (this.b * other.e) + (this.d * other.f) + this.f;

    m31 = 0;
    m32 = 0;
    m33 = 1;

    return new Matrix(m11,m21,m12,m22,m13,m23);
};