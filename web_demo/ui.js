import store from './js/ui_state/store/index.js';
import MorphologySelect from './js/ui_state/components/morphology.js';
import ModelSelect from './js/ui_state/components/model_select.js';
import AgentsList from './js/ui_state/components/agents_list.js';
import RunButton from './js/ui_state/components/run_button.js';
import DrawSwitches from './js/ui_state/components/draw.js';

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

// Run button setup
const runButton = document.querySelector("#runButton");
runButton.addEventListener('click', () => {
    store.dispatch('toggleRun', {});
});
const runButtonInstance = new RunButton();
runButtonInstance.render();

// Reset button setup
const resetButton = document.querySelector("#resetButton");
resetButton.addEventListener('click', () => {
    store.dispatch('resetSimulation', {});
});

// Draw switches setup
const followAgentsSwitch = document.querySelector("#followAgentsSwitch")
followAgentsSwitch.addEventListener('input', () => {
    store.dispatch('toggleSwitch', {name: 'followAgents', value: followAgentsSwitch.checked});
});
const drawJointsSwitch = document.querySelector("#drawJointsSwitch")
drawJointsSwitch.addEventListener('input', () => {
    store.dispatch('toggleSwitch', {name: 'drawJoints', value: drawJointsSwitch.checked} );
});
const drawLidarsSwitch = document.querySelector("#drawLidarsSwitch")
drawLidarsSwitch.addEventListener('input', () => {
    store.dispatch('toggleSwitch', {name: 'drawLidars', value: drawLidarsSwitch.checked});
});
const drawSensorsSwitch = document.querySelector("#drawSensorsSwitch")
drawSensorsSwitch.addEventListener('input', () => {
    store.dispatch('toggleSwitch',  {name: 'drawSensors', value: drawSensorsSwitch.checked});
});
const drawNamesSwitch = document.querySelector("#drawNamesSwitch")
drawNamesSwitch.addEventListener('input', () => {
    store.dispatch('toggleSwitch', {name: 'drawNames', value: drawNamesSwitch.checked});
});
const drawSwitchesInstance = new DrawSwitches();
drawSwitchesInstance.render();

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

console.log(store)

// interaction with index.js
window.cancelAgentFollow = () => {
    store.dispatch('toggleSwitch', {name: 'followAgents', value: false});
}