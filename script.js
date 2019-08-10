class Vec25D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    minusVecXY(other) {
        const res = this._getRes();

        res.x -= other.x;
        res.y -= other.y;

        return res;
    }

    multXY(scalar) {
        const res = this._getRes();

        res.x *= scalar;
        res.y *= scalar;

        return res;
    }

    addVecXY(vec){
        const res = this._getRes();

        res.x += vec.x;
        res.y += vec.y;

        return res;
    }

    addVec(vec, inplace = false){
        const res = this._getRes(inplace);

        res.x += vec.x;
        res.y += vec.y;
        res.z += vec.z;

        return res;
    }

    mult(scalar){
        const res = this._getRes();

        res.x *= scalar;
        res.y *= scalar;
        res.z *= scalar;

        return res;    
    }

    _getRes(inplace) {
        if(inplace) return this;

        return new Vec25D(this.x, this.y, this.z);
    }
}

class Object25D {
    constructor(verts) {
        this.verts = verts;

        this.renderable = new PIXI.Graphics();
    }

    render(fill) {
        const perspectivisedPoints = []
        for (const point of this.verts) perspectivisedPoints.push(perspectivatePoint(point));

        app.stage.removeChild(this.renderable);
        this.renderable = getRect(perspectivisedPoints, fill);
        app.stage.addChild(this.renderable);
    }
}

class Building{
    constructor(
        zMin = 0,
        zMax = -0.25,
        yMin = 0.5,
        yMax = 4,
        xMin = 0.5,
        xMax = 4,
        position = new Vec25D(0,0,0),
    ){
        if(randomInt(0,1) == 1) this.fill = 0xffffff;
        else this.fill = 0x151515;

        this.faces = [
            //top most face
            new Object25D(
                [
                    new Vec25D(xMin, yMax, zMin).addVec(position),
                    new Vec25D(xMin, yMax, zMax).addVec(position),
                    new Vec25D(xMax, yMax, zMax).addVec(position),
                    new Vec25D(xMax, yMax, zMin).addVec(position)
                ]
            ),
    
            // bottom Face
            new Object25D(
                [
                    new Vec25D(xMin, yMin, zMin).addVec(position),
                    new Vec25D(xMin, yMin, zMax).addVec(position),
                    new Vec25D(xMax, yMin, zMax).addVec(position),
                    new Vec25D(xMax, yMin, zMin).addVec(position)
                ]
            ),

            // left Face
            new Object25D(
                [
                    new Vec25D(xMin, yMax, zMin).addVec(position),
                    new Vec25D(xMin, yMax, zMax).addVec(position),
                    new Vec25D(xMin, yMin, zMax).addVec(position),
                    new Vec25D(xMin, yMin, zMin).addVec(position)
                ]
            ),

            // right Face
            new Object25D(
                [
                    new Vec25D(xMax, yMin, zMin).addVec(position),
                    new Vec25D(xMax, yMin, zMax).addVec(position),
                    new Vec25D(xMax, yMax, zMax).addVec(position),
                    new Vec25D(xMax, yMax, zMin).addVec(position)
                ]
            ),

            //camera facing... face
            new Object25D(
                [
                    new Vec25D(xMin, yMin, zMax).addVec(position),
                    new Vec25D(xMin, yMax, zMax).addVec(position),
                    new Vec25D(xMax, yMax, zMax).addVec(position),
                    new Vec25D(xMax, yMin, zMax).addVec(position)
                ]
            ),

        ];
    }

    translate(trans){
        for (const face of this.faces){
            for (const vert of face.verts){
                vert.addVec(trans, true);
            }
        }
    }

    render(){
        for (const face of this.faces){
            face.render(this.fill);
        }
    }
}

function randomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const texture = PIXI.Texture.from("./spaceship.png");

let options = {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xFD063C
}


const app = new PIXI.Application(options);

document.getElementById("app").appendChild(app.renderer.view);

let transY = 5;
let transX = 5;

const zMin = 0;
const zMax = -50;
const yMin = 0;
const yMax = 800;
const xMin = 0;
const xMax = 1400;

function getBuilding(zRange, yRange, XRange, position){
    const zWidth = -1 * randomInt(zRange.min, zRange.max);
    const yWidth = randomInt(yRange.min, yRange.max);
    const xWidth = randomInt(XRange.min, XRange.max);

    return new Building(
        0, zWidth, 0, yWidth, 0, xWidth, position
    );
}

const buildings = [];

const position = new Vec25D(-1000,-1000,0);

for (let j = 0; j < 10; j++){
    for (let i = 0; i < 10; i++){
        if(randomInt(0,5) === 1)
            buildings.push(
                getBuilding(
                    {min:-300, max:-50}, {min:7000, max:8000}, {min:7000, max:8000},
                    position
                )
            );
        position.y += yMax * 16;
    }
    position.x += xMax * 16;
    position.y = 400;
}


app.start();

let K = 0.5;
const screenOrigin = new Vec25D(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0
);
const camera = new Vec25D(
    -20,
    -20,
    -100
);

// Listen for animate update
app.ticker.add((delta) => {
    for (const build of buildings) {
        build.render();
        build.translate(new Vec25D(transX, transY, 0));
    }
});


function getRect(verts, fill) {
    const rect = new PIXI.Graphics();

    rect.lineStyle(1, fill);
    rect.beginFill(fill);

    const out_verts = [];

    for (const vert of verts){
        out_verts.push(vert.x)
        out_verts.push(vert.y);
    } 
    rect.drawPolygon(out_verts);
    return rect;
}

function perspectivatePoint(point) {
    //
    const lhs = point.minusVecXY(camera);
    const rhs = 1 / ((point.z - camera.z) * K);
    const res = lhs.multXY(rhs);

    return screenOrigin.addVecXY(res);
}

document.addEventListener("mousemove", (e)=>{
    camera.x = e.clientX;
    camera.y = e.clientY;
    //console.log("Camera Position: ", camera); 
})

var lastScrollTop = 0;

window.addEventListener('wheel', function(e) {
    if (e.deltaY < 0) {
        camera.z+=5;
    }
    if (e.deltaY > 0) {
        camera.z-=5;    
    }
});

document.getElementById("k").addEventListener("change", (e)=>{
    K = parseInt(e.target.value);
    
    console.log("K: ", K);
})

document.getElementById("transY").addEventListener("change", (e)=>{
    transY = parseInt(e.target.value);
    console.log("Trans Y: ", transY);
})

document.getElementById("transX").addEventListener("change", (e)=>{
    transX = parseInt(e.target.value);
    console.log("Trans X: ", transX);
})