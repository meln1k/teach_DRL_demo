import Component from '../lib/component.js';
import store from '../store/index.js';
export default class DrawSwitches extends Component {
    constructor() {
        super({
            store,
            element: document.querySelector('#drawSelectors')
        });
    }
    render() {

        const state = store.state.simulationState;

        this.element.querySelector('#followAgentsSwitch').checked = state.followAgents;
        this.element.querySelector('#drawJointsSwitch').checked = state.drawJoints;
        this.element.querySelector('#drawLidarsSwitch').checked = state.drawLidars;
        this.element.querySelector('#drawSensorsSwitch').checked = state.drawSensors;
        this.element.querySelector('#drawNamesSwitch').checked = state.drawNames;

    }
};