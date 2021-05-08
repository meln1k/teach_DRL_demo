import Component from '../lib/component.js';
import store from '../store/index.js';
export default class MorphologySelect extends Component {
    constructor() {
        super({
            store,
            element: document.querySelector('#models')
        });
    }
    render() {
        this.element.innerHTML = store.state.morphologies.map(m => {
            return `<option value="${m.value}">${m.text}</option>`;
        }).join('');
    }
};