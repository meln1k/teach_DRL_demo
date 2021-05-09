import Component from '../lib/component.js';
import store from '../store/index.js';
export default class RunButton extends Component {
    constructor() {
        super({
            store,
            element: document.querySelector('#runButton')
        });
    }
    render() {
        const status = store.state.simulationState.status;
        if (status == 'running') {
            this.element.className = "btn btn-warning";
            this.element.innerText = "Pause";
        } else if (status == 'paused') {
            this.element.className = "btn btn-success";
            this.element.innerText = "Resume";
        } else { // init
            this.element.className = "btn btn-success";
            this.element.innerText = "Start";
        }
    }
};