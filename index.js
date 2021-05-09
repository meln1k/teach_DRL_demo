
const body_type_mapping = new Map();
body_type_mapping.set("bipedal", "classic_bipedal");
body_type_mapping.set("chimpanzee", "climbing_profile_chimpanzee");

function init(cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type) {

    window.game = new ParkourGame([], [], [], cppn_input_vector, water_level, creepers_width, creepers_height, creepers_spacing, smoothing, creepers_type);
    nbAgents.innerText = window.game.env.agents.length + " agents";
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

function createSelectOptGroup(group_name) {
    //const x = document.getElementById("models");
    const group = document.createElement("optgroup");
    group.label = group_name;
    group.text = group_name;
    //x.appendChild(group);
    return group;
}

function createSelectOption(option_name, path = null) {
    const option = document.createElement("option");
    option.text = option_name;
    if (path != null) {
        option.value = path;
    }
    return option;
}

function addAgentModel(modelName) {
    const x = document.getElementById("models");
    const option = document.createElement("option");
    option.text = modelName;
    x.add(option);
}

async function testAgentModelSelector() {
    fetch('./policies.json')
        .then(resp => resp.text().then(body => {
            window.agent_policies = JSON.parse(body);
            return window.agent_policies;
        }))
        .then(types => {
            const select_models = document.getElementById("models");
            const select_morphology = document.getElementById("morphology");

            types.forEach(type => {
                //console.log(type["type"]);
                //let type_group = createSelectOptGroup(type["type"]);
                //select.add(type_group);

                type["morphologies"].forEach(morphology => {
                    //console.log(morphology["morphology"]);
                    //let morph_group = createSelectOptGroup(morphology["morphology"]);
                    select_morphology.appendChild(createSelectOption(morphology["morphology"]));

                    if (morphologyDropdown.value == morphology["morphology"]) {
                        morphology["seeds"].forEach(seed => {
                            //console.log(seed["seed"] + ":" + seed["path"]);
                            //morph_group.appendChild(createSelectOption(type["type"] + " > " + morphology["morphology"] + " > " + seed["seed"]));
                            select_models.appendChild(createSelectOption(morphology["morphology"] + "_" + seed["seed"],
                                seed["path"]));
                        });
                    }
                    //type_group.appendChild(morph_group);
                });
                //select.appendChild(type_group);
            });

        });
}

let morphologyDropdown = document.getElementById("morphology");
let modelsDropdown = document.getElementById("models");
morphologyDropdown.oninput = function () {
    let length = modelsDropdown.options.length;
    for (let i = length - 1; i >= 0; i--) {
        modelsDropdown.options[i] = null;
    }
    for (let type of window.agent_policies) {
        for (let morphology of type["morphologies"]) {
            if (morphology["morphology"] == this.value) {
                for (let seed of morphology["seeds"]) {
                    modelsDropdown.appendChild(createSelectOption(morphology["morphology"] + "_" + seed["seed"], seed["path"]));
                }
            }
        }
    }
}

async function renderAgentModelSelector() {
    fetch(`./models.csv`)
        .then(resp => resp.text().then(body => body.split(",")))
        .then(models => {
            models.forEach(model => {
                addAgentModel(model);
            });
        })
}

async function loadModel() {
    window.multi_agents = true;
    window.agent_selected = null;
    await testAgentModelSelector();
    //await renderAgentModelSelector();
    window.cppn_model = await tf.loadGraphModel('./js/CPPN/weights/same_ground_ceiling_cppn/tfjs_model/model.json');
    init_default();
}


window.addEventListener("load", loadModel, false);

/* BUTTONS AND SLIDERS */

let runButton = document.getElementById("runButton");
runButton.onclick = function () {
    //const policy = document.getElementById("models").value;
    const policy = modelsDropdown.value;
    window.game.run(policy).then(text => {
        if(text == "Pause"){
            this.className = "btn btn-warning";
        }
        else if(text == "Resume"){
            this.className = "btn btn-success";
        }
        this.innerText = text
    });
}

function reset(keep_positions){
    runButton.className = "btn btn-success";
    runButton.innerText = "Start";
    let morphologies = [...window.game.env.agents.map(agent => agent.morphology)];
    let policies = [...window.game.env.agents.map(agent => agent.policy)];
    let positions;
    if(keep_positions){
        positions = [...window.game.env.agents.map(agent => agent.agent_body.reference_head_object.GetPosition())];
    }
    else{
        positions = [...window.game.env.agents.map(agent => null)];
    }

    window.game.reset(
        morphologies,
        policies,
        positions,
        [parseFloat(dim1Slider.value), parseFloat(dim2Slider.value), parseFloat(dim3Slider.value)],
        parseFloat(waterSlider.value),
        parseFloat(creepersWidthSlider.value),
        parseFloat(creepersHeightSlider.value),
        parseFloat(creepersSpacingSlider.value),
        parseFloat(smoothingSlider.value),
        getCreepersType());
    nbAgents.innerText = window.game.env.agents.length + " agents";
    window.agent_selected = null;
    window.game.env.set_zoom(parseFloat(zoomSlider.value)/* * parseFloat(resizeCanvasSlider.value)*/);
    window.game.env.set_scroll(window.agent_selected, parseFloat(hScrollSlider.value), parseFloat(vScrollSlider.value));
    window.game.env.render();
}

let resetButton = document.getElementById("resetButton");
resetButton.onclick = function () {
    reset(false);
}

let jointsButton = document.getElementById("jointsButton");
window.draw_joints = false;
jointsButton.onclick = function () {
    window.draw_joints = !window.draw_joints;
    if(window.draw_joints){
        this.className = "btn btn-primary";
    }
    else{
        this.className = "btn btn-outline-primary";
    }
    window.game.env.render();
}

let lidarsButton = document.getElementById("lidarsButton");
window.draw_lidars = true;
lidarsButton.onclick = function () {
    window.draw_lidars = !window.draw_lidars;
    if(window.draw_lidars){
        this.className = "btn btn-primary";
    }
    else{
        this.className = "btn btn-outline-primary";
    }
    window.game.env.render();
}

let sensorsButton = document.getElementById("sensorsButton");
window.draw_sensors = false;
sensorsButton.onclick = function () {
    window.draw_sensors = !window.draw_sensors;
    if(window.draw_sensors){
        this.className = "btn btn-primary";
    }
    else{
        this.className = "btn btn-outline-primary";
    }
    window.game.env.render();
}

let namesButton = document.getElementById("namesButton");
window.draw_names = false;
namesButton.onclick = function () {
    window.draw_names = !window.draw_names;
    if(window.draw_names){
        this.className = "btn btn-primary";
    }
    else{
        this.className = "btn btn-outline-primary";
    }
    window.game.env.render();
}

let followAgentButton = document.getElementById("followAgentButton");
followAgentButton.onclick = function () {
    window.follow_agent = !window.follow_agent;
    if(window.follow_agent){
        this.className = "btn btn-primary";
    }
    else{
        this.className = "btn btn-outline-primary";
    }
    //console.log(window.follow_agent);
    //console.log(window.agent_selected);
    //window.game.env.set_scroll(window.game.env.agents[0]);
    window.game.env.render();
}

let addAgentButton = document.getElementById("addAgentButton");
let nbAgents = document.getElementById("nbAgents");
addAgentButton.onclick = function () {
    window.game.env.add_agent(body_type_mapping.get(morphologyDropdown.value), {name: modelsDropdown.options[modelsDropdown.selectedIndex].text, path: modelsDropdown.value});
    window.game.env.render();
    nbAgents.innerText = window.game.env.agents.length + " agents";
}

let deleteAgentButton = document.getElementById("deleteAgentButton");
deleteAgentButton.onclick = function () {
    window.game.env.delete_agent();
    nbAgents.innerText = window.game.env.agents.length + " agents";
    window.game.env.render();
}


/*let resizeCanvasSlider = document.getElementById("resizeCanvasSlider");
resizeCanvasSlider.step = 0.01;
resizeCanvasSlider.value = 0.8;
resizeCanvasSlider.oninput = function () {
    //window.game.env._SET_RENDERING_VIEWPORT_SIZE(VIEWPORT_W * 2 * parseFloat(this.value), RENDERING_VIEWER_H, true);
    window.game.env._SET_RENDERING_VIEWPORT_SIZE(window.innerWidth * parseFloat(this.value), RENDERING_VIEWER_H, true);
    window.game.env.set_zoom(parseFloat(this.value) * parseFloat(zoomSlider.value));
    resizeCanvas(RENDERING_VIEWER_W, RENDERING_VIEWER_H);
}*/

/* SCROLL AND ZOOM */

// Horizontal scroll slider
let hScrollSlider = document.getElementById("hScrollSlider");
hScrollSlider.step = 0.1;
//let hScrollValue = document.getElementById("hScrollValue");
//hScrollValue.innerHTML = hScrollSlider.value; // Display the default slider value
hScrollSlider.oninput = function () {
    //hScrollValue.innerHTML = this.value;
    window.follow_agent = false;
    followAgentButton.className = "btn btn-outline-primary";
    window.game.env.set_scroll(window.agent_selected, this.value, vScrollSlider.value);
    window.game.env.render();
}
let resetHScroll = document.getElementById("resetHScroll");
resetHScroll.onclick = function () {
    hScrollSlider.value = 0;
    //hScrollValue.innerHTML = "0";
    window.follow_agent = false;
    followAgentButton.className = "btn btn-outline-primary";
    window.game.env.set_scroll(window.agent_selected, 0, vScrollSlider.value);
    window.game.env.render();
}

// Vertical scroll slider
let vScrollSlider = document.getElementById("vScrollSlider");
vScrollSlider.step = 0.1;
//let vScrollValue = document.getElementById("vScrollValue");
//vScrollValue.innerHTML = vScrollSlider.value; // Display the default slider value
vScrollSlider.oninput = function () {
    //vScrollValue.innerHTML = this.value;
    window.follow_agent = false;
    followAgentButton.className = "btn btn-outline-primary";
    window.game.env.set_scroll(window.agent_selected, hScrollSlider.value, this.value);
    window.game.env.render();
}
let resetVScroll = document.getElementById("resetVScroll");
resetVScroll.onclick = function () {
    vScrollSlider.value = 0;
    // vScrollValue.innerHTML = "0";
    window.follow_agent = false;
    followAgentButton.className = "btn btn-outline-primary";
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

// dim1 slider
initializeSlider("dim1", 0.01, 0);

// dim2 slider
initializeSlider("dim2", 0.01, 0);

// dim3 slider
initializeSlider("dim3", 0.01, 0);

// water slider
initializeSlider("water", 0.01, 0);

// creepersWidth slider
initializeSlider("creepersWidth", 0.01, 0.3);

// creepersHeight slider
initializeSlider("creepersHeight", 0.01, 3);

// creepersSpacing slider
initializeSlider("creepersSpacing", 0.01, 1);

// smoothing slider
initializeSlider("smoothing", 0.01, 20);


function getCreepersType() {
    return document.getElementById("creepersType").value == 'Swingable';
}

// Creeper Type form
let creepersTypeSelect = document.getElementById("creepersType");
creepersType.onclick = function () {
    reset(true);
}

// Initialize all sliders for parkour generation
function initializeSlider(id, step, value) {
    const slider = document.getElementById(`${id}Slider`);
    slider.step = step;
    slider.value = value;
    const sliderValue = document.getElementById(`${id}Value`);
    sliderValue.innerHTML = slider.value; // Display the default slider value
    slider.oninput = function () {
        sliderValue.innerHTML = this.value;
        reset(true);
    }
}

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

// Select an agent in the canvas if the mouse is clicked over its body
function mousePressed(){
    if(mouseX >= 0 && mouseX <= window.canvas.width
        && mouseY >= 0 && mouseY <= window.canvas.height){
        let mousePos = getMousePosToEnvScale();
        //console.log(mousePos.x, mousePos.y)

        // MULTI AGENTS
        if(window.multi_agents){
            for(let agent of window.game.env.agents){

                // Check if the agent is touched by the mouse
                let is_agent_touched = agent.agent_body.isMousePosInside(mousePos);
                //console.log(is_agent_touched);
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

            //console.log(is_agent_touched);
            if(is_agent_touched){
                window.game.env.agent_body.is_selected = !window.game.env.agent_body.is_selected;
            }
            else{
                window.game.env.agent_body.is_selected = false;
            }
        }

        window.game.env.render();

    }

    /*else{
        for(let agent of window.game.env.agents){
            agent.is_selected = false;
        }
        //window.agent_selected = null;
    }*/


}

function mouseDragged(){

    if(mouseX >= 0 && mouseX <= window.canvas.width
        && mouseY >= 0 && mouseY <= window.canvas.height) {

        // MULTI AGENTS
        if (window.multi_agents) {
            for (let agent of window.game.env.agents) {
                /*if(!agent.is_selected){
                    let is_agent_touched = agent.agent_body.isMousePosInside(mousePos);
                    if(is_agent_touched){
                        agent.is_selected = true;
                        window.agent_selected = agent;
                        for(let other_agent of window.game.env.agents){
                            if(other_agent != agent) {
                                other_agent.is_selected = false;
                            }
                        }
                    }
                }*/

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
                    //console.log("dragging out of the canvas");

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
    //console.log("mouse released");
}
