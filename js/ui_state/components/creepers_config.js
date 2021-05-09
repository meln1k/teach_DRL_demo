import Component from '../lib/component.js';
import store from '../store/index.js';
export default class CreepersConfig extends Component {
    constructor() {
        super({
            store,
        });
    }
    render() {
        const creepersConfig = store.state.creepersConfig;

        document.querySelector("#creepersWidthSlider").value = creepersConfig.width;
        document.querySelector("#creepersHeightSlider").value = creepersConfig.height;
        document.querySelector("#creepersSpacingSlider").value = creepersConfig.spacing;

        document.querySelector("#creepersWidthValue").innerText = creepersConfig.width;
        document.querySelector("#creepersHeightValue").innerText = creepersConfig.height;
        document.querySelector("#creepersSpacingValue").innerText = creepersConfig.spacing;

        document.querySelector("#creepersType").value = creepersConfig.type;
    }
};