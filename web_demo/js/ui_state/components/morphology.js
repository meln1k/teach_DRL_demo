import Component from '../lib/component.js';
import store from '../store/index.js';
export default class MorphologySelect extends Component {
    constructor() {
        super({
            store,
            element: document.querySelector('#morphology')
        });
    }
    render() {
        this.element.innerHTML = store.state.morphologies.map(m => `<option>${m.morphology}</option>`).join('');
        this.element.value = store.state.currentMorphology;
    }
};