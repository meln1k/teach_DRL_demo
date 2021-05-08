import Component from '../lib/component.js';
import store from '../store/index.js';
export default class AgentsList extends Component {
    constructor() {
        super({
            store,
            element: document.querySelector('.agents-list')
        });
    }
    render() {

        if (store.state.items.length === 0) {
            this.element.innerHTML = `<p class="no-items">No agents created yet.</p>`;
            return;
        }
        this.element.innerHTML = `
      <ul class="list-group">
        ${store.state.items.map(item => {
            return `
            <li class="list-group-item">${item}<button aria-label="Delete this agent">×</button></li>
          `
        }).join('')}
      </ul>
    `;
        this.element.querySelectorAll('button').forEach((button, index) => {
            button.addEventListener('click', () => {
                store.dispatch('clearItem', { index });
            });
        });
    }
};