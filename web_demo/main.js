import store from './js/ui_state/store/index.js';
import MorphologySelect from './js/ui_state/components/morphology.js';
import ModelSelect from './js/ui_state/components/model_select.js';
import AgentsList from './js/ui_state/components/agents_list.js';


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

const agentListInstacne = new AgentsList();
agentListInstacne.render();

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
