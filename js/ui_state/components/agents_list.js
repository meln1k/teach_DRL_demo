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
                ${agent.name}                      
                <div class="form-check form-switch">
                        <input name="followSwitch" class="form-check-input" type="checkbox">
                        <label class="form-check-label" for="followAgentsSwitch">Follow</label>
                </div>
                <button name="savePositionButton" type="button" class="btn btn-primary btn-sm">Save position</button>
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
                //store.dispatch('saveAgentPosition', {index: index, value: span.checked});
            });
        });

        this.element.querySelectorAll('input[name="followSwitch"]').forEach((span, index) => {
            span.addEventListener('input', () => {
                store.dispatch('followAgent', {index: index, value: span.checked});
            });
            span.checked = store.state.simulationState.agentFollowed == window.game.env.agents[index];
        });
    }
};