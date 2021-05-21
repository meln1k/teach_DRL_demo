import store from './js/ui_state/store/index.js';
import MorphologySelect from './js/ui_state/components/morphology.js';
import ModelSelect from './js/ui_state/components/model_select.js';
import AgentsList from './js/ui_state/components/agents_list.js';
import RunButtons from './js/ui_state/components/run_buttons.js';
import DrawSwitches from './js/ui_state/components/draw.js';
import TerrainConfig from './js/ui_state/components/terrain_config.js';
import CreepersConfig from './js/ui_state/components/creepers_config.js';
import DrawingMode from "./js/ui_state/components/drawing_mode.js";

// Morphology selector setup
const morphologySelectElement = document.querySelector('#morphology');
morphologySelectElement.addEventListener('input', evt => {
    store.dispatch('selectMorphology', morphologySelectElement.value);
});
const morphologySelectInstance = new MorphologySelect();
morphologySelectInstance.render();

// model selector setup
const modelSelectElement = document.querySelector('#models');
modelSelectElement.addEventListener('input', evt => {
    store.dispatch('selectSeedIdx', modelSelectElement.selectedIndex);
});
const modelSelectInstance = new ModelSelect();
modelSelectInstance.render();

// Add/delete agent setup
const addAgentBtn = document.querySelector("#addAgentButton");
addAgentBtn.addEventListener('click', evt => {
    store.dispatch('addAgent', {});
});
const agentListInstance = new AgentsList();
agentListInstance.render();

// Run/Reset buttons setup
const runButton = document.querySelector("#runButton");
runButton.addEventListener('click', () => {
    store.dispatch('toggleRun', {});
});
const resetButton = document.querySelector("#resetButton");
resetButton.addEventListener('click', () => {
    store.dispatch('resetSimulation', {});
});
const runButtonsInstance = new RunButtons();
runButtonsInstance.render();

// Draw switches setup
const drawJointsSwitch = document.querySelector("#drawJointsSwitch");
drawJointsSwitch.addEventListener('input', () => {
    store.dispatch('toggleSwitch', {name: 'drawJoints', value: drawJointsSwitch.checked} );
});
const drawLidarsSwitch = document.querySelector("#drawLidarsSwitch");
window.draw_lidars = true;
drawLidarsSwitch.addEventListener('input', () => {
    store.dispatch('toggleSwitch', {name: 'drawLidars', value: drawLidarsSwitch.checked});
});
const drawSensorsSwitch = document.querySelector("#drawSensorsSwitch");
drawSensorsSwitch.addEventListener('input', () => {
    store.dispatch('toggleSwitch',  {name: 'drawSensors', value: drawSensorsSwitch.checked});
});
const drawNamesSwitch = document.querySelector("#drawNamesSwitch");
drawNamesSwitch.addEventListener('input', () => {
    store.dispatch('toggleSwitch', {name: 'drawNames', value: drawNamesSwitch.checked});
});
const drawSwitchesInstance = new DrawSwitches();
drawSwitchesInstance.render();

// Terrain sliders setup
const dim1SliderElement = document.querySelector("#dim1Slider")
dim1SliderElement.addEventListener('input', () => {
    store.dispatch('changeCppnCongfig', {
        name: "dim1",
        value: parseFloat(dim1SliderElement.value)
    });
});
const dim2SliderElement = document.querySelector("#dim2Slider")
dim2SliderElement.addEventListener('input', () => {
    store.dispatch('changeCppnCongfig', {
        name: "dim2",
        value: parseFloat(dim2SliderElement.value)
    });
});
const dim3SliderElement = document.querySelector("#dim3Slider")
dim3SliderElement.addEventListener('input', () => {
    store.dispatch('changeCppnCongfig', {
        name: "dim3",
        value: parseFloat(dim3SliderElement.value)
    });
});
const smoothingSliderElement = document.querySelector("#smoothingSlider")
smoothingSliderElement.addEventListener('input', () => {
    store.dispatch('changeCppnCongfig', {
        name: "smoothingSlider",
        value: parseFloat(smoothingSliderElement.value)
    });
});
const waterSliderElement = document.querySelector("#waterSlider")
waterSliderElement.addEventListener('input', () => {
    store.dispatch('changeCppnCongfig', {
        name: "waterSlider",
        value: parseFloat(waterSliderElement.value)
    });
});
const terrainConfigInstance = new TerrainConfig();
terrainConfigInstance.render();

// Creepers setup

const creepersWidthSlider = document.querySelector("#creepersWidthSlider");
creepersWidthSlider.addEventListener('input', () => {
    store.dispatch('changeCreepersConfig', {
        name: "width",
        value: parseFloat(creepersWidthSlider.value)
    });
});

const creepersHeightSlider = document.querySelector("#creepersHeightSlider");
creepersHeightSlider.addEventListener('input', () => {
    store.dispatch('changeCreepersConfig', {
        name: "height",
        value: parseFloat(creepersHeightSlider.value)
    });
});

const creepersSpacingSlider = document.querySelector("#creepersSpacingSlider");
creepersSpacingSlider.addEventListener('input', () => {
    store.dispatch('changeCreepersConfig', {
        name: "spacing",
        value: parseFloat(creepersSpacingSlider.value)
    });
});

const creepersTypeSelect = document.querySelector("#creepersType");
creepersTypeSelect.addEventListener('input', () => {
    store.dispatch('changeCreepersConfig', {
        name: "type",
        value: creepersTypeSelect.value
    });
});

const creepersConfigInstance = new CreepersConfig();
creepersConfigInstance.render()

// Drawing mode setup
const drawingModeSwitch = document.querySelector("#drawingModeSwitch");
drawingModeSwitch.addEventListener('input', () => {
    store.dispatch('toggleSwitch', {name: 'drawingMode', value: drawingModeSwitch.checked});
});
const drawGroundButton = document.querySelector('#drawGroundButton');
drawGroundButton.addEventListener('click', () => {
    store.dispatch('drawGround', !store.state.drawingModeState.drawing_ground);
});
const drawCeilingButton = document.querySelector('#drawCeilingButton');
drawCeilingButton.addEventListener('click', () => {
    store.dispatch('drawCeiling', !store.state.drawingModeState.drawing_ceiling);
});
const eraseButton = document.querySelector('#eraseButton');
eraseButton.addEventListener('click', () => {
    store.dispatch('erase', !store.state.drawingModeState.erasing);
});
const clearButton = document.querySelector('#clearButton');
clearButton.addEventListener('click', () => {
    store.dispatch('clear', {});
});
const generateTerrainButton = document.querySelector('#generateTerrainButton');
generateTerrainButton.addEventListener('click', () => {
    store.dispatch('generateTerrain', !store.state.drawingModeState.drawing);
});
const drawingModeInstance = new DrawingMode();
drawingModeInstance.render();


// fetch morphologies
fetch('./policies.json')
    .then(resp => resp.text().then(body => {
        window.agent_policies = JSON.parse(body);
        return window.agent_policies;
    }))
    .then(types => {
        types.forEach(type => {
            type["morphologies"].forEach(morphology => {
                store.dispatch('addMorphology', {
                    morphology: morphology["morphology"],
                    seeds: morphology["seeds"].map((seed, index) => {
                        seed["idx"] = index;
                        return seed;
                    })
                });
            });
        });
    });

// interaction with index.js
window.cancelAgentFollow = () => {
    store.dispatch('followAgent', {index: -1, value: false});
}

window.get_mode = function () {
    return store.state.mode;
}

window.is_drawing = function() {
    return store.state.drawingModeState.drawing;
}

window.is_drawing_ground = () => {
    return store.state.drawingModeState.drawing_ground;
}

window.is_drawing_ceiling = () => {
    return store.state.drawingModeState.drawing_ceiling;
}

window.is_erasing = () => {
    return store.state.drawingModeState.erasing;
}

