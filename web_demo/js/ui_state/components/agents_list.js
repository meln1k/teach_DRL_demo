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
                <button type="button" class="btn btn-primary btn-sm">Delete</button>
            </li>`;
        }).join('');

        this.element.querySelectorAll('button').forEach((span, index) => {
            span.addEventListener('click', () => {
                store.dispatch('deleteAgent', { index });
            });
        });
    }
};