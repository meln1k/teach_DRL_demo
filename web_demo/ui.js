import store from './js/ui_state/store/index.js';
import AgentsList from './js/ui_state/components/agents_list.js';
import MorphologySelect from './js/ui_state/components/morphology.js';

const formElement = document.querySelector('.agents-form');
const inputElement = document.querySelector('#new-item-field');
formElement.addEventListener('submit', evt => {
    evt.preventDefault();
    let value = inputElement.value.trim();
    if (value.length) {
        store.dispatch('addItem', value);
        inputElement.value = '';
        inputElement.focus();
    }
});
const listInstance = new AgentsList();
listInstance.render();

// document.querySelector('#morphology').addEventListener('onchange', evt => {

// });

const morphologySelectInstance = new MorphologySelect();
morphologySelectInstance.render();


fetch('./policies.json')
    .then(resp => resp.text().then(body => {
        window.agent_policies = JSON.parse(body);
        return window.agent_policies;
    }))
    .then(types => {

        types.forEach(type => {
            //console.log(type["type"]);
            //let type_group = createSelectOptGroup(type["type"]);
            //select.add(type_group);

            type["morphologies"].forEach(morphology => {
                store.dispatch('addMorphology', {
                    kind: morphology["morphology"],
                    models: 
                });
                //console.log(morphology["morphology"]);
                //let morph_group = createSelectOptGroup(morphology["morphology"]);
                // select_morphology.appendChild(createSelectOption(morphology["morphology"]));

                // if (morphologyDropdown.value == morphology["morphology"]) {
                //     morphology["seeds"].forEach(seed => {
                //         //console.log(seed["seed"] + ":" + seed["path"]);
                //         //morph_group.appendChild(createSelectOption(type["type"] + " > " + morphology["morphology"] + " > " + seed["seed"]));
                //         select_models.appendChild(createSelectOption(morphology["morphology"] + "_" + seed["seed"],
                //             seed["path"]));
                //     });
                // }
            });
        });

    });

console.log(store)
