GameBox = function()
{
    this.lastFrameTime = Date.now();
    this.currentFrameTime = Date.now();
    this.timeElapsed = 0;

    this.gameObjects = [];
}

GameBox.prototype.gameLoop = function()
{
    window.requestAnimationFrame(this.gameLoop.bind(this));
    this.lastFrameTime = this.currentFrameTime;
    this.currentFrameTime = Date.now();
    this.timeElapsed =  this.currentFrameTime - this.lastFrameTime ;

    this.update(this.timeElapsed); //modify data which is used to render
    this.render();
}

//GAME DATA

var ctx;
var canvasWidth;
var canvasHeight;
var colors = [
"red",	"green", "blue", "black",
"rgb( 61,118,149)",	"rgb(129, 63,156)",	"rgb(225,232, 87)",	"rgb(234,167, 88)",
"rgb( 37,100,134)",	"rgb(111, 38,140)",	"rgb(201,209, 49)",	"rgb(212,138, 50)",
"rgb( 20, 79,111)",	"rgb( 89, 20,116)",	"rgb(165,172, 23)",	"rgb(174,105, 24)",
"rgb(  5, 58, 86)",	"rgb( 66,  5, 90)",	"rgb(128,134,  1)",	"rgb(136, 74,  1)"
];

var points = [
 	new Vector(20,500),
	new Vector(170,30),
	new Vector(250,70),
	new Vector(360,100),
	new Vector(420,200),
	new Vector(475,200),
	new Vector(550,100)
	];
var trace = [];
var FinalOnly = false;
var PrintTrace = false;
var AnimationExample = true;
var dragging = false;
var dragging_index = -1;
var creating = false;
const MAX_POINTS_COUNT = 10;

var mouse = Vector.Zero;
var game = null;
var fpscounter, pointscounter;

BezierPoint = function(point) {
    this.point = point;
	this.time = 0;
	this.length = 2500;
}

BezierPoint.prototype.update = function(elapsed_ms)
{  
	this.time += elapsed_ms;
	if (this.time >= this.length) { this.time = 0; }
};

BezierPoint.prototype.render = function()
{
};

BezierGeneral = function (points,final) {

	this.FINAL = final;
	if (points.length > 2) {
		this.bezier_a = new BezierGeneral(   points.filter(function (x,idx) { return idx < points.length-1; }));
		this.bezier_b = new BezierGeneral(points.filter(function (x,idx) { return idx >= 1; }));
		
	}
	else {
		this.bezier_a = new BezierPoint(points[0]);
		this.bezier_b = new BezierPoint(points[1]);		
	}

	this.line = new Line(this.bezier_a.point,this.bezier_b.point);
	this.point = this.bezier_a.point;

	this.time = this.bezier_a.time;
	this.length = this.bezier_a.length;

	this.color = colors[points.length - 2];

}

BezierGeneral.prototype.update = function(elapsed_ms)
{  
	this.bezier_a.update(elapsed_ms);
	this.bezier_b.update(elapsed_ms);

	this.time = this.bezier_a.time;
	this.length = this.bezier_a.length;

	this.line = new Line(this.bezier_a.point,this.bezier_b.point,this.color);
	this.point = new Vector(this.bezier_b.point.x - this.bezier_a.point.x,this.bezier_b.point.y - this.bezier_a.point.y).ByScalar(this.bezier_a.time / this.bezier_a.length).Plus(this.bezier_a.point);


	if (this.FINAL && trace.length <= 250){
		trace.push(this.point);
	}
};

BezierGeneral.prototype.render = function()
{
	if (this.FINAL && PrintTrace){
		//Print Trace
		for (var i = trace.length - 1; i >= 0; i--) {
			ctx.fillStyle = "red";
		    ctx.beginPath();
		    ctx.arc(trace[i].x, trace[i].y, 2, 0, 2 * Math.PI, true);
		    ctx.fill();
		}
		if (FinalOnly) {
			this.point.render();	
		}
	}

	if (FinalOnly) {
		this.bezier_a.render();
		this.bezier_b.render();
	}
	else
	{
		this.point.render();	
		this.line.render();
		this.bezier_a.render();
		this.bezier_b.render();
	}

};



PatrollEye = function (bezier_animation) {
	this.animation = bezier_animation;

	this.prev_position = new Vector(bezier_animation.point.x -1,bezier_animation.point.y);
	this.position = bezier_animation.point;
	this.direction = new Vector(1,0);

	this.transform = Matrix.Identity;
	this.width = 50;
}

PatrollEye.prototype.update = function(timeElapsed)
{
	this.prev_position = this.position;
	this.position = this.animation.point;
	this.direction = this.position.Minus(this.prev_position).Versor();

    var translate = Matrix.Translation(-(this.width / 2), -(this.width / 2));
    
    var reference_axis = new Vector(1,0);
    var cross = reference_axis.ZCross(this.direction);
    var angle_rot = Math.acos(reference_axis.Dot(this.direction) ) * (cross >= 0 ? 1 : -1);
    var rot = Matrix.Rotation(angle_rot);

	var translate2 = Matrix.Translation( this.position.x, this.position.y);
    
    this.transform =  translate2.By(rot).By(translate); 
}

PatrollEye.prototype.render= function()
{

	if(!AnimationExample) return;

    var image = document.getElementById("image");

    ctx.transform(this.transform.a, this.transform.b, this.transform.c, this.transform.d, this.transform.e, this.transform.f);

    ctx.drawImage(image, 0, 0, image.width, image.width,
		0,0,this.width,this.width);

    ctx.resetTransform();

    if(PrintTrace)
    {
    	var line = new Line(this.position,this.position.Plus(this.direction.ByScalar(50)),"red");
    	line.render();
    }
    
}




// GAME DATA END

GameBox.prototype.register = function(aGameObject) {
    this.gameObjects.push(aGameObject);
};


GameBox.prototype.update = function(timeElapsed)
{
	fpscounter.textContent = "FPS: " + (1000/timeElapsed).toPrecision(2);
    this.gameObjects.forEach( function (value,index,array) {
            value.update(timeElapsed);
        });
}

GameBox.prototype.render= function()
{
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	if (!!dragging || !!creating) {
		ctx.strokeStyle = "green";
	}
	 else {
		ctx.strokeStyle = "black";
	}
    ctx.strokeRect(0 , 0, canvasWidth, canvasHeight);

    this.gameObjects.forEach( function (value,index,array) {
        value.render();
    });

    points.forEach(function (value,index) {
    	value.render("green");
	});
	pointscounter.textContent = "Points: " + (points.length);

    ctx.resetTransform();
}

function MousePosition(a_canvas, evt) {
	var rect = a_canvas.getBoundingClientRect();
	return new Vector( evt.clientX - rect.left, evt.clientY - rect.top );
}


function Init(){
	var canvas = document.getElementById('canvas');
	fpscounter = document.getElementById("fps");
	pointscounter = document.getElementById("points");
    ctx = canvas.getContext("2d");
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

	canvas.addEventListener('mousedown', function(evt) {
		dragging_index = points.findIndex(function(point) { return point.Near(MousePosition(canvas, evt),10); } );
		
		dragging = dragging_index != (-1);
		if (!dragging) creating = true;
	}, false);
	 

	canvas.addEventListener('mouseup', function(evt) {
		
		if (creating){
			addPoint(MousePosition(canvas, evt));
			creating = false;
		}

		if (dragging){
			if(evt.shiftKey){
				deletePoint(dragging_index);
			}
			else {
				updatePoint(dragging_index);
			}
			
			dragging = false;
		}

		Restart();
	}, false);

    canvas.addEventListener('mousemove', function(evt) {
		if (!!dragging || !!creating)
		{
			mouse = MousePosition(canvas, evt);
			updatePoint(dragging_index);
		} 
	}, false);

    game = new GameBox();

	var line = new BezierGeneral(points,true);

	var ball = new PatrollEye(line);

    game.register(line);
    game.register(ball);

    game.gameLoop();
}

function addPoint(aVector) {
	if (points.length >= MAX_POINTS_COUNT) {
		points.splice(0,1)
	}
	points.push(aVector);
}

function updatePoint(anIndex) {
	let point = points[anIndex];
	if (point) {
		point.setTo(mouse);
	}
}

function deletePoint(anIndex){
	points = points.filter(function (elem,index) {
		return index != anIndex;
	});
}


function SwapExample() {
	AnimationExample = !AnimationExample;
}

function SwapTrace() {
	PrintTrace = !PrintTrace;
}

function SwapFinal() {
	FinalOnly = !FinalOnly;
}

function Restart() {
	if (points.length < 2) { return; }
	trace = [];

	var line = new BezierGeneral(points,true);
	var ball = new PatrollEye(line);
	
	game.gameObjects = [];
    game.register(line);
    game.register(ball);

}