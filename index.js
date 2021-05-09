
const body_type_mapping = new Map();
body_type_mapping.set("bipedal", "classic_bipedal");
body_type_mapping.set("chimpanzee", "climbing_profile_chimpanzee");

function init(cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type) {

    window.game = new ParkourGame([], [], [], cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type);
    window.agent_selected = null;
    window.game.env.set_zoom(parseFloat(zoomSlider.value) /* * parseFloat(resizeCanvasSlider.value)*/);
    window.game.env.set_scroll(window.agent_selected, hScrollSlider.value, vScrollSlider.value);
    window.game.env.render();
}

function init_default() {
    init([parseFloat(dim1Slider.value), parseFloat(dim2Slider.value), parseFloat(dim3Slider.value)],
        parseFloat(waterSlider.value),
        parseFloat(creepersWidthSlider.value),
        parseFloat(creepersHeightSlider.value),
        parseFloat(creepersSpacingSlider.value),
        parseFloat(smoothingSlider.value),
        getCreepersType());
}


async function loadModel() {
    window.multi_agents = true;
    window.agent_selected = null;
    window.cppn_model = await tf.loadGraphModel('./js/CPPN/weights/same_ground_ceiling_cppn/tfjs_model/model.json');
    init_default();
}


window.addEventListener("load", loadModel, false);

/* SCROLL AND ZOOM */

// Horizontal scroll slider
let hScrollSlider = document.getElementById("hScrollSlider");
hScrollSlider.step = 0.1;
hScrollSlider.oninput = function () {
    window.cancelAgentFollow();
    window.game.env.set_scroll(window.agent_selected, this.value, vScrollSlider.value);
    window.game.env.render();
}
let resetHScroll = document.getElementById("resetHScroll");
resetHScroll.onclick = function () {
    hScrollSlider.value = 0;
    window.cancelAgentFollow();
    window.game.env.set_scroll(window.agent_selected, 0, vScrollSlider.value);
    window.game.env.render();
}

// Vertical scroll slider
let vScrollSlider = document.getElementById("vScrollSlider");
vScrollSlider.step = 0.1;
vScrollSlider.oninput = function () {
    window.cancelAgentFollow();
    window.game.env.set_scroll(window.agent_selected, hScrollSlider.value, this.value);
    window.game.env.render();
}
let resetVScroll = document.getElementById("resetVScroll");
resetVScroll.onclick = function () {
    vScrollSlider.value = 0;
    window.cancelAgentFollow();
    window.game.env.set_scroll(window.agent_selected, hScrollSlider.value, 0);
    window.game.env.render();
}

// Zoom slider
let zoomSlider = document.getElementById("zoomSlider");
zoomSlider.step = 0.01;
zoomSlider.value = 1;
let zoomValue = document.getElementById("zoomValue");
zoomValue.innerHTML = "x" + zoomSlider.value; // Display the default slider value
zoomSlider.oninput = function () {
    zoomValue.innerHTML = "x" + this.value;
    window.game.env.set_zoom(parseFloat(this.value)/* * parseFloat(resizeCanvasSlider.value)*/);
    window.game.env.set_scroll(window.agent_selected, hScrollSlider.value, vScrollSlider.value);
    window.game.env.render();
}
let resetZoom = document.getElementById("resetZoom");
resetZoom.onclick = function () {
    zoomSlider.value = 1;
    zoomValue.innerHTML = "x1";
    window.game.env.set_zoom(1/* * parseFloat(resizeCanvasSlider.value)*/);
    window.game.env.set_scroll(window.agent_selected, hScrollSlider.value, vScrollSlider.value);
    window.game.env.render();
}

/* CPPN ENCODING */

function getCreepersType() {
    return document.getElementById("creepersType").value == 'Swingable';
}


// Get the position of the mouse cursor in the environment scale
function getMousePosToEnvScale(){
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

// Select an agent in the canvas if the mouse is clicked over its body
function mousePressed(){
    if(mouseX >= 0 && mouseX <= window.canvas.width
        && mouseY >= 0 && mouseY <= window.canvas.height){
        let mousePos = getMousePosToEnvScale();

        // MULTI AGENTS
        if(window.multi_agents){
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
        }

        // ONE AGENT
        else{
            let is_agent_touched = window.game.env.agent_body.isMousePosInside(mousePos);

            if(is_agent_touched){
                window.game.env.agent_body.is_selected = !window.game.env.agent_body.is_selected;
            }
            else{
                window.game.env.agent_body.is_selected = false;
            }
        }

        window.game.env.render();

    }
}

function mouseDragged(){

    if(mouseX >= 0 && mouseX <= window.canvas.width
        && mouseY >= 0 && mouseY <= window.canvas.height) {

        // MULTI AGENTS
        if (window.multi_agents) {
            for (let agent of window.game.env.agents) {
                if (agent.is_selected) {
                    let mousePos = getMousePosToEnvScale();
                    let x = mousePos.x / ((TERRAIN_LENGTH + window.game.env.TERRAIN_STARTPAD) * TERRAIN_STEP);
                    x = Math.max(0.02, Math.min(0.98, x));
                    window.game.env.set_agent_position(agent, x);
                    window.game.env.render();
                    window.is_dragging = true;
                }
            }
        }

        // ONE AGENT
        else {
            if (!window.game.env.agent_body.is_selected) {
                let is_agent_touched = window.game.env.agent_body.isMousePosInside(mousePos);
                if (is_agent_touched) {
                    window.game.env.agent_body.is_selected = !window.game.env.agent_body.is_selected;
                } else {
                    window.game.env.agent_body.is_selected = false;
                }
            }

            if (window.game.env.agent_body.is_selected) {
                let x = mousePos.x / ((TERRAIN_LENGTH + window.game.env.TERRAIN_STARTPAD) * TERRAIN_STEP);
                x = Math.max(0.02, Math.min(0.98, x));
                window.game.env.set_agent_position(x);
                window.game.env.render();
            }
        }
    }

    else if(window.is_dragging
            && mouseY >= 0 && mouseY < window.canvas.height){
        if (window.multi_agents) {

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
                    let x = mousePos.x / ((TERRAIN_LENGTH + window.game.env.TERRAIN_STARTPAD) * TERRAIN_STEP);
                    x = Math.max(0.02, Math.min(0.98, x));
                    window.game.env.set_agent_position(agent, x);

                    window.game.env.render();
                }
            }
        }
    }
}

function mouseReleased(){
    window.is_dragging = false;
    window.dragging_side = null;
}
