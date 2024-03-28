let gamestate = 'hub'

const hubcanvas = document.getElementById('hubCanvas')
const hubc = hubcanvas.getContext('2d')

hubcanvas.width = innerWidth
hubcanvas.height = innerHeight

function compare(a, b){
    if(a.distance < b.distance){
        return 1
    }
    if(a.distance > b.distance){
        return -1
    }
    return 0
}

function determinant(a1, a2, a3, a4, a5, a6, a7, a8, a9){
    return a1 * a5 * a9 + a3 * a4 * a8 + a2 * a6 * a7 - a3 * a5 * a7 - a1 * a6 * a8 - a2 * a4 * a9
}

function computeIntersection(straight_shift, straight_basis, surface_shift, surface_basis1, surface_basis2){
    let det = determinant(straight_basis.x, -surface_basis1.x, -surface_basis2.x, 
        straight_basis.y, -surface_basis1.y, -surface_basis2.y,
         straight_basis.z, -surface_basis1.z, -surface_basis2.z)
    let det1 = determinant(surface_shift.x - straight_shift.x, -surface_basis1.x, -surface_basis2.x, surface_shift.y - straight_shift.y, -surface_basis1.y, -surface_basis2.y, surface_shift.z - straight_shift.z, -surface_basis1.z, -surface_basis2.z)
    let det2 = determinant(straight_basis.x, surface_shift.x - straight_shift.x, -surface_basis2.x, straight_basis.y, surface_shift.y - straight_shift.y, -surface_basis2.y, straight_basis.z, surface_shift.z - straight_shift.z, -surface_basis2.z)
    let det3 = determinant(straight_basis.x, -surface_basis1.x, surface_shift.x - straight_shift.x, straight_basis.y, -surface_basis1.y, surface_shift.y - straight_shift.y, straight_basis.z, -surface_basis1.z, surface_shift.z - straight_shift.z)
    return [det1 / det, det2 / det, det3 / det]
}

class Object {
    constructor(position, pointcords, facebends, metrics){
        this.position = position
        this.points = []
        this.faces = []
        this.metrics = metrics
        pointcords.forEach(pc => {
            let np = new Point(position = {x: pc.x + this.position.x, y: pc.y + this.position.y, z: pc.z + this.position.z})
            this.points.push(np)
            points.push(np)
        })
        facebends.forEach(fb => {
            var nm = []
            fb.forEach(fc => {
                nm.push(this.points[fc])
            })
            let nf = new Face(nm, this.metrics)
            this.faces.push(nf)
            faces.push(nf)
        })
    }
}


class HollowObject {
    constructor(position, pointcords, edgebends){
        this.position = position
        this.points = []
        this.edges = []
        pointcords.forEach(pc => {
            let np = new Point(position = {x: pc.x + this.position.x, y: pc.y + this.position.y, z: pc.z + this.position.z})
            this.points.push(np)
            points.push(np)
        })
        edgebends.forEach(eb => {
            let ne = new Edge(this.points[eb[0]], this.points[eb[1]])
            this.edges.push(ne)
            edges.push(ne)
        })
    }
}

class Snow extends Object {
    constructor(position, pointcords, edgebends, metrics, velocity, angles, angleVelocity) {
        super(position, pointcords, edgebends, metrics)
        //this.position = position
        this.velocity = velocity
        this.angles = angles
        this.angleVelocity = angleVelocity
    }
    update(){
        this.position.alpha += this.velocity.alpha
        this.position.y += this.velocity.y
        this.position.r += this.velocity.r

        this.angles.alpha += this.angleVelocity.alpha
        this.angles.beta += this.angleVelocity.beta

        this.points[0].position.y = Math.sin(this.angles.alpha) + this.position.y
        this.points[0].position.x = Math.cos(this.angles.beta) * Math.cos(this.angles.alpha) + Math.cos(this.position.alpha) * this.position.r
        this.points[0].position.z = Math.sin(this.angles.beta) * Math.cos(this.angles.alpha) + Math.sin(this.position.alpha) * this.position.r

        this.points[1].position.y = -0.5 * Math.sin(this.angles.alpha) + this.position.y
        this.points[1].position.x = -0.5 * Math.cos(this.angles.beta) * Math.cos(this.angles.alpha) - 0.866 * Math.sin(this.angles.beta) + Math.cos(this.position.alpha) * this.position.r
        this.points[1].position.z = -0.5 * Math.sin(this.angles.beta) * Math.cos(this.angles.alpha) + 0.866 * Math.cos(this.angles.beta) + Math.sin(this.position.alpha) * this.position.r

        this.points[2].position.y = -0.5 * Math.sin(this.angles.alpha) + this.position.y
        this.points[2].position.x = -0.5 * Math.cos(this.angles.beta) * Math.cos(this.angles.alpha) + 0.866 * Math.sin(this.angles.beta) + Math.cos(this.position.alpha) * this.position.r
        this.points[2].position.z = -0.5 * Math.sin(this.angles.beta) * Math.cos(this.angles.alpha) - 0.866 * Math.cos(this.angles.beta) + Math.sin(this.position.alpha) * this.position.r

        if(this.position.y < -10){
            this.position.y = 100
        }
    }

}

class Face {
    constructor(points, metrics){
        this.points = points
        this.baricenter = {x: 0, y: 0, z: 0}
        this.order = this.points.length
        this.metrics = metrics
        this.distance = 0
    }
    update(){
        switch(this.metrics){
            case 'baricentric':
                this.baricenter = {x: 0, y: 0, z: 0}
                this.points.forEach(p => {
                    this.baricenter.x += p.position.x
                    this.baricenter.y += p.position.y
                    this.baricenter.z += p.position.z
                })

                this.baricenter.x /= this.order
                this.baricenter.y /= this.order
                this.baricenter.z /= this.order
                this.distance = (this.baricenter.x - spectator.position.x)**2 + (this.baricenter.y - spectator.position.y)**2 + (this.baricenter.z - spectator.position.z)**2
                break
            case 'minpoint':
                this.distance = 0
                this.points.forEach(p => {
                    if(this.distance > p.distance){
                        this.distance = p.distance
                    }
                })
                break
            case 'maxpoint':
                this.distance = 0
                this.points.forEach(p => {
                    if(this.distance < p.distance){
                        this.distance = p.distance
                    }
                })
                break
        }
        this.draw()
    }

    draw(){
        hubc.beginPath()
        let firstvis
        for(let j = 0; j < this.order; j++){
            if(this.points[j].status == 'visible'){
                firstvis = j
                break
            }
        }
        hubc.strokeStyle = 'green'
        hubc.lineWidth = 1
        let i = firstvis
        while(i < this.order + firstvis){
            if(this.points[i % this.order].status == 'visible' && this.points[(i + 1) % this.order].status == 'visible'){
                hubc.lineTo(this.points[(i + 1) % this.order].image.x, this.points[(i + 1) % this.order].image.y)
            }
            if(this.points[i % this.order].status == 'visible' && this.points[(i + 1) % this.order].status == 'invisible'){
                let a = computeIntersection(this.points[i % this.order].position, {x: this.points[(i + 1) % this.order].position.x - this.points[i % this.order].position.x, y: this.points[(i + 1) % this.order].position.y - this.points[i % this.order].position.y, z: this.points[(i + 1) % this.order].position.z - this.points[i % this.order].position.z},
                spectator.corvp, spectator.vecup, spectator.vecri)
                hubc.lineTo(this.points[i % this.order].image.x, this.points[i % this.order].image.y)
                hubc.lineTo(Point.norm * a[2] + hubcanvas.width / 2, -Point.norm * a[1] + hubcanvas.height / 2)
            }
            if(this.points[i % this.order].status == 'invisible' && this.points[(i + 1) % this.order].status == 'visible'){
                let a = computeIntersection(this.points[i % this.order].position, {x: this.points[(i + 1) % this.order].position.x - this.points[i % this.order].position.x, y: this.points[(i + 1) % this.order].position.y - this.points[i % this.order].position.y, z: this.points[(i + 1) % this.order].position.z - this.points[i % this.order].position.z},
                spectator.corvp, spectator.vecup, spectator.vecri)
                hubc.lineTo(Point.norm * a[2] + hubcanvas.width / 2, -Point.norm * a[1] + hubcanvas.height / 2)
                hubc.lineTo(this.points[(i + 1) % this.order].image.x, this.points[(i + 1) % this.order].image.y)
            }
            i++;
        }
        hubc.closePath()
        hubc.fillStyle = 'black'
        hubc.fill()
        hubc.stroke()
        hubc.closePath()
        hubc.stroke()
    }
}

class Edge {
    constructor(p1, p2) {
        this.p1 = p1
        this.p2 = p2
    }
    update(){
        hubc.beginPath()
        if(this.p1.status == 'visible' && this.p2.status == 'visible'){
            hubc.moveTo(this.p1.image.x, this.p1.image.y)
            hubc.lineTo(this.p2.image.x, this.p2.image.y)
        }
        if(this.p1.status == 'visible' && this.p2.status == 'invisible'){
            hubc.moveTo(this.p1.image.x, this.p1.image.y)
            let a = computeIntersection(this.p1.position, {x: this.p2.position.x - this.p1.position.x, y: this.p2.position.y - this.p1.position.y, z: this.p2.position.z - this.p1.position.z}, spectator.corvp, spectator.vecup, spectator.vecri)
            hubc.lineTo(Point.norm * a[2] + hubcanvas.width / 2, -Point.norm * a[1] + hubcanvas.height / 2)
        }
        if(this.p1.status == 'invisible' && this.p2.status == 'visible'){
            let a = computeIntersection(this.p1.position, {x: this.p2.position.x - this.p1.position.x, y: this.p2.position.y - this.p1.position.y, z: this.p2.position.z - this.p1.position.z}, spectator.corvp, spectator.vecup, spectator.vecri)
            hubc.moveTo(Point.norm * a[2] + hubcanvas.width / 2, -Point.norm * a[1] + hubcanvas.height / 2)
            hubc.lineTo(this.p2.image.x, this.p2.image.y)
        }
        hubc.strokeStyle = '#00ff00'
        hubc.lineWidth = 0.7
        hubc.stroke()
    }
}


class Point {
    static norm = 100
    constructor(position) {
        this.position = position
        this.sx = 0
        this.sy = 0
        this.image = {x: 50, y: 50}
        this.velocity = {x: 0, y: 0, z: 0}
        this.radius = 2
        this.status = 'visible'
        this.distance = 0
    }


    update() {
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
        this.position.z += this.velocity.z

        this.distance = (spectator.position.x - this.position.x) ** 2 + (spectator.position.y - this.position.y) ** 2 + (spectator.position.z - this.position.z) ** 2
        let a = computeIntersection(this.position, {x: spectator.position.x - this.position.x, y: spectator.position.y - this.position.y, z: spectator.position.z - this.position.z},
            spectator.corvp, spectator.vecup, spectator.vecri)
        if(a[0] < 0 || a[0] > 1){this.status = 'invisible'}
        else{this.status = 'visible'}
        this.sy = a[1]
        this.sx = a[2]

        this.image.x = Point.norm * this.sx + hubcanvas.width / 2
        this.image.y = -Point.norm * this.sy + hubcanvas.height / 2
        /*hubc.beginPath()
        hubc.arc(this.image.x, this.image.y, this.radius, 0, Math.PI * 2)
        hubc.fillStyle = 'yellow'
        hubc.fill()
        hubc.closePath()*/
    }
}

class Spectator {
    constructor(position) {
        this.position = position
        this.velocity = {x: 0, y: 0, z: 0}
        this.angleVelocity = {alpha: 0, beta: 0}
        this.alpha = 0
        this.beta = 0
        this.height = 6
        this.gravity = -0.005
        this.rfov = 2
        this.vecvp = {x: this.rfov, y: 0, z: 0}
        this.corvp = {x: this.x + this.rfov, y: 0, z: 0}
        this.vecup = {x: 0, y: 1, z: 0}
        this.vecri = {x: 0, y: 0, z: 1}
    }
    calculatevp() {
        this.vecvp.y = Math.sin(this.alpha) * this.rfov
        this.vecvp.x = Math.cos(this.beta) * Math.cos(this.alpha) * this.rfov
        this.vecvp.z = Math.sin(this.beta) * Math.cos(this.alpha) * this.rfov

        this.vecup.y = Math.cos(this.alpha)
        this.vecup.x = -Math.cos(this.beta) * Math.sin(this.alpha)
        this.vecup.z = -Math.sin(this.beta) * Math.sin(this.alpha)

        this.vecri.x = -Math.sin(this.beta)
        this.vecri.z = Math.cos(this.beta)

        this.corvp.x = this.position.x + this.vecvp.x
        this.corvp.y = this.position.y + this.vecvp.y
        this.corvp.z = this.position.z + this.vecvp.z
    }
    update() {
        this.position.x += (this.velocity.x * Math.cos(this.beta) - this.velocity.z * Math.sin(this.beta))
        this.position.z += (this.velocity.x * Math.sin(this.beta) + this.velocity.z * Math.cos(this.beta))
        //this.position.y += this.velocity.y
        if(this.alpha <= Math.PI / 2 && this.alpha >= - Math.PI / 2){
            this.alpha += this.angleVelocity.alpha * 2
        }
        else{
            if(this.alpha > 0){this.alpha = Math.PI / 2}
            else{this.alpha = -Math.PI / 2}
        }

        this.beta += this.angleVelocity.beta * 2
        this.calculatevp()
        if(isOnFloor()){
            this.velocity.y = 0
        }
        else{
            this.velocity.y += this.gravity
            this.position.y += this.velocity.y
        }
        if(this.position.y < -190){
            this.position.x = -3
            this.position.y = 6
            this.position.z = 0
            this.velocity.y = 0
        }
    }
}

function isOnFloor(){
    return spectator.position.x > floor.position.x && spectator.position.x < floor.position.x + floor.height && spectator.position.z > floor.position.z && spectator.position.z < floor.position.z + floor.width && spectator.position.y > floor.position.y && spectator.position.y < floor.position.y + spectator.height && spectator.velocity.y <= 0
}

class Floor {
    constructor(position, width, height){
        this.position = position
        this.width = width
        this.height = height
    }
}

class Interaction {
    constructor(position, width, height, type){
        this.position = position
        this.width = width
        this.height = height
        this.type = type
    }

    action(){
        const hc = document.getElementById('hubCanvas')
        hc.style.display = 'none'
        switch (this.type){
            case 'packman':
                console.log('packman is pressed')
                const pd = document.getElementById('pacmanDiv')
                pd.style.display = 'flex'
                gamestate = 'packman'
                newPackmanGame()
                /*const studyScreen = document.getElementById('studyScreen')
                studyScreen.style.display = 'flex'*/

                break
            case 'battleship':
                console.log('battleship is pressed')
                const sc = document.getElementById('spaceDiv')
                sc.style.display = 'flex'
                gamestate = 'battleships'
                newBattleshipsGame()
                /*const studyScreen = document.getElementById('studyScreen')
                studyScreen.style.display = 'flex'*/
                break
            case 'life':
                console.log('life is pressed')
                break   
        }
    }
}



let points = []
let edges = []
let faces = []
const spectator = new Spectator(position = {x: -3, y: 6, z: 0})

const platformwidth = 10
const platformheight = 12
const brickwidth = 6
const brickheight = 4

let platp = []
for(let i = 0; i < platformheight; i++){
    for(let j = 0; j < platformwidth; j++){
        platp.push(position = {x: i * brickheight, y: 0, z: j * brickwidth})
    }
}
let platf = []
for(let i = 0; i < platformheight - 1; i+=2){
    for(let j = 0; j < platformwidth - 2; j+=2){
        platf.push([i * platformwidth + j, (i + 1) * platformwidth + j, (i + 1) * platformwidth + j + 2, i * platformwidth + j + 2])
    }
}

for(let i = 1; i < platformheight - 1; i+=2){
    platf.push([i * platformwidth, (i + 1) * platformwidth, (i + 1) * platformwidth + 1, i * platformwidth + 1])
}
for(let i = 0; i < platformheight - 1; i+=2){
    platf.push([i * platformwidth + platformwidth - 2, (i + 1) * platformwidth + platformwidth - 2, (i + 1) * platformwidth + platformwidth - 1, i * platformwidth + platformwidth - 1])
}

for(let i = 1; i < platformheight - 1; i+=2){
    for(let j = 1; j < platformwidth - 2; j+=2){
        platf.push([i * platformwidth + j, (i + 1) * platformwidth + j, (i + 1) * platformwidth + j + 2, i * platformwidth + j + 2])
    }
}
const platform = new Object(position = {x: -(platformheight - 1) * brickheight / 2, y: 0, z: -(platformwidth - 1) * brickwidth / 2}, platp, platf, 'maxpoint')
let floor = new Floor(position = {x: -(platformheight - 1) * brickheight / 2, y: 0, z: -(platformwidth - 1) * brickwidth / 2}, platformwidth * brickwidth, platformheight * brickheight)


const gridsize = 50
const widt = 40

let gridp = []
for(let i = 0; i < gridsize; i++){
    for(let j = 0; j < gridsize; j++){
        gridp.push({x: i * widt, y: 0, z: j * widt})
    }
}
let gride = []
for(let i = 0; i < gridsize - 1; i++){
    for(let j = 0; j < gridsize; j++){
        gride.push([i * gridsize + j, (i + 1) * gridsize + j])
    }
}
for(let i = 0; i < gridsize; i++){
    for(let j = 0; j < gridsize - 1; j++){
        gride.push([i * gridsize + j, i * gridsize + j + 1])
    }
}
const wavecenter = {x: 0, y: -40, z: 0}
const grid = new HollowObject(position = {x: -gridsize * widt / 2, y: -40, z: -gridsize * widt / 2}, gridp, gride)

stars = []
const starscnt = 1000
const sradius = 1000
for(let i = 0; i < starscnt; i++){
    let alpha = Math.random() * Math.PI
    let beta = Math.random() * Math.PI * 2
    stars.push(new HollowObject(position = {x: Math.cos(alpha) * Math.cos(beta) * sradius, y: Math.sin(alpha) * sradius, z: Math.cos(alpha) * Math.sin(beta) * sradius}, [{x: 0, y: 0, z: 0}, {x: 0, y: 5, z: 0}], [[0, 1]], 'maxpoint'))
}



const gaem1 = new Object(position = {x: 10, y: 0, z: -6}, [
    {x: 0, y: 0, z: 0},//0
    {x: 3, y: 0, z: 0},//1
    {x: 3, y: 0, z: 3},//2
    {x: 0, y: 0, z: 3},//3

    {x: 0, y: 3, z: 0},//4
    {x: 3, y: 3, z: 0},//5
    {x: 3, y: 3, z: 3},//6
    {x: 0, y: 3, z: 3},//7

    {x: 1, y: 4, z: 0},//8
    {x: 3, y: 4, z: 0},//9
    {x: 3, y: 4, z: 3},//10
    {x: 1, y: 4, z: 3},//11

    {x: 1, y: 6, z: 0},//12
    {x: 3, y: 6, z: 0},//13
    {x: 3, y: 6, z: 3},//14
    {x: 1, y: 6, z: 3},//15

    {x: 1.2, y: 4.2, z: 0.2},//16
    {x: 1.2, y: 4.2, z: 2.8},//17
    {x: 1.2, y: 5.8, z: 0.2},//18
    {x: 1.2, y: 5.8, z: 2.8},//19

    {x: 0.6, y: 3.63, z: 1.37},//20
    {x: 0.6, y: 3.63, z: 1.63},//21
    {x: 0.75, y: 3.8, z: 1.5},//22

    {x: 0.4, y: 3.37, z: 1.37},//23
    {x: 0.4, y: 3.37, z: 1.63},//24
    {x: 0.25, y: 3.2, z: 1.5},//25

    {x: 0.4, y: 3.4, z: 1.35},//26
    {x: 0.6, y: 3.6, z: 1.35},//27
    {x: 0.5, y: 3.5, z: 1.1},//28

    {x: 0.4, y: 3.4, z: 1.65},//29
    {x: 0.6, y: 3.6, z: 1.65},//30
    {x: 0.5, y: 3.5, z: 1.9},//31

], [

    [12, 13, 14, 15],
    [0, 1, 13, 12, 8, 4],
    [3, 2, 14, 15, 11, 7],
    [1, 2, 14, 13],
    [0, 3, 7, 4],
    [4, 7, 11, 8],
    [17, 16, 18, 19],//<--screen
    [8, 11, 17, 16],
    [8, 12, 18, 16],
    [15, 11, 17, 19],
    [15, 12, 18, 19],

    [20, 21, 22],
    [23, 24, 25],
    [26, 27, 28],
    [29, 30, 31],

], 'maxpoint')

const screen1 = new Object(position = {x: 0, y: 0, z: 0}, [
    {x: 11.2, y: 4.2, z: -5.8},
    {x: 11.2, y: 5.8, z: -5.8},
    {x: 11.2, y: 4.2, z: -3.2},
    {x: 11.2, y: 5.8, z: -3.2}
], [
    [0, 1, 3, 2]
], 'maxpoint')

const gaem2 = new Object(position = {x: 10, y: 0, z: 0}, [
    {x: 0, y: 0, z: 0},//0
    {x: 3, y: 0, z: 0},//1
    {x: 3, y: 0, z: 3},//2
    {x: 0, y: 0, z: 3},//3

    {x: 0, y: 3, z: 0},//4
    {x: 3, y: 3, z: 0},//5
    {x: 3, y: 3, z: 3},//6
    {x: 0, y: 3, z: 3},//7

    {x: 1, y: 4, z: 0},//8
    {x: 3, y: 4, z: 0},//9
    {x: 3, y: 4, z: 3},//10
    {x: 1, y: 4, z: 3},//11

    {x: 1, y: 6, z: 0},//12
    {x: 3, y: 6, z: 0},//13
    {x: 3, y: 6, z: 3},//14
    {x: 1, y: 6, z: 3},//15

    {x: 1.2, y: 4.2, z: 0.2},//16
    {x: 1.2, y: 4.2, z: 2.8},//17
    {x: 1.2, y: 5.8, z: 0.2},//18
    {x: 1.2, y: 5.8, z: 2.8},//19

    {x: 0.35, y: 3.35, z: 1.25},//20
    {x: 0.65, y: 3.65, z: 1.25},//21
    {x: 0.5, y: 3.5, z: 1.02},//22

    {x: 0.35, y: 3.35, z: 1.75},//23
    {x: 0.65, y: 3.65, z: 1.75},//24
    {x: 0.5, y: 3.5, z: 1.98},//25

    {x: 0.35, y: 3.35, z: 1.4},//26
    {x: 0.65, y: 3.65, z: 1.4},//27
    {x: 0.35, y: 3.35, z: 1.6},//28
    {x: 0.65, y: 3.65, z: 1.6},//29
], [

    [12, 13, 14, 15],
    [0, 1, 13, 12, 8, 4],
    [3, 2, 14, 15, 11, 7],
    [1, 2, 14, 13],
    [0, 3, 7, 4],
    [4, 7, 11, 8],
    [17, 16, 18, 19],
    [8, 11, 17, 16],
    [8, 12, 18, 16],
    [15, 11, 17, 19],
    [15, 12, 18, 19],
    [20, 21, 22],
    [23, 24, 25],
    [26, 27, 29, 28]

], 'maxpoint')

const screen2 = new Object(position = {x: 0, y: 0, z: 0}, [
    {x: 11.2, y: 4.2, z: 0.2},
    {x: 11.2, y: 5.8, z: 0.2},
    {x: 11.2, y: 4.2, z: 2.8},
    {x: 11.2, y: 5.8, z: 2.8}
], [
    [0, 1, 3, 2]
], 'maxpoint')

const gaem3 = new Object(position = {x: 10, y: 0, z: 6}, [
    {x: 0, y: 0, z: 0},//0
    {x: 3, y: 0, z: 0},//1
    {x: 3, y: 0, z: 3},//2
    {x: 0, y: 0, z: 3},//3

    {x: 0, y: 3, z: 0},//4
    {x: 3, y: 3, z: 0},//5
    {x: 3, y: 3, z: 3},//6
    {x: 0, y: 3, z: 3},//7

    {x: 1, y: 4, z: 0},//8
    {x: 3, y: 4, z: 0},//9
    {x: 3, y: 4, z: 3},//10
    {x: 1, y: 4, z: 3},//11

    {x: 1, y: 6, z: 0},//12
    {x: 3, y: 6, z: 0},//13
    {x: 3, y: 6, z: 3},//14
    {x: 1, y: 6, z: 3},//15

    {x: 1.2, y: 4.2, z: 0.2},//16
    {x: 1.2, y: 4.2, z: 2.8},//17
    {x: 1.2, y: 5.8, z: 0.2},//18
    {x: 1.2, y: 5.8, z: 2.8},//19

    {x: 0.4, y: 3.35, z: 1.15},//20
    {x: 0.6, y: 3.65, z: 1.15},//21
    {x: 0.4, y: 3.35, z: 1.45},//22
    {x: 0.6, y: 3.65, z: 1.45},//23

    {x: 0.4, y: 3.35, z: 1.55},//24
    {x: 0.6, y: 3.65, z: 1.55},//25
    {x: 0.4, y: 3.35, z: 1.85},//26
    {x: 0.6, y: 3.65, z: 1.85},//27

    {x: 0.4, y: 3.35, z: 1.95},//28
    {x: 0.6, y: 3.65, z: 1.95},//29
    {x: 0.4, y: 3.35, z: 2.25},//30
    {x: 0.6, y: 3.65, z: 2.25},//31

    {x: 0.4, y: 3.35, z: 0.75},//32
    {x: 0.6, y: 3.65, z: 0.75},//33
    {x: 0.4, y: 3.35, z: 1.05},//34
    {x: 0.6, y: 3.65, z: 1.05},//35

], [

    [12, 13, 14, 15],
    [0, 1, 13, 12, 8, 4],
    [3, 2, 14, 15, 11, 7],
    [1, 2, 14, 13],
    [0, 3, 7, 4],
    [4, 7, 11, 8],
    [17, 16, 18, 19],
    [8, 11, 17, 16],
    [8, 12, 18, 16],
    [15, 11, 17, 19],
    [15, 12, 18, 19],

    [20, 21, 23, 22],
    [24, 25, 27, 26],
    [28, 29, 31, 30],
    [32, 33, 35, 34]


], 'maxpoint')

const screen3 = new Object(position = {x: 0, y: 0, z: 0}, [
    {x: 11.2, y: 4.2, z: 6.2},
    {x: 11.2, y: 5.8, z: 6.2},
    {x: 11.2, y: 4.2, z: 8.8},
    {x: 11.2, y: 5.8, z: 8.8}
], [
    [0, 1, 3, 2]
], 'maxpoint')

/*
let moonv = []
let moone = []
const n = 30
const moonr = 300
for(let i = 0; i < n; i++){
    moonv.push({x: 0, y: moonr * Math.sin(Math.PI * 2 * i / n), z: moonr * Math.cos(Math.PI * 2 * i / n)})
}
for(let i = 0; i < n; i++){
    moone.push([i, (i + 1) % n])
}
const moon = new HollowObject(position = {x: 1000, y: 500, z: 100}, moonv, moone)*/



//var ae = new Audio('bassnbs.mp3')


const intwidth = 3
const gi1 = new Interaction(position = {x: gaem1.position.x - intwidth, z: gaem1.position.z}, intwidth, intwidth, 'packman')
const gi2 = new Interaction(position = {x: gaem2.position.x - intwidth, z: gaem2.position.z}, intwidth, intwidth, 'battleship')
const gi3 = new Interaction(position = {x: gaem3.position.x - intwidth, z: gaem3.position.z}, intwidth, intwidth, 'life')

let snow = []


function animateHub() {
    start = Date.now()
    requestAnimationFrame(animateHub)
    hubc.clearRect(0, 0, hubcanvas.width, hubcanvas.height)
    snow.forEach(pr => {
        pr.update()
    })
    grid.points.forEach(p => {
        p.velocity.y = Math.sin((Date.now() / 1000) + (Math.abs(p.position.x) + Math.abs(p.position.z)) * Math.PI / 300) / 10
    })
    points.forEach(p => {
        p.update()
    })
    edges.forEach(e => {
        e.update()
    })
    faces.sort(compare)

    faces.forEach(f => {
        f.update()
    })
    spectator.update()
}
animateHub()



function createSnow() {
    let newSnow = new Snow(position = {alpha: Math.random() * 2 * Math.PI, y: 50, r: 35}, [
        {x: 1, y: 0, z: 0},
        {x: 0, y: 1, z: 0},
        {x: 0, y: 0, z: 1}
    ], [[0, 1, 2]], 'maxpoint', velocity = {alpha: (Math.random() - 0.5) * 0.01, y: -0.07, r: (Math.random() - 0.5) * 0}, angles = {alpha: 0, beta: 0}, angleVelocity = {alpha: 0.01, beta: 0.01})
    snow.push(newSnow)
    if(snow.length == 100){
        clearInterval(timerID)
    }
}

let timerID = setInterval(createSnow, 100)
/*
addEventListener('keydown', ({key}) => {
    switch (key){
        case 'w':
            spectator.velocity.x = 0.2
            break
        case 'a':
            spectator.velocity.z = -0.2
            break
        case 's':
            spectator.velocity.x = -0.2
            break
        case 'd':
            spectator.velocity.z = 0.2
            break
        case 'x':
            spectator.velocity.y = -0.2
            break
        case ' ':
            spectator.velocity.y = 0.2
            break
        case 'l':
            spectator.angleVelocity.beta = 0.02
            break
        case 'i':
            if(spectator.alpha < Math.PI / 2){
                spectator.angleVelocity.alpha = 0.02
            }
            break
        case 'k':
            if(spectator.alpha > -Math.PI / 2){
                spectator.angleVelocity.alpha = -0.02
            }
            break
        case 'j':
            spectator.angleVelocity.beta = -0.02
            break
        case 'e':
            if(spectator.position.x > gi1.position.x && spectator.position.x < gi1.position.x + gi1.height && spectator.position.z > gi1.position.z && spectator.position.z < gi1.position.z + gi1.width){
                gi1.action()
            }
            else if(spectator.position.x > gi2.position.x && spectator.position.x < gi2.position.x + gi2.height && spectator.position.z > gi2.position.z && spectator.position.z < gi2.position.z + gi2.width){
                gi2.action()
            }
            else if(spectator.position.x > gi3.position.x && spectator.position.x < gi3.position.x + gi3.height && spectator.position.z > gi3.position.z && spectator.position.z < gi3.position.z + gi3.width){
                gi3.action()
            }
    }
})

addEventListener('keyup', ({key}) => {
    switch (key){
        case 'w': case 's':
            spectator.velocity.x = 0
            break
        case 'a': case 'd':
            spectator.velocity.z = 0
            break
        case 'x': case ' ':
            spectator.velocity.y = 0
            break
        case 'l': case 'j':
            spectator.angleVelocity.beta = 0
            break
        case 'i': case 'k':
            spectator.angleVelocity.alpha = 0
            break
    }
})
*/

addEventListener('keydown', ({key}) => {
    if(gamestate == 'hub') {

    switch (key){
        case 'w':
            spectator.velocity.x = 0.2
            break
        case 'a':
            spectator.velocity.z = -0.2
            break
        case 's':
            spectator.velocity.x = -0.2
            break
        case 'd':
            spectator.velocity.z = 0.2
            break
        case ' ':
            if(isOnFloor()){
                spectator.velocity.y = 0.3
            }
            break
        case 'l':
            spectator.angleVelocity.beta = 0.02
            break
        case 'i':
            if(spectator.alpha < Math.PI / 2){
                spectator.angleVelocity.alpha = 0.02
            }
            break
        case 'k':
            if(spectator.alpha > -Math.PI / 2){
                spectator.angleVelocity.alpha = -0.02
            }
            break
        case 'j':
            spectator.angleVelocity.beta = -0.02
            break
        case 'e':
            if(spectator.position.x > gi1.position.x && spectator.position.x < gi1.position.x + gi1.height && spectator.position.z > gi1.position.z && spectator.position.z < gi1.position.z + gi1.width){
                gi1.action()
            }
            else if(spectator.position.x > gi2.position.x && spectator.position.x < gi2.position.x + gi2.height && spectator.position.z > gi2.position.z && spectator.position.z < gi2.position.z + gi2.width){
                gi2.action()
            }
            else if(spectator.position.x > gi3.position.x && spectator.position.x < gi3.position.x + gi3.height && spectator.position.z > gi3.position.z && spectator.position.z < gi3.position.z + gi3.width){
                gi3.action()
            }
            break
    }
}})

addEventListener('keyup', ({key}) => {
    if(gamestate == 'hub') {

    switch (key){
        case 'w': case 's':
            spectator.velocity.x = 0
            break
        case 'a': case 'd':
            spectator.velocity.z = 0
            break
        case 'l': case 'j':
            spectator.angleVelocity.beta = 0
            break
        case 'i': case 'k':
            spectator.angleVelocity.alpha = 0
            break
    }
}})

function isOnQuad(pointX, pointY, px1, py1, px2, py2, px3, py3, px4, py4){
    let ans = false

    let vx = pointX - px1
    let vy = pointY - py1
    let vx2 = px2 - px1
    let vy2 = py2 - py1
    let vx3 = px3 - px1
    let vy3 = py3 - py1
    let alpha1, beta1, alpha2, beta2


    alpha1 = (vx * vy3 - vx3 * vy) / (vx2 * vy3 - vx3 * vy2)
    beta1 = (vx2 * vy - vx * vy2) / (vx2 * vy3 - vx3 * vy2)

    vx = pointX - px2
    vy = pointY - py2
    vx2 *= -1
    vy2 *= -1
    vx3 = px3 - px2
    vy3 = py3 - py2


    alpha2 = (vx * vy3 - vx3 * vy) / (vx2 * vy3 - vx3 * vy2)
    beta2 = (vx2 * vy - vx * vy2) / (vx2 * vy3 - vx3 * vy2)
    
    ans = ans || (alpha1 > 0 && alpha1 < 1 && beta1 > 0 && beta1 < 1 && alpha2 > 0 && alpha2 < 1 && beta2 > 0 && beta2 < 1)

    vx = pointX - px4
    vy = pointY - py4
    vx2 = px2 - px4
    vy2 = py2 - py4
    vx3 = px3 - px4
    vy3 = py3 - py4

    alpha1 = (vx * vy3 - vx3 * vy) / (vx2 * vy3 - vx3 * vy2)
    beta1 = (vx2 * vy - vx * vy2) / (vx2 * vy3 - vx3 * vy2)


    vx = pointX - px3
    vy = pointY - py3
    vx2 = px2 - px3
    vy2 = py2 - py3
    vx3 = px4 - px3
    vy3 = py4 - py3

    alpha2 = (vx * vy3 - vx3 * vy) / (vx2 * vy3 - vx3 * vy2)
    beta2 = (vx2 * vy - vx * vy2) / (vx2 * vy3 - vx3 * vy2)

    ans = ans || (alpha1 > 0 && alpha1 < 1 && beta1 > 0 && beta1 < 1 && alpha2 > 0 && alpha2 < 1 && beta2 > 0 && beta2 < 1)

    return ans
}

addEventListener('click', mouse =>{
    if(gamestate == 'hub'){
    let htpw = document.getElementById('howToPlayWindow')
    htpw.style.display = 'none'
    if(isOnQuad(mouse.clientX, mouse.clientY, screen1.points[0].image.x, screen1.points[0].image.y, screen1.points[1].image.x, screen1.points[1].image.y, screen1.points[2].image.x, screen1.points[2].image.y, screen1.points[3].image.x, screen1.points[3].image.y)){
        gi1.action()
    }
    else if(isOnQuad(mouse.clientX, mouse.clientY, screen2.points[0].image.x, screen2.points[0].image.y, screen2.points[1].image.x, screen2.points[1].image.y, screen2.points[2].image.x, screen2.points[2].image.y, screen2.points[3].image.x, screen2.points[3].image.y)){
        gi2.action()
    }
    else if(isOnQuad(mouse.clientX, mouse.clientY, screen3.points[0].image.x, screen3.points[0].image.y, screen3.points[1].image.x, screen3.points[1].image.y, screen3.points[2].image.x, screen3.points[2].image.y, screen3.points[3].image.x, screen3.points[3].image.y)){
        gi3.action()
    }
}})












//ДАЛЬШЕ БУДЕТ ПАКМАН


































//document.addEventListener("DOMContentLoaded", function() {
  
const packmancanvas = document.getElementById('packmanCanvas')
const packmanc = packmancanvas.getContext('2d')

const scoreElpm = document.querySelector('#scoreEl') //счётчик баллов - съеденых точечек



let state = 'study'

let canvasHTML = document.getElementById("packmanCanvas");


if(innerWidth / innerHeight > 39 / 23){
    packmancanvas.height = innerHeight
    packmancanvas.width = innerHeight * (39 / 23)
}
else{
    packmancanvas.width = innerWidth
    packmancanvas.height = innerWidth * (23 / 39)
}

packmancanvas.height *= 1
packmancanvas.width *= 1
/*
packmancanvas.width = innerWidth * 0.94
packmancanvas.height = innerHeight * 0.93*/

// function resize() {
//     packmancanvas.width = innerWidth * 0.94
//     packmancanvas.height = innerHeight * 0.93
// }

// function clearpackmancanvas(packmancanvas) {
// 	packmancanvas.width = packmancanvas.width;
// }
/*
const marleft = (innerWidth - packmancanvas.width) / 2;
console.log(marleft)
canvasHTML.style.marginLeft = marleft;
*/

let minedge = Math.min(packmancanvas.height, packmancanvas.width)

let animationId

class Boundary {
    static width = minedge / 23 // создали статическое значение ширины и высоты границы
    static height = minedge / 23
    constructor({ position }) { //square
        this.position = position
        this.width = minedge / 23
        this.height = minedge / 23

        // this.image = image
    }

    
    draw() {
            packmanc.fillStyle = '#00ff00'
            packmanc.fillRect(this.position.x - 1, this.
            position.y - 1, this.width + 1, this.height + 1)
    
            //packmanc.drawImage(this.image, this.position.x, this.position.y)
        }
    }

class PlayerPM { //packman
    static speed = (4 / 40) * Boundary.height
    constructor ({
        position,
        velocity }) {
        this.position = position 
        this.velocity = velocity //speed
        this. radius = (15 / 40) * Boundary.width //увеличили радиус самого пакмана (до этого был 10) !! ПОДУМАТЬ КАК СДЕЛАТЬ АДАПТИВНОСТЬ
        this.radians = 0.75
        this.openRate = 0.12
        this.rotation = 0 
    }

    draw() { //создаём дугу - круг - пакман
        packmanc.save() //режим сохранения и обновления
        packmanc.translate(this.position.x, this.position.y)
        packmanc.rotate(this.rotation) //делаем так, чтобы пакман крутился при движениии -- число pi значит, что ты поворачиваешься на 180 гард прот час стрелки (Math.PI) -- поменяли на зис.ротатион 
        packmanc.translate(-this.position.x, -this.position.y)
        packmanc.beginPath()
        packmanc.arc (this.position.x, this.position.y, this.radius,
        this.radians, Math.PI * 2 - this.radians)
        packmanc.lineTo (this.position.x, this.position.y)
        packmanc.fillStyle = 'yellow'
        packmanc.fill()
        packmanc.closePath()
        packmanc.restore()
    }

    update() {
        this.draw() //вызываем предыдущий код с драв
        this.position.x += this.velocity.x //каждый раз мы просто добавляем к скорости игрока х или у
        this.position.y += this.velocity.y

        if (this.radians < 0 || this.radians > 0.75) this.openRate = - this.openRate
            this.radians += this.openRate
    }
}

class Ghost { 
    static speed = 2
    constructor ({
        position, velocity, color = 'red' }) {
        this.position = position 
        this.velocity = velocity 
        this. radius = (15 / 40) * Boundary.width
        this.color = color
        this.prevCollisions = []
        this.speed = 2
        this.scared = false 
    }

    draw() { 
        packmanc.beginPath()
        packmanc.arc (this.position.x, this.position.y, this.radius,
        0, Math.PI * 2)
        packmanc.fillStyle = this.scared ? 'blue' : this.color //меняем цвет призрака при поедании паверапа
        packmanc.fill()
        packmanc.closePath()
    }

    update() {
        this.draw() 
        this.position.x += this.velocity.x 
        this.position.y += this.velocity.y
    }
}

class Pellet { //food
    constructor ({position }) {
        this.position = position 
        this. radius = (2 / 40) * Boundary.width //увеличили радиус самого пакмана (до этого был 10) !! ПОДУМАТЬ КАК СДЕЛАТЬ АДАПТИВНОСТЬ
    }

    draw() { //создаём дугу - круг - пакман
        packmanc.beginPath()
        packmanc.arc (this.position.x, this.position.y, this.radius,
        0, Math.PI * 2)
        packmanc.fillStyle = 'white'
        packmanc.fill()
        packmanc.closePath()
    }
}

class PowerUp {
    constructor ({position }) {
        this.position = position 
        this. radius = (8 / 40) * Boundary.width
    }

    draw() { 
        packmanc.beginPath()
        packmanc.arc (this.position.x, this.position.y, this.radius,
        0, Math.PI * 2)
        packmanc.fillStyle = 'white'
        packmanc.fill()
        packmanc.closePath()
    }
}

const pellets = []
const powerUps = []
const boundaries = [] 
const ghosts = [
    new Ghost ({
        position: {
            x: Boundary.width * 18 + Boundary.width * 2.5,  
            y: Boundary.height + Boundary.height * 1.5
        },
        velocity: {
            x: Ghost.speed,
            y: 0
        }
    }),
    new Ghost ({
        position: {
            x: Boundary.width * 18 + Boundary.width * 2.5,  
            y: Boundary.height * 19 + Boundary.height * 1.5
        },
        velocity: {
            x: Ghost.speed,
            y: 0
        }
    }),
    new Ghost ({
        position: {
            x: Boundary.width * 1 + Boundary.width * 2.5,  
            y: Boundary.height * 19 + Boundary.height * 1.5
        },
        velocity: {
            x: Ghost.speed,
            y: 0
        }
    }),
    new Ghost ({
        position: {
            x: Boundary.width * 18 + Boundary.width * 2.5,  
            y: Boundary.height * 7 + Boundary.height * 1.5
        },
        velocity: {
            x: Ghost.speed,
            y: 0
        }
    })
    
]

const playerPM = new PlayerPM ({
    position: {
        x: Boundary.width + Boundary.width * 2.5 , //ширина границы + 1\2 ширины границы = серидина границы 
        y: Boundary.height + Boundary.height * 1.5
    },
    velocity: {
        x:0,
        y:0
    }
})

// создаём переменные букв (кнопок) - определяет, какие кнопки нажимаются
const keysPM = {
    w: {
        pressed: false //нажата w  по умолчанию ? - нет - false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    }
}

const map = [
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ' ', ' ', ' ', '-', '-', '-', '-', '-', '-', '-', '-', '-', ' ', ' ', ' ', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ' '],
    [' ', '-', ' ', '.', '.', '.', '.', '.', '.', '.', 'p', '-', '-', '-', '-', '-', '.', '.', '.', '.', '.', '.', '.', '-', '-', '-', '-', '-', '.', '.', '.', '.', '.', '.', '.', '.', 'p', '-', ' '],
    [' ', '-', '.', '-', '-', '-', '.', '-', '-', '-', '.', '.', '.', '.', '.', '.', '.', '-', '-', '-', '-', '-', '.', '.', '.', '.', '.', '.', '.', '-', '-', '-', '.', '-', '-', '-', '.', '-', ' '],
    [' ', '-', '.', '.', '.', '-', '.', '-', '.', '.', '.', '-', '-', '-', '-', '-', '.', '.', '.', '.', '.', '.', '.', '-', '-', '-', '-', '-', '.', '.', '.', '-', '.', '-', '.', '.', '.', '-', ' '],
    [' ', '-', '-', '-', '.', '-', '.', '-', '.', '-', '.', '-', '.', '.', '.', '.', '.', '-', '-', '-', '-', '-', '.', '.', '.', '.', '.', '-', '.', '-', '.', '-', '.', '-', '.', '-', '-', '-', ' '],
    [' ', '-', '.', '.', '.', '-', '.', '.', '.', '.', '.', '-', '.', '-', '-', '-', '.', '.', '.', '-', '.', '.', '.', '-', '-', '-', '.', '-', '.', '.', '.', '.', '.', '-', '.', '.', '.', '-', ' '],
    [' ', '-', '.', '-', '.', '-', '.', '-', '.', '-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-', '.', '-', '.', '-', '.', '-', '.', '-', ' '],
    [' ', '-', '.', '-', '.', '-', '.', '.', '.', '-', '.', '-', '.', '.', '.', '.', '.', '-', '.', '.', '.', '-', 'p', '.', '.', '.', '.', '-', '.', '-', '.', '.', '.', '-', '.', '-', '.', '-', ' '],
    [' ', '-', '.', '-', '.', '.', '.', '-', '-', '-', '.', '.', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '.', '.', '-', '-', '-', '.', '.', '.', '-', '.', '-', ' '],
    [' ', '-', '.', '.', '.', '-', '.', '.', '.', '.', '.', '-', '.', '-', '.', '.', '.', '.', '.', '-', '.', '.', '.', '.', '.', '-', '.', '-', '.', '.', '.', '.', '.', '-', '.', '.', '.', '-', ' '],
    [' ', '-', '-', '-', '.', '-', '-', '.', '-', '-', '-', '-', '.', '-', '-', '-', '.', '-', '-', '-', '-', '-', '.', '-', '-', '-', '.', '-', '-', '-', '-', '.', '-', '-', '.', '-', '-', '-', ' '],
    [' ', '-', '.', '.', '.', '-', '.', '.', '.', '.', '.', '-', '.', '-', '.', '.', '.', '.', '.', '-', '.', '.', '.', '.', '.', '-', '.', '-', '.', '.', '.', '.', '.', '-', '.', '.', '.', '-', ' '],
    [' ', '-', '.', '-', '.', '-', '.', '-', '-', '-', '.', '.', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '.', '.', '-', '-', '-', '.', '-', '.', '-', '.', '-', ' '],
    [' ', '-', '.', '-', '.', '.', '.', '.', '.', '-', '.', '-', '.', '.', '.', '.', 'p', '-', '.', '.', '.', '-', '.', '.', '.', '.', '.', '-', '.', '-', '.', '.', '.', '.', '.', '-', '.', '-', ' '],
    [' ', '-', '.', '-', '.', '-', '.', '-', '.', '-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-', '.', '-', '.', '-', '.', '-', '.', '-', ' '],
    [' ', '-', '.', '.', '.', '-', '.', '.', '.', '.', '.', '-', '.', '-', '-', '-', '.', '.', '.', '-', '.', '.', '.', '-', '-', '-', '.', '-', '.', '.', '.', '.', '.', '-', '.', '.', '.', '-', ' '],
    [' ', '-', '.', '-', '-', '-', '.', '-', '.', '-', '.', '-', '.', '.', '.', '.', '.', '-', '-', '-', '-', '-', '.', '.', '.', '.', '.', '-', '.', '-', '.', '-', '.', '-', '-', '-', '.', '-', ' '],
    [' ', '-', '.', '.', '.', '-', '.', '-', '.', '.', '.', '-', '-', '-', '-', '-', '.', '.', '.', '.', '.', '.', '.', '-', '-', '-', '-', '-', '.', '.', '.', '-', '.', '-', '.', '.', '.', '-', ' '],
    [' ', '-', '.', '-', '.', '.', '.', '-', '-', '-', '.', '.', '.', '.', '.', '.', '.', '-', '-', '-', '-', '-', '.', '.', '.', '.', '.', '.', '.', '-', '-', '-', '.', '.', '.', '-', '.', '-', ' '],
    [' ', '-', 'p', '.', '.', '-', '.', '.', '.', '.', '.', '-', '-', '-', '-', '-', '.', '.', '.', '.', '.', '.', '.', '-', '-', '-', '-', '-', 'p', '.', '.', '.', '.', '-', '.', '.', '.', '-', ' '],
    [' ', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ' ', ' ', ' ', '-', '-', '-', '-', '-', '-', '-', '-', '-', ' ', ' ', ' ', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
]
    //генерация каждого нового квадрата + мы перенесли карту для облегчения кода

console.log(map.length, map[0].length)
//создаём картинку к границам не вызывая её каждый раз, а с помощью ретёрна
// function creatImage(src) {
//     const image = new Image () //вставили картинку !!source = src!!
//     image.src = src
//     return image
// }
let lastKey
let scorePM
function newPackmanGame(){
    playerPM.position.x = Boundary.width + Boundary.width * 1.5
    playerPM.position.y = Boundary.height + Boundary.height * 1.5
    playerPM.velocity.x = 0
    playerPM.velocity.y = 0

    ghosts[0].position.x = Boundary.width * 18 + Boundary.width * 2.5,  
    ghosts[0].position.y = Boundary.height + Boundary.height * 1.5
    ghosts[0].velocity.x = Ghost.speed
    ghosts[0].velocity.y = 0

    ghosts[1].position.x = Boundary.width * 18 + Boundary.width * 2.5,
    ghosts[1].position.y = Boundary.height * 19 + Boundary.height * 1.5
    ghosts[1].velocity.x = Ghost.speed
    ghosts[1].velocity.y = 0

    ghosts[2].position.x = Boundary.width * 1 + Boundary.width * 2.5,
    ghosts[2].position.y = Boundary.height * 19 + Boundary.height * 1.5
    ghosts[2].velocity.x = Ghost.speed
    ghosts[2].velocity.y = 0

    ghosts[3].position.x = Boundary.width * 18 + Boundary.width * 2.5,
    ghosts[3].position.y = Boundary.height * 7 + Boundary.height * 1.5
    ghosts[3].velocity.x = Ghost.speed
    ghosts[3].velocity.y = 0


    state = 'ingame'
    lastKey = "" //установили последнюю нажатую кнопку, чтобы ничего не паехалоо, как моя крыша
    scorePM = 0
    scoreElpm.innerHTML = scorePM

    map.forEach((row, i) => { //i представляет в какой строке мы находимся в данный момент нашего цикла (индекс)
        row.forEach((symbol, j) => {
            switch (symbol) {
                case '-':
                    boundaries.push(
                        new Boundary({
                            position: {
                                x: Boundary.width * j,
                                y: Boundary.height * i
                            },
                        })
                    )
                    break
                case '.': //создаём еду для пакмана -- массив
                    pellets.push (
                        new Pellet ({
                            position: {
                                x: j * Boundary.width + Boundary.width / 2,
                                y: i * Boundary.height + Boundary.height / 2
                            }
                        })
                    ) 
                    break

                    case 'p': //создаём еду для пакмана -- поверап
                    powerUps.push (
                        new PowerUp ({
                            position: {
                                x: j * Boundary.width + Boundary.width / 2,
                                y: i * Boundary.height + Boundary.height / 2
                            }
                        })
                    ) 
                    break
            }
        })
    })
    
    animationId = setInterval(animatePackman, 18)
}



function circleCollidesWithRectangle ({ circle, rectangle }) { //столкновение круга и квадрата
    const padding = Boundary.width / 2 - circle.radius - 1
    return(
        circle.position.y - circle.radius + circle.velocity.y 
        <= 
        rectangle.position.y + rectangle.height + padding && 
        circle.position.x + circle.radius + circle.velocity.x 
        >= 
        rectangle.position.x - padding && 
        circle.position.y + circle.radius +  circle.velocity.y 
        >= 
        rectangle.position.y - padding && 
        circle.position.x - circle.radius + circle.velocity.x 
        <= 
        rectangle.position.x + rectangle.width + padding
    )
}


//newPackmanGame()
//создаём зацикленную анимацию, чтобы пакман двигался
function animatePackman() {

    //animationId = requestAnimationFrame(animate) 
    //будет анимировать пкамана пока мы не скажем ему делать движения иначе
    packmanc.clearRect(0, 0, packmancanvas.width, packmancanvas.height) //чтобы не было хвостика за пакманом

    // function close() {
    //     let packmancanvas = document.getElementById("packmancanvas");
    //     packmancanvas.style.display="none";
    //     let bb = document.getElementById("close");
    //     bb.style.display="block"; 
    // }




    // цикл анимации скорости
    if (keysPM.w.pressed && lastKey === 'w') {
        for (let i = 0; i < boundaries.length; i++) { //i -- итератор; добавляем 1 к i, пока она не станет больше длинны границ
            const boundary = boundaries [i]
            if (
            circleCollidesWithRectangle({
                circle: {
                    ...playerPM, 
                    velocity: {
                        x: 0,
                        y: -PlayerPM.speed
                }
                }, //многоточие -- spread
                rectangle: boundary
            })
        ) {
            playerPM.velocity.y = 0
            break
        } else {
            playerPM.velocity.y = -PlayerPM.speed
        }
        }

    } else if (keysPM.a.pressed && lastKey === 'a') {
        for (let i = 0; i < boundaries.length; i++) { //i -- итератор; добавляем 1 к i, пока она не станет больше длинны границ
            const boundary = boundaries [i]
            if (
            circleCollidesWithRectangle({
                circle: {
                    ...playerPM, 
                    velocity: {
                        x: -PlayerPM.speed, //боковушка
                        y: 0
                }
                }, //многоточие -- spread
                rectangle: boundary
            })
        ) {
            playerPM.velocity.x = 0
            break
        } else {
            playerPM.velocity.x = -PlayerPM.speed //идём влево, когда нажимаем клавишу а
        }
        }
    } else if (keysPM.s.pressed && lastKey === 's') {
        for (let i = 0; i < boundaries.length; i++) { //i -- итератор; добавляем 1 к i, пока она не станет больше длинны границ
            const boundary = boundaries [i]
            if (
            circleCollidesWithRectangle({
                circle: {
                    ...playerPM, 
                    velocity: {
                        x: 0,
                        y: PlayerPM.speed
                }
                }, //многоточие -- spread
                rectangle: boundary
            })
        ) {
            playerPM.velocity.y = 0
            break
        } else {
            playerPM.velocity.y = PlayerPM.speed
        }
        }

    } else if (keysPM.d.pressed && lastKey === 'd') {
        for (let i = 0; i < boundaries.length; i++) { //i -- итератор; добавляем 1 к i, пока она не станет больше длинны границ
            const boundary = boundaries [i]
            if (
            circleCollidesWithRectangle({
                circle: {
                    ...playerPM, 
                    velocity: {
                        x: PlayerPM.speed,
                        y: 0
                }
                }, //многоточие -- spread
                rectangle: boundary
            })
        ) {
            playerPM.velocity.x = 0
            break
        } else {
            playerPM.velocity.x = PlayerPM.speed
        }
        }
    }

    //коллизия между призраком и играком
    for (let i = ghosts.length - 1; 0 <= i; i -- ) {
        const ghost = ghosts [i]
     //призрак докасается до игрока - проигрывем 
    if (
        Math.hypot (
            ghost.position.x - playerPM.position.x,
            ghost.position.y - playerPM.position.y
        )   < 
            ghost.radius + playerPM.radius 
        )   {
            if (ghost.scared){ // если призрак синий, то мы касаемся его и удалем из игры
                ghosts.splice (i, 1)
            }
            else {
                clearTimeout(animationId)
                console.log ('You lose :(')
                endScreen()
            }
        }
    }

    //
    if (pellets.length === 0) {
        console.log ('you win')
        clearTimeout(animationId)
    }


    //делаем точечку для буста очков 
    for (let i = powerUps.length - 1; 0 <= i; i -- ) {
        const powerUp = powerUps [i]
        powerUp.draw() 

        //столкновение пакмана с поверапом
        if (
            Math.hypot (
                powerUp.position.x - playerPM.position.x,
                powerUp.position.y - playerPM.position.y
            )   < 
            powerUp.radius + playerPM.radius
        ) {
            powerUps.splice(i, 1)

            //отгоныем приведений
            ghosts.forEach ((ghost) => {
                ghost.scared = true 

                setTimeout(() => {
                    ghost.scared = false
                }, 5000)
            })
        }

    }

    //движение с конца (?) -- зацикливаемся и удалаем с обратной стороны
    for (let i = pellets.length - 1; 0 <= i; i -- ) {
        const pellet = pellets [i]
        pellet.draw()

        //прописываем поедание точечек -- гипотинуза -- самая длинная сторона прям треугольника -- расст между центрома точечки и центром игрока
        if (
            Math.hypot (
                pellet.position.x - playerPM.position.x,
                pellet.position.y - playerPM.position.y
            )   < 
            pellet.radius + playerPM.radius
        )   {
            pellets.splice(i, 1)
            scorePM += 10 //считаем съеденные шарики
            scoreElpm.innerHTML = scorePM
        }
    } 
    

    boundaries.forEach((boundary) => {
        boundary.draw()

        //распознаём барьеры, перпятствия 
        //пересекается ли одна из границ с нашим игроком?
        //сравниваем сторону грока со сторонами границы 
        //если верхняя часть игрока меньше точки, где проходит нижняя граница кубика - эти две тчк равны
        if (
            circleCollidesWithRectangle({
                circle: playerPM,
                rectangle: boundary
            })
            // playerPM.position.y - playerPM.radius + playerPM.velocity.y 
            // <= 
            // boundary.position.y + boundary.height && 
            // playerPM.position.x + playerPM.radius + playerPM.velocity.x 
            // >= 
            // boundary.position.x && 
            // playerPM.position.y + playerPM.radius +  playerPM.velocity.y 
            // >= 
            // boundary.position.y && 
            // playerPM.position.x - playerPM.radius + playerPM.velocity.x 
            // <= 
            // boundary.position.x + boundary.width
        ) {
            //console.log('we are colliding')
            playerPM.velocity.x = 0
            playerPM.velocity.y = 0
        }
    })
    playerPM.update () //раньше здесь было playerPM.draw (), но за дров теперь отвечает апдейт тк скорость игрока каждый раз увеличивается


    //движение призрака!!!!!!!!!!!!!!!!
    ghosts.forEach ((ghost) => {
        ghost.update()



        const collisions = []
        boundaries.forEach(boundary => {
            if (
                !collisions.includes('right') &&
                circleCollidesWithRectangle({
                    circle: {
                        ...ghost, 
                        velocity: {
                            x: ghost.speed,
                            y: 0
                    }
                    }, 
                    rectangle: boundary
                })
            ) {
                collisions.push ('right')
            }

            if (
                !collisions.includes('left') &&
                circleCollidesWithRectangle({
                    circle: {
                        ...ghost, 
                        velocity: {
                            x: -ghost.speed,
                            y: 0
                    }
                    }, 
                    rectangle: boundary
                })
            ) {
                collisions.push ('left')
            }
            if (
                !collisions.includes('up') &&
                circleCollidesWithRectangle({
                    circle: {
                        ...ghost, 
                        velocity: {
                            x: 0,
                            y: -ghost.speed
                    }
                    }, 
                    rectangle: boundary
                })
            ) {
                collisions.push ('up')
            }

            if (
                !collisions.includes('down') &&
                circleCollidesWithRectangle({
                    circle: {
                        ...ghost, 
                        velocity: {
                            x: 0,
                            y: ghost.speed
                    }
                    }, 
                    rectangle: boundary
                })
            ) {
                collisions.push ('down')
            }
        })
        if (collisions.length > ghost.prevCollisions.length)
            ghost.prevCollisions = collisions

        if (JSON.stringify (collisions) !== JSON.stringify (ghost.prevCollisions)) //json.stringify -- строчное значение
        {
            if (ghost.velocity.x > 0) ghost.prevCollisions.push('right')
            else if (ghost.velocity.x < 0) ghost.prevCollisions.push('left') //движ влевоо, если скорость по х меньше нуля
            else if (ghost.velocity.y < 0) ghost.prevCollisions.push('up')
            else if (ghost.velocity.y > 0) ghost.prevCollisions.push('down')

            //console.log(collisions)
            //console.log(ghost.prevCollisions)

            const pathways = ghost.prevCollisions.filter((collision //потенциальные пути -- фильтр столкновений 
                ) => {
                return !collisions.includes(collision)
            }) 
            //console.log ({ pathways })

            const direction = pathways [Math.floor (Math.random() * pathways.length)] //рандомный выбор пафвэя (пути, куда идёт призрак); math.floor - целочисленные (те без дробей)

            //console.log ({direction})

            switch (direction) {
                case 'down':
                    ghost.velocity.y = ghost.speed
                    ghost.velocity.x = 0
                    break

                case 'up':
                    ghost.velocity.y = -ghost.speed
                    ghost.velocity.x = 0
                    break

                case 'right':
                    ghost.velocity.y = 0
                    ghost.velocity.x = ghost.speed
                    break

                case 'left':
                    ghost.velocity.y = 0
                    ghost.velocity.x = -ghost.speed
                break
            }
            ghost.prevCollisions = []
        }
        //console.log(collisions)
    })
    if (playerPM.velocity.x > 0) playerPM.rotation = 0
    else if (playerPM.velocity.x < 0) playerPM.rotation = Math.PI
    else if (playerPM.velocity.y > 0) playerPM.rotation = Math.PI / 2
    else if (playerPM.velocity.y < 0) playerPM.rotation = Math.PI * 1.5
}

//animate()

//прослушиватели событий (считываем нажатие кнопки)
//позже установим скорость в цикле анимации (?)
//убрали скорость тк теперь оно само определяем правда ли, что кнопка нажата или нет
addEventListener('keydown', ({key}) => {
    if(gamestate == 'packman'){

    if(key == 'w' || key == 'a' || key == 'd' || key == 's'){ closeStudyscreen() }
    switch (key) {
        case 'w':
            keysPM.w.pressed = true
            lastKey = 'w' //предопределение последней нажатой клавиши, чтобы ничего не поехало
            break
        case 'a':
            keysPM.a.pressed = true
            lastKey = 'a'
            break
        case 's':
            keysPM.s.pressed = true
            lastKey = 's'
            break
        case 'd':
            keysPM.d.pressed = true
            lastKey = 'd'
            break
    }

}})


//keyup -- чтобы  он не двигался бесконечно по диагонали прописываем скорость на нулях
//убрали скорость как и в кейдаун тк если кнопка не нажата - не проигрываем
addEventListener('keyup', ({key}) => {
    if(gamestate == 'packman'){
    switch (key) {
        case 'w':
            keysPM.w.pressed = false
            //playerPM.velocity.y = 0
            break
        case 'a':
            keysPM.a.pressed = false
            //playerPM.velocity.x = 0
            break
        case 's':
            keysPM.s.pressed = false
            //playerPM.velocity.y = 0
            break
        case 'd':
            keysPM.d.pressed = false
            //playerPM.velocity.x = 0
            break
    }


}})

addEventListener('click', mouse => {
    console.log(gamestate, state)
    if(gamestate == 'packman'){
    let es = document.getElementById("endScreen");
    es.style.display="none";
    let cl = document.getElementById("close");
    cl.style.display="none";
    if(state == 'deathscreen'){
        console.log(126487)
        closeDeathscreen()
    }
    else{
        closeStudyscreen()
    }
}})

//экран при состоянии проигрышка
function endScreen() {
    state = 'deathscreen'
    /*let packmanCanvas = document.getElementById("packmanCanvas");
    packmanCanvas.style.display="none";*/
    let es = document.getElementById("endScreen");
    es.style.display="flex"; 
    let cl = document.getElementById("close");
    cl.style.display="flex";

    // p1.style.color="black";
}

function closeDeathscreen(){
    let packmanCanvas = document.getElementById("packmanCanvas");
    packmanCanvas.style.display="block";
    let es = document.getElementById("endScreen");
    es.style.display="none";
    let cl = document.getElementById("close");
    cl.style.display="none";
    /*let ss = document.getElementById("studyScreen");
    ss.style.display="none";
    let cl2 = document.getElementById("close2");
    cl2.style.display="none";*/

    p1.style.color="white";
    newPackmanGame()
}

//экран обучения
function closeStudyscreen(){
    let ss = document.getElementById("studyScreen");
    ss.style.display="none";
    let cl2 = document.getElementById("close2");
    cl2.style.display="none";
}

if (screen.width <= 600) {
    let ad = document.getElementById("anotherDevice");
    ad.style.display="flex";
    let packmanCanvas = document.getElementById("packmanCanvas");
    packmanCanvas.style.display="none";
    let p11 = document.getElementById("p1")
    p11.style.color="black";
    let sEl = document.getElementById("scoreEl")
    sEl.style.color="black";
} else {
    let ad = document.getElementById("anotherDevice");
    ad.style.display="none";
    let packmanCanvas = document.getElementById("packmanCanvas");
    packmanCanvas.style.display="flex";
    let p11 = document.getElementById("p1")
    p11.style.color="white";
    let sEl = document.getElementById("scoreEl")
    sEl.style.color="white";
}


function closePackman(){
    const pd = document.getElementById('pacmanDiv')
    pd.style.display = 'none'
    const hc = document.getElementById('hubCanvas')
    hc.style.display = 'flex'
    gamestate = 'hub'
    clearTimeout(animationId)
}














































































//КОРАБЛЬ
const canvas = document.getElementById('spaceCanvas')
const c = canvas.getContext('2d')
const scoreElbs = document.querySelector('#scoreEl')

canvas.width = innerWidth 
canvas.height = innerHeight 

state = 'study'

animationId

//создаём игрока 
class PlayerBS {
    constructor() {
        this.velocity = {
            x: 0,
            y: 0
        }

        this.opacity = 1

        const image = new Image()
        image.src = './imgSpace/spaceship.svg'
        image.onload =  () => { //при загрузке установи эти параметры
            const scale = 0.3
            this.image = image
            this.width = image.width * scale
            this.height = image.height * scale
            this.position = {
                x: canvas.width / 2 - this.width / 2,
                y: canvas.height - this.height - 20
            }
    
        }
    }

    draw() {
        c.save()
        c.globalAlpha = this.opacity
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
        c.restore()
    }

    update() {
        if (this.image) {//вызываем с.дравимадж, если картинка вообще существует
        this.draw()
        this.position.x += this.velocity.x //добавляем скорость х к позиции х игрока при кажд обновлении 
        }
    }
}


class Invader {
    constructor({position}) {
        this.velocity = {
            x: 0,
            y: 0
        }

        const image = new Image()
        image.src = './imgSpace/invader.svg'
        image.onload =  () => { 
            const scale = 0.5
            this.image = image
            this.width = image.width * scale
            this.height = image.height * scale
            this.position = {
                x: position.x,
                y: position.y
            }
        }
    }
       
    draw() {
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
    }

    update({velocity}) {
        if (this.image) {
        this.draw()
        this.position.x += velocity.x // не this.velocity тк передаём точку чеоез обновление
        this.position.y += velocity.y 
        }
    }

    //захватчики стреляют
    shoot(invaderProjectiles) {
        invaderProjectiles.push(
            new InvaderProjectile({
            position: {
                x: this.position.x + this.width / 2, 
                y: this.position.y + this.height
            },
            velocity: {
                x: 0,
                y: 5
            }
        }))
    }
}

//создание сетки захватчиков (хотя могли бы сделать массив но ладно)
class Grid {
    constructor() {
        this.position = {
            x: 0,
            y: 0
        }

        this.velocity = {
            x: 4,
            y: 0
        }

        this.invaders = [] //отображаем захватчиков -- создавая сетку - создаём нового захватчика

        const column = Math.floor(Math.random() * 8 + 5) 
        const rows = Math.floor(Math.random() * 5 + 2) //отображаем рандомное кол-во строк до 6, но никогда не меньше 2

        this.width = column * 63

        for(let x = 0; x < column; x++) {
            for(let y = 0; y < rows; y++) {
                this.invaders.push(new Invader({position: {
                    x: x * 65,
                    y: y * 65
                }})) //итератор равен нулю, 10 колон, итерация 1 для каждого цикла фор
            }
        }
    }
    update() {
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        this.velocity.y = 0

        if (this.position.x + this.width >= canvas.width || this.position.x <= 0) {
            this.velocity.x = -this.velocity.x
            this.velocity.y = 30
        }
    }
}

//создаём пульки
class Projectile {
    constructor({position, velocity}) {
        this.position = position
        this.velocity = velocity

        this.radius = 3.2
    }

    //РИСУЕМ КРУГЛУЮ ПУЛЬКУ
    draw() {
        c.beginPath() //НАЧАЛИ ДУГУ
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)  //обвели точку дугой -- создание круга
        c.fillStyle = 'red'
        c.fill()
        c.closePath() //ЗАКОНЧИЛИ ДУГУ 
    }

    update() {
        this.draw() // отображаем пульку
        this.position.x += this.velocity.x //добавляем скорость пулек
        this.position.y += this.velocity.y
    }
}

//создаём частицы, разлетающиеся при удалении
class Particle {
    constructor({position, velocity, radius, color, fades}) {
        this.position = position
        this.velocity = velocity

        this.radius = radius
        this.color = color 
        this.opacity = 1
        this.fades = fades
    }

    draw() {
        c.save()
        c.globalAlpha = this.opacity //исчезновение частиц
        c.beginPath() 
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)  
        c.fillStyle = this.color
        c.fill()
        c.closePath() 
        c.restore()
    }

    update() {
        this.draw() 
        this.position.x += this.velocity.x 
        this.position.y += this.velocity.y

        if (this.fades) this.opacity -= 0.01
    }
}

//пульки захватчиков
class InvaderProjectile {
    constructor({position, velocity}) {
        this.position = position
        this.velocity = velocity

        this.width = 3
        this.height = 10
    }

    draw() {
        c.fillStyle = 'white'
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }

    update() {
        this.draw() 
        this.position.x += this.velocity.x 
        this.position.y += this.velocity.y
    }
}

let playerBS
let projectiles
let grids //создаём массив из нескольких сеток
let invaderProjectiles
let particles

const keysBS = { //отследивание клавиш -- нажата? проигрывам! не нажата? стопаемся!
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    space: {
        pressed: false
    }
}

let frames
let randomInterval //создание второго грида с захватчиками
let game
let scoreBS

function newBattleshipsGame(){
    playerBS = new PlayerBS()
    projectiles = []
    grids = []
    invaderProjectiles = []
    particles = []
    frames = 0
    randomInterval = Math.floor(Math.random() * 500 + 1100)
    game = {
        over: false,
        active: true
    }
    scoreBS = 0
    console.log(game.active)
    //звёзды на бэкграунде
    for(let i = 0; i < 100; i++) {
        particles.push(new Particle({
            position:{ //рандомное расположение звёзд на фоне по оси х и y
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height
            }, 
            velocity: {
                x: 0,
                y: 0.2 //опускаются по оси х -- скорость
            },
            radius: Math.random() * 2,
            color:'white'
    }))}
    animationId = setInterval(animateBattleships, 15)

}

function createParticles({object, color, fades})  {
    //ЧАСТИЦЫ РАЗЛЕТАЮТСЯ ПРИ УДАРЕ корабля с ПУЛЬКОЙ
    for(let i = 0; i < 15; i++) {
        particles.push(new Particle({
            position:{
                x: object.position.x + object.width / 2, //середина по оси х и у
                y: object.position.y + object.width / 2
            }, 
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2
            },
            radius: Math.random() * 3,
            color: color || '#00FF00',
            fades
    }))}
}

function animateBattleships () {
    console.log(123123)

    //if (!game.active) return //если игра не активна -- весь последующий код не активируется
    c.fillStyle = 'black' 
    c.fillRect(0, 0, canvas.width, canvas.height)
    playerBS.update()
    particles.forEach((particle, i) => {

            //зациклили появление звёзд на бэке -- появление на осях
            if (particle.y - particle.radius >= canvas.height) {
                particle.position.x = Math.random() * canvas.width
                particle.position.y = -particle.radius
            }

        if(particle.opacity <= 0) {
            setTimeout(() => {
                particles.splice(i, 1)
            }, 0) 
            } else {
                particle.update()
            }
    })

    invaderProjectiles.forEach((invaderProjectile, index) => {
        if(invaderProjectile.position.y + invaderProjectile.height >= canvas.height) {
            setTimeout(() => {
                invaderProjectiles.splice(index, 1)    
            }, 0)
        } else invaderProjectile.update()

        
        //код обнаружения столкновения пульки и корабля
        if(
            invaderProjectile.position.y + invaderProjectile.height 
            >= 
            playerBS.position.y && 
            invaderProjectile.position.x + invaderProjectile.width 
            >= 
            playerBS.position.x &&
            invaderProjectile.position.x <= playerBS.position.x +
            playerBS.width
        ) { 
            console.log('you lose')

            //при попадании в игрока снаряд исчезает
            invaderProjectiles.splice(index, 1)    
            playerBS.opacity = 0
            game.over = true


            game.active = false

            createParticles({
                object: playerBS,
                color: '#00FF00',
                fades: true
            })
            clearTimeout(animationId)
            endScreenSpace()
        }
    })



    projectiles.forEach ((projectile, index) => {

        if (projectile.position.y + projectile.radius <= 0){ //нижняя ачсть снаряда < или = 0 -- находится за пределами верхней части экрана
            setTimeout(() => {
                projectiles.splice(index, 1)    
            }, 0) //нам нужен один доп кадр -- предотвращ имигание на экране -- избавились от двойных пулек
        } else {
            projectile.update() //вызываем снаряд и апдейтим его
        }
    })

    grids.forEach((grid, gridIndex) => { //все захватчики в сетке
        grid.update()
        
        //создаём спульки
        if (frames % 100 === 0 && grid.invaders.length > 0) {//пускаем пульку на каждый сотый кадр и если в текущей сетке есть захватчики, то переходим к след шагу
            grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(invaderProjectiles) //выбрали случайного захватчика, который будет стрелять
        }

        grid.invaders.forEach((invader, i) => { //отображаем захватчика на экране при обновлении
            invader.update({velocity: grid.velocity})

            //пульки удаляют захватчика
            projectiles.forEach((projectile, j) => {
                if (projectile.position.y - projectile.radius <= 
                    invader.position.y + invader.height && 
                projectile.position.x + projectile.radius >= 
                    invader.position.x && 
                projectile.position.x - projectile.radius <= 
                    invader.position.x + invader.width && 
                projectile.position.y + projectile.radius >= 
                    invader.position.y) {//удаляем захватчика если верхняя часть снаряда меньше нижней части одного из захватчиков

                    setTimeout(() => { //стреляем и удаляем захватчиков
                        const invaderFound = grid.invaders.find( //просматриваем нашли ли мы захватчика, если он равен захватчику2
                            (invader2) => invader2 === invader 
                        ) 

                        const projectileFound = projectiles.find(
                            (projectile2) => projectile2 ===  projectile
                        )

                        //убираем захватчика и пульку
                        if (invaderFound && projectileFound) {
                            scoreBS += 100
                            scoreElbs.innerHTML = scoreBS

                            createParticles({
                                object: invader,
                                fades: true
                            })

                        
                            grid.invaders.splice(i, 1)
                            projectiles.splice(j, 1)

                            //чтобы новая сетка правильно отталкивалась отлевого края
                            if (grid.invaders.length > 0) {
                                const firstInvader = grid.invaders[0]
                                const lastInvader = grid.invaders[grid.invaders.length -1]

                                grid.width = lastInvader.position.x - firstInvader.position.x + lastInvader.width
                                grid.position.x = firstInvader.position.x 
                            }else {
                                grids.splice(gridIndex, 1)
                            }
                        }
                    }, 0)
            
        }})
        })
    })

    const vel = 8 //установили константу для скорости корабля

    if (keysBS.a.pressed && playerBS.position.x >= 0) { //нажимая клавишу а двиг влево, а перемещ лев сторону игрока если она > или = нулю -- создали границу слева 
        playerBS.velocity.x = -vel //перемещение влево
    } else if (keysBS.d.pressed && playerBS.position.x + playerBS.width <= canvas.width) { //тут не if else, а else if (что странно, надо разобраться почему!!!) + && далее установка границ справа 
        playerBS.velocity.x = vel
    } else {
        playerBS.velocity.x = 0
    }

    //создаём ещё одну сетку с захватчиками -- функция интервала для появления врагов 
    if (frames % randomInterval === 0) { //достигая тысячи появляется ещё одна сетка врагов -- теперь делаем на рандом -- если получили 0 - то будет минимум 500 -- переменная randomInterval
        grids.push(new Grid())
        randomInterval = Math.floor(Math.random() * 500 + 400)
        frames = 0
    }

    frames++ //значик, что мы прошли один цикл нашей анимации (добавили + 1 кадр)
}


//({}) -- деструктурирование объекта
addEventListener('keydown', ({ key }) => {
    // if(key == 'a' || key == 'd' || key == ' '){ closeStudyscreen() }
    if (game.over) return //при проигрыше -- кораблик больше не стреляет

    switch (key) {
        case 'a':
            //console.log('left')
            keysBS.a.pressed = true //кнопка нажата? - да! -- проигрываем! нет? -- стопаемся!
        break
        case 'd':
            //console.log('right')
            keysBS.d.pressed = true
        break
        case ' ': //при нажатии пробела пулька летит вверх
            //console.log('space')
            projectiles.push(new Projectile({ //ПУЛЬКИ ПОЗИШН + СКОРОСТЬ
        position: {
            x: playerBS.position.x + playerBS.width / 2, //пульки летят левее тк оттуда начинается пллоскость координат
            y: playerBS.position.y
        },
        velocity:{
            x: 0,
            y: -8
        }
        }))
        break
    }
})

//остановка при достижении нужной скорости
addEventListener('keyup', ({ key }) => {
    switch (key) {
        case 'a':
           // console.log('left')
            keysBS.a.pressed = false
        break
        case 'd':
            //console.log('right')
            keysBS.d.pressed = false
        break
        case ' ':
            //console.log('space')
        break
    }
})

addEventListener('click', mouse => {
    if(state == 'deathscreen'){
        closeDeathscreen()
    }
    else{
        console.log("kjfwijefiwoe")
        closeStudyScreenSpace()
    }
})

//экран при состоянии проигрышка
function endScreenSpace() {
    state = 'deathscreen'
    let ess = document.getElementById("endScreenSpace");
    ess.style.display="flex"; 
    let cl = document.getElementById("close3");
    cl.style.display="flex";
}


function closeDeathscreen(){
    let spaceCanvas = document.getElementById("spaceCanvas");
    spaceCanvas.style.display="block";
    let ess = document.getElementById("endScreenSpace");
    ess.style.display="none";
    let cl = document.getElementById("close3");
    cl.style.display="none";
    
    p2.style.color="white";
    newBattleshipsGame()
}

//экран обучения
function closeStudyScreenSpace(){
    let sss = document.getElementById("studyScreenSpace");
    sss.style.display="none";
    let cl3 = document.getElementById("close3");
    //cl3.style.display="none";
}


if (screen.width <= 600) {
    let ad3 = document.getElementById("anotherDevice3");
    ad3.style.display="flex";
    let spaceCanvas = document.getElementById("spaceCanvas");
    spaceCanvas.style.display="none";
    let p22 = document.getElementById("p2")
    p22.style.color="black";
    let sEl = document.getElementById("scoreEl")
    sEl.style.color="black";
} else {
    let ad3 = document.getElementById("anotherDevice3");
    ad3.style.display="none";
    let spaceCanvas = document.getElementById("spaceCanvas");
    spaceCanvas.style.display="flex";
    let p22 = document.getElementById("p2")
    p22.style.color="white";
    let sEl = document.getElementById("scoreEl")
    sEl.style.color="white";
}
