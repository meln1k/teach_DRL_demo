p5.disableFriendlyErrors = true; // disables FES

let JOINTS_COLORS = {
    "hip": "#FF7818",
    "knee": "#F4BE18",
    "creeper": "#00B400"
};

function setup() {
    let myCanvas = createCanvas(RENDERING_VIEWER_W, RENDERING_VIEWER_H);
    myCanvas.parent("canvas_container");
    background("#e6e6ff");
    noLoop();
    //frameRate(30);
}

function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) {
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}
function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    let rgb = [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ];
    return result ? rgb : null;
}

function draw() {
    //background("#e6e6ff");
    background("#E6F0FF");
    if(window.game != null){
        let parkour = window.game.env;

        push();
        drawParkour(parkour);
        drawAgent(parkour, parkour.scale);

        if(window.draw_lidars){
            //drawLidars(parkour.lidar, parkour.scale);
        }

        if(window.draw_joints){
            drawJoints(parkour.creepers_joints, parkour.scale);
            drawJoints(parkour.agent_body.motors, parkour.scale);
        }
        pop();
    }

}

function drawJoints(joints, scale){
    for(let i = 0; i < joints.length; i++){
        let posA = joints[i].m_bodyA.GetWorldPoint(joints[i].m_localAnchorA);
        let posB = joints[i].m_bodyB.GetWorldPoint(joints[i].m_localAnchorB);
        noStroke();
        let joint_type = joints[i].GetUserData().name;
        fill(JOINTS_COLORS[joint_type]);
        let radius = joint_type == "creeper" ? 5 : 7;
        circle(posA.x, VIEWPORT_H - posA.y, radius/scale);
        circle(posB.x, VIEWPORT_H - posB.y, radius/scale);

    }
}

function drawAgent(parkour, scale){
    let polys = parkour.agent_body.get_elements_to_render();
    for(let poly of polys){
        let shape = poly.GetFixtureList().GetShape();
        let vertices = [];
        for(let i = 0; i < shape.m_count; i++){
            let world_pos = poly.GetWorldPoint(shape.m_vertices[i]);
            vertices.push([world_pos.x, world_pos.y]);
        }
        strokeWeight(2/scale);
        stroke(poly.color2);
        let color1 = poly.color1;
        if(poly == parkour.agent_body.reference_head_object){
            let rgb01 = hexToRgb(poly.color1).map(c => c / 255);
            let rgb255 = parkour.color_agent_head(rgb01, poly.color2)[0].map(c => Math.round(c * 255));
            color1 = rgbToHex(rgb255);
        }
        drawPolygon(vertices, color1);

    }
}

function drawLidars(lidars, scale){
    for(let i = 0; i < lidars.length; i++){
        let vertices = [
            [lidars[i].p1.x, lidars[i].p1.y],
            [lidars[i].p2.x, lidars[i].p2.y]
        ];
        strokeWeight(1/scale);
        drawLine(vertices, "#FF0000");
    }
}

function drawSkyClouds(parkour){
    push();

    // Sky
    let vertices = [
        [0, 0],
        [0, RENDERING_VIEWER_H],
        [RENDERING_VIEWER_W, RENDERING_VIEWER_H],
        [RENDERING_VIEWER_W, 0]
    ];
    noStroke();
    //drawPolygon(vertices, "#e6e6ff");

    // Translation to scroll horizontally and vertically
    translate(- parkour.scroll[0]/3, parkour.scroll[1]/3);

    // Rescaling
    scale(parkour.scale);
    scale(parkour.zoom);

    // Translating so that the environment is always horizontally centered
    translate(0, (1 - parkour.scale * parkour.zoom) * VIEWPORT_H/(parkour.scale * parkour.zoom));
    translate(0, (parkour.zoom - 1) * (parkour.ceiling_offset)/parkour.zoom * 1/3);

    // Clouds
    for(let cloud of parkour.cloud_polys){
        //if(cloud.x1 >= parkour.scroll[0]/2 && cloud.x1 <= parkour.scroll[0]/2 + RENDERING_VIEWER_W/parkour.scale){
        noStroke();
        drawPolygon(cloud.poly, "#FFFFFF");
    }

    pop();
}

function drawParkour(parkour){
    // Sky & clouds
    drawSkyClouds(parkour);

    // Translation to scroll horizontally and vertically
    translate(- parkour.scroll[0], parkour.scroll[1]);

    // Rescaling
    scale(parkour.scale);
    scale(parkour.zoom);

    // Translating so that the environment is always horizontally centered
    translate(0, (1 - parkour.scale * parkour.zoom) * VIEWPORT_H/(parkour.scale * parkour.zoom));
    translate(0, (parkour.zoom - 1) * (parkour.ceiling_offset)/parkour.zoom * 1/3);

    // Water
    let vertices = [
        [-RENDERING_VIEWER_W, -RENDERING_VIEWER_H],
        [-RENDERING_VIEWER_W, parkour.water_y],
        [2 * RENDERING_VIEWER_W, parkour.water_y],
        [2 * RENDERING_VIEWER_W, -RENDERING_VIEWER_H]
    ];
    noStroke();
    drawPolygon(vertices, "#77ACE5");


    // Draw all background elements
    for(let i = 0; i < parkour.background_polys.length; i++) {
        let poly = parkour.background_polys[i];
        //let pos = poly.vertices[0][0] * parkour.zoom - parkour.scroll_offset;
        //if(pos >= -0.01 * RENDERING_VIEWER_W && pos < RENDERING_VIEWER_W){
            noStroke();
            drawPolygon(poly.vertices, poly.color);
        //}

    }

    // Draw all physical elements
    for(let i = 0; i < parkour.terrain_bodies.length; i++) {
        let poly = parkour.terrain_bodies[i];
        let shape = poly.body.GetFixtureList().GetShape();
        let vertices = [];

        /*let pos = poly.body.GetPosition();
        let w_pos = poly.body.GetWorldPoint(pos);
        let x_pos = w_pos.x/parkour.zoom - parkour.scroll_offset;
        if(x_pos >= -0.01 * RENDERING_VIEWER_W && x_pos < RENDERING_VIEWER_W){*/
            if(poly.type == "creeper"){
                for(let i = 0; i < shape.m_count; i++){
                    let world_pos = poly.body.GetWorldPoint(shape.m_vertices[i]);
                    vertices.push([world_pos.x, world_pos.y]);
                }
                noStroke();
                drawPolygon(vertices, poly.color1);
            }
            else{
                let v1 = poly.body.GetWorldPoint(shape.m_vertex1);
                let v2 = poly.body.GetWorldPoint(shape.m_vertex2);
                vertices = [[v1.x, v1.y], [v2.x, v2.y]];
                strokeWeight(1/parkour.scale);
                drawLine(vertices, poly.color);
            }
        }
    //}
}

function drawPolygon(vertices, color){
    fill(color);
    beginShape();
    for(let v of vertices){
        vertex(v[0], VIEWPORT_H - v[1]);
    }
    endShape(CLOSE);
}

function drawLine(vertices, color){
    stroke(color);
    line(vertices[0][0], VIEWPORT_H - vertices[0][1], vertices[1][0], VIEWPORT_H - vertices[1][1]);
}