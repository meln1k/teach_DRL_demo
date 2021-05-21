
const body_type_mapping = new Map();
body_type_mapping.set("bipedal", "classic_bipedal");
body_type_mapping.set("chimpanzee", "climbing_profile_chimpanzee");

function init(cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type, ground, ceiling) {

    if(window.game != null){
        window.game.pause();
    }
    window.game = new ParkourGame([], [], [], cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type, ground, ceiling);
    window.agent_selected = null;
    window.game.env.set_zoom(0.35);
    window.game.env.set_scroll(window.agent_selected, -0.05 * RENDERING_VIEWER_W, 0);
    window.game.env.render();
}

function init_default() {
    init([parseFloat(dim1Slider.value), parseFloat(dim2Slider.value), parseFloat(dim3Slider.value)],
        parseFloat(waterSlider.value),
        parseFloat(creepersWidthSlider.value),
        parseFloat(creepersHeightSlider.value),
        parseFloat(creepersSpacingSlider.value),
        parseFloat(smoothingSlider.value),
        getCreepersType(),
        window.ground,
        window.ceiling);
}

async function loadModel() {
    window.agent_selected = null;
    window.cppn_model = await tf.loadGraphModel('./js/CPPN/weights/same_ground_ceiling_cppn/tfjs_model/model.json');
    init_default();
}
window.addEventListener("load", loadModel, false);

function getCreepersType() {
    return document.getElementById("creepersType").value == 'Swingable';
}

/* IN-CANVAS MOUSE INTERACTIONS */

// Get the position of the mouse cursor in the environment scale
function getMousePosToEnvScale(){
    //let x = Math.max(0, Math.min(mouseX, window.canvas.width));
    let x = Math.max(-window.canvas.width * 0.01, Math.min(mouseX, window.canvas.width * 1.01));
    let y = Math.max(0, Math.min(mouseY, window.canvas.height));

    x +=  window.game.env.scroll[0];
    y = -(y - window.game.env.scroll[1]);

    x = x / (window.game.env.scale * window.game.env.zoom);
    y = y / (window.game.env.scale * window.game.env.zoom);

    y += (1 - window.game.env.scale * window.game.env.zoom) * RENDERING_VIEWER_H/(window.game.env.scale * window.game.env.zoom)
        + (window.game.env.zoom - 1) * (window.game.env.ceiling_offset)/window.game.env.zoom * 1/3 + RENDERING_VIEWER_H;

    return {x: x, y: y};
}

window.erasing_radius = 15;

// Select an agent in the canvas if the mouse is clicked over its body
function mousePressed(){
    if(mouseX >= 0 && mouseX <= window.canvas.width
        && mouseY >= 0 && mouseY <= window.canvas.height){

        window.prevMouseX = mouseX;
        window.prevMouseY = mouseY;

        if(!window.is_drawing()){
            let mousePos = getMousePosToEnvScale();

            for(let agent of window.game.env.agents){

                // Check if the agent is touched by the mouse
                let is_agent_touched = agent.agent_body.isMousePosInside(mousePos);

                // If the agent is touched and not selected yet, it is now selected and all other agents are deselected
                if(!agent.is_selected && is_agent_touched){
                    agent.is_selected = true;
                    window.agent_selected = agent;
                    for(let other_agent of window.game.env.agents){
                        if(other_agent != agent){
                            other_agent.is_selected = false;
                        }
                    }
                    break;
                }
                // If the agent is not touched it is deselected
                else if(!is_agent_touched){
                    agent.is_selected = false;
                }
            }

            let selected = false;
            for(let agent of window.game.env.agents){
                if(agent.is_selected){
                    window.agent_selected = agent;
                    selected = true;
                    break;
                }
            }
            if(!selected){
                window.agent_selected = null;
            }

            window.game.env.render();
        }
    }
}


window.ground = [];
window.ceiling = [];
window.terrain = {
    ground: [],
    ceiling: []
};

function mouseDragged(){

    if(mouseX >= 0 && mouseX <= window.canvas.width
        && mouseY >= 0 && mouseY <= window.canvas.height) {

        // DRAWING
        if(window.is_drawing()) {
            //cursor('web_demo/pencil-cursor.png');
            //cursor(HAND);
            if(window.is_drawing_ground()){
                drawing_canvas.push();
                drawing_canvas.stroke('green');
                drawing_canvas.strokeWeight(5);
                drawing_canvas.line(mouseX, mouseY - window.game.env.scroll[1], window.prevMouseX, window.prevMouseY - window.game.env.scroll[1]);
                drawing_canvas.pop();
                window.terrain.ground.push({x: mouseX, y: mouseY - window.game.env.scroll[1]});
            }
            else if(window.is_drawing_ceiling()){
                drawing_canvas.push();
                drawing_canvas.stroke('grey');
                drawing_canvas.strokeWeight(5);
                drawing_canvas.line(mouseX, mouseY - window.game.env.scroll[1], window.prevMouseX, window.prevMouseY - window.game.env.scroll[1]);
                drawing_canvas.pop();
                window.terrain.ceiling.push({x: mouseX, y: mouseY - window.game.env.scroll[1]});
            }
            else if(window.is_erasing()){
                erasing_canvas.clear();
                erasing_canvas.noStroke();
                erasing_canvas.fill(255);
                erasing_canvas.circle(mouseX, mouseY - window.game.env.scroll[1], window.erasing_radius * 2);
                if(window.terrain.ground.length > 0 || window.terrain.ceiling.length > 0){

                    // Remove the points that are within the circle radius from the ground and ceiling lists
                    window.terrain.ground = window.terrain.ground.filter(function(point, index, array){
                        return Math.pow(point.x - mouseX, 2) + Math.pow(point.y - (mouseY - window.game.env.scroll[1]), 2) > Math.pow(window.erasing_radius, 2);
                    });
                    window.terrain.ceiling = window.terrain.ceiling.filter(function(point, index, array){
                        return Math.pow(point.x - mouseX, 2) + Math.pow(point.y - (mouseY - window.game.env.scroll[1]), 2) > Math.pow(window.erasing_radius, 2);
                    });

                    drawing_canvas.erase();
                    drawing_canvas.circle(mouseX, mouseY - window.game.env.scroll[1], window.erasing_radius * 2);
                    drawing_canvas.noErase();
                }
            }
            // Dragging to move
            else{
                cursor(MOVE);
                window.game.env.set_scroll(null, window.prevMouseX - mouseX, mouseY - prevMouseY);
            }

            window.game.env.render();
            image(drawing_canvas, 0, window.game.env.scroll[1]);
            image(erasing_canvas, 0, window.game.env.scroll[1]);
        }

        // DRAGGING
        else{
            cursor(MOVE);
            for (let agent of window.game.env.agents) {

                // Dragging an agent
                if (agent.is_selected) {
                    let mousePos = getMousePosToEnvScale();
                    let x;
                    if (agent.agent_body.body_type == BodyTypesEnum.CLIMBER) {
                        x = mousePos.x / window.game.env.terrain_ceiling[window.game.env.terrain_ceiling.length - 1].x;
                    } else if (agent.agent_body.body_type == BodyTypesEnum.WALKER) {
                        x = mousePos.x / window.game.env.terrain_ground[window.game.env.terrain_ground.length - 1].x;
                    }

                    x = Math.max(0.02, Math.min(0.98, x));
                    window.game.env.set_agent_position(agent, x);
                    window.game.env.render();
                    window.is_dragging_agent = true;
                }
            }

            // Dragging to scroll
            if(!window.is_dragging_agent){
                if(window.follow_agent){
                    window.cancelAgentFollow();
                }
                window.game.env.set_scroll(null, window.prevMouseX - mouseX, mouseY - prevMouseY);
                window.game.env.render();
            }
        }
    }

    /*// Mouse out of canvas + DRAWING
    else if(window.is_drawing()){
        window.prevMouseX = mouseX;
        window.prevMouseY = mouseY;
    }*/

    // Mouse horizontally out of canvas + dragging agent
    else if(window.is_dragging_agent
        && mouseY >= 0 && mouseY < window.canvas.height){

        if(mouseX < 0){
            window.dragging_side = "left";
        }
        else if(mouseX > window.canvas.width){
            window.dragging_side = "right";
        }

        for (let agent of window.game.env.agents) {
            if(agent.is_selected){

                window.game.env.set_scroll(null);

                let mousePos = getMousePosToEnvScale();
                let x;
                if (agent.agent_body.body_type == BodyTypesEnum.CLIMBER) {
                    x = mousePos.x / window.game.env.terrain_ceiling[window.game.env.terrain_ceiling.length - 1].x;
                } else if (agent.agent_body.body_type == BodyTypesEnum.WALKER) {
                    x = mousePos.x / window.game.env.terrain_ground[window.game.env.terrain_ground.length - 1].x;
                }

                x = Math.max(0.02, Math.min(0.98, x));
                window.game.env.set_agent_position(agent, x);
                window.game.env.render();
            }
        }
    }

    window.prevMouseX = mouseX;
    window.prevMouseY = mouseY;
}

function mouseReleased(){
    cursor();
    window.is_dragging_agent = false;
    window.dragging_side = null;
}

function mouseMoved(){
    if(window.is_drawing()){
        erasing_canvas.clear();
        if(window.is_erasing() &&
            mouseX >= 0 && mouseX <= window.canvas.width
            && mouseY >= 0 && mouseY <= window.canvas.height) {

            erasing_canvas.noStroke();
            erasing_canvas.fill(255, 180);
            erasing_canvas.circle(mouseX, mouseY - window.game.env.scroll[1], window.erasing_radius * 2);

            window.game.env.render();
            image(drawing_canvas, 0, window.game.env.scroll[1]);
            image(erasing_canvas, 0, window.game.env.scroll[1]);
        }

        else if(window.is_erasing() &&
            mouseX < 0 || mouseX > window.canvas.width
            || mouseY < 0 || mouseY > window.canvas.height) {
            window.game.env.render();
        }

        //window.game.env.render();
        image(drawing_canvas, 0, window.game.env.scroll[1]);
        image(erasing_canvas, 0, window.game.env.scroll[1]);
    }
}

function mouseWheel(event){
    if(!window.is_drawing()
        && mouseX >= 0 && mouseX <= window.canvas.width
        && mouseY >= 0 && mouseY <= window.canvas.height) {

        window.game.env.set_zoom(window.game.env.zoom - event.delta / 1000);
        window.game.env.set_scroll(null, 0, 0);
        window.game.env.render();
        return false;
    }
}
