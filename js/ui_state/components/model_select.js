import Component from '../lib/component.js';
import store from '../store/index.js';
export default class ModelSelect extends Component {
    constructor() {
        super({
            store,
            element: document.querySelector('#models')
        });
    }
    render() {
        this.element.innerHTML = store.state.morphologies
            .filter(m => m.morphology == store.state.currentMorphology)
            .flatMap(morphology => morphology.seeds)
            .map(seedEntry => `<option value="${seedEntry.path}">${store.state.currentMorphology}_${seedEntry.seed}</option>`)
            .join('');
        this.element.selectedIndex = store.state.currentSeedIdx;
    }
};