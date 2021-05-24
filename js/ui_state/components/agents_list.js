import Component from '../lib/component.js';
import store from '../store/index.js';
export default class AgentsList extends Component {
    constructor() {
        super({
            store,
            element: document.querySelector('#agentsList')
        });
    }
    render() {
        this.element.innerHTML = store.state.agents.map(agent => {
            return `<li class="list-group-item d-flex justify-content-between align-items-center">
                <div class="form-group">
                    <input name="agentNameArea" type="text" class="form-control" placeholder=${agent.name}>
                </div>                  
                <div class="form-check form-switch">
                        <input name="followSwitch" class="form-check-input" type="checkbox">
                        <label class="form-check-label" for="followSwitch">Follow</label>
                </div>
              
                <label class="btn-group-label" for="positionButtonsGroup">Position:</label>
                <div name="positionButtonsGroup" class="btn-group" role="group">
                    <button name="savePositionButton" type="button" class="btn btn-primary btn-sm"><i class="far fa-save"></i></button>
                    <button name="resetPositionButton" type="button" class="btn btn-primary btn-sm"><i class="fas fa-undo-alt"></i></button> 
                </div>
                
                <button name="deleteButton" type="button" class="btn btn-danger btn-sm"><span class="fa fa-trash"></span></button>
            </li>`;
        }).join('');

        this.element.querySelectorAll('button[name="deleteButton"]').forEach((span, index) => {
            span.addEventListener('click', () => {
                store.dispatch('deleteAgent', { index });
            });
        });

        this.element.querySelectorAll('button[name="savePositionButton"]').forEach((span, index) => {
            span.addEventListener('click', () => {
                let agent = window.game.env.agents[index];
                agent.init_pos = agent.agent_body.reference_head_object.GetPosition().Clone();
            });
        });

        this.element.querySelectorAll('button[name="resetPositionButton"]').forEach((span, index) => {
            span.addEventListener('click', () => {
                let agent = window.game.env.agents[index];
                agent.init_pos = null;
            });
        });

        this.element.querySelectorAll('input[name="followSwitch"]').forEach((span, index) => {
            span.addEventListener('input', () => {
                store.dispatch('followAgent', {index: index, value: span.checked});
            });
            span.checked = store.state.simulationState.agentFollowed == window.game.env.agents[index];
        });

        this.element.querySelectorAll('input[name="agentNameArea"]').forEach((span, index) => {
            span.addEventListener('keydown', (event) => {
                if(event.keyCode == '13'){
                    store.dispatch('renameAgent', {index: index, value: span.value});
                }
            });
        });
    }
};